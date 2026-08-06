"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateSchedule, computeTotalRounds } from "@/lib/scheduler";
import { GroupLeaderboard } from "@/components/GroupLeaderboard";
import { DevSeedControls } from "@/components/DevSeedControls";
import { RosterPanel } from "@/components/RosterPanel";
import { EventCoHosts, type EventCoHost } from "@/components/EventCoHosts";
import {
  RoundsBoard,
  type BoardRound,
  type BoardMatch,
  type SubstituteSlot,
} from "@/components/RoundsBoard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { SkillGroup, GroupLeaderboardRow } from "@/lib/types";

function firstOf<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

type RawParticipant = {
  id: string;
  profile_id: string;
  skill_group: SkillGroup;
  profiles: { id: string; name: string } | { id: string; name: string }[] | null;
};

type RawEventCourt = {
  id: string;
  court_id: string;
  skill_group: SkillGroup;
  courts: { id: string; name: string } | { id: string; name: string }[] | null;
};

type RawRound = { id: string; skill_group: SkillGroup; round_number: number; is_final: boolean };

type RawEventHost = {
  id: string;
  profile_id: string;
  profiles: { id: string; name: string } | { id: string; name: string }[] | null;
};

function normalizeEventHosts(rows: RawEventHost[]): EventCoHost[] {
  return rows.map((r) => ({
    id: r.id,
    profileId: r.profile_id,
    name: firstOf(r.profiles)?.name ?? "Unknown",
  }));
}

type RawRoundMatch = {
  id: string;
  round_id: string;
  team1_score: number | null;
  team2_score: number | null;
  courts: { name: string } | { name: string }[] | null;
  t1p1: { id: string; name: string } | { id: string; name: string }[] | null;
  t1p2: { id: string; name: string } | { id: string; name: string }[] | null;
  t2p1: { id: string; name: string } | { id: string; name: string }[] | null;
  t2p2: { id: string; name: string } | { id: string; name: string }[] | null;
};

type Participant = { id: string; profileId: string; name: string; skillGroup: SkillGroup };
type CourtAssignment = { id: string; courtId: string; courtName: string; skillGroup: SkillGroup };

function normalizeParticipants(rows: RawParticipant[]): Participant[] {
  return rows.map((r) => ({
    id: r.id,
    profileId: r.profile_id,
    name: firstOf(r.profiles)?.name ?? "Unknown",
    skillGroup: r.skill_group,
  }));
}

function normalizeCourts(rows: RawEventCourt[]): CourtAssignment[] {
  return rows.map((r) => ({
    id: r.id,
    courtId: r.court_id,
    courtName: firstOf(r.courts)?.name ?? "Court",
    skillGroup: r.skill_group,
  }));
}

function normalizeMatches(rows: RawRoundMatch[]): BoardMatch[] {
  // Sort by court name (numeric-aware: "Court 2" before "Court 10") so each
  // match always renders in the same slot, then by id as a stable
  // tiebreaker. Without this, matches re-fetched from Postgres on every live
  // score update can come back in a different order and the cards visually
  // jump around.
  const sorted = [...rows].sort((a, b) => {
    const courtCompare = (firstOf(a.courts)?.name ?? "").localeCompare(
      firstOf(b.courts)?.name ?? "",
      undefined,
      { numeric: true }
    );
    if (courtCompare !== 0) return courtCompare;
    return a.id.localeCompare(b.id);
  });

  return sorted.map((r) => ({
    id: r.id,
    round_id: r.round_id,
    court_name: firstOf(r.courts)?.name ?? null,
    team1: [firstOf(r.t1p1)?.name ?? "?", firstOf(r.t1p2)?.name ?? "?"],
    team2: [firstOf(r.t2p1)?.name ?? "?", firstOf(r.t2p2)?.name ?? "?"],
    team1Ids: [firstOf(r.t1p1)?.id ?? "", firstOf(r.t1p2)?.id ?? ""],
    team2Ids: [firstOf(r.t2p1)?.id ?? "", firstOf(r.t2p2)?.id ?? ""],
    team1_score: r.team1_score,
    team2_score: r.team2_score,
  }));
}

const MATCH_SELECT =
  "id, round_id, court_id, team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id, team1_score, team2_score, courts(name), " +
  "t1p1:profiles!round_matches_team1_player1_id_fkey(id,name), t1p2:profiles!round_matches_team1_player2_id_fkey(id,name), " +
  "t2p1:profiles!round_matches_team2_player1_id_fkey(id,name), t2p2:profiles!round_matches_team2_player2_id_fkey(id,name)";

export function EventControlCenter({
  event,
  isHost,
  initialParticipants,
  initialEventCourts,
  initialRounds,
  initialRoundMatches,
  initialLeaderboard,
  initialEventHosts,
}: {
  event: {
    id: string;
    community_id: string | null;
    max_participants: number;
    session_minutes: number;
    game_minutes: number;
    round_minutes: number;
    status: string;
  };
  isHost: boolean;
  initialParticipants: RawParticipant[];
  initialEventCourts: RawEventCourt[];
  initialRounds: RawRound[];
  initialRoundMatches: RawRoundMatch[];
  initialLeaderboard: GroupLeaderboardRow[];
  initialEventHosts: RawEventHost[];
}) {
  const [activeGroup, setActiveGroup] = useState<SkillGroup>("beginner");
  const [coHosts, setCoHosts] = useState<EventCoHost[]>(normalizeEventHosts(initialEventHosts));
  const [participants, setParticipants] = useState<Participant[]>(
    normalizeParticipants(initialParticipants)
  );
  const [courts, setCourts] = useState<CourtAssignment[]>(normalizeCourts(initialEventCourts));
  const [rounds, setRounds] = useState<RawRound[]>(initialRounds);
  const [matches, setMatches] = useState<BoardMatch[]>(normalizeMatches(initialRoundMatches));
  const [leaderboard, setLeaderboard] = useState<GroupLeaderboardRow[]>(initialLeaderboard);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxParticipants, setMaxParticipants] = useState(event.max_participants);
  const [editingMax, setEditingMax] = useState(false);
  const [maxInput, setMaxInput] = useState(String(event.max_participants));

  const refresh = useCallback(async () => {
    const supabase = createClient();

    const [{ data: p }, { data: ec }, { data: r }, { data: lb }] = await Promise.all([
      supabase
        .from("event_participants")
        .select("id, profile_id, skill_group, profiles(id, name)")
        .eq("event_id", event.id)
        .order("joined_at"),
      supabase
        .from("event_courts")
        .select("id, court_id, skill_group, courts(id, name)")
        .eq("event_id", event.id),
      supabase
        .from("rounds")
        .select("id, skill_group, round_number, is_final")
        .eq("event_id", event.id)
        .order("round_number"),
      supabase
        .from("event_group_leaderboard")
        .select("*")
        .eq("event_id", event.id)
        .order("point_diff", { ascending: false }),
    ]);

    if (p) setParticipants(normalizeParticipants(p));
    if (ec) setCourts(normalizeCourts(ec));
    if (r) setRounds(r);
    if (lb) setLeaderboard(lb);

    const { data: rm } = await supabase
      .from("round_matches")
      .select(MATCH_SELECT)
      .eq("event_id", event.id);
    if (rm) setMatches(normalizeMatches(rm as any));
  }, [event.id]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`event-${event.id}-live`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_participants", filter: `event_id=eq.${event.id}` },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "round_matches", filter: `event_id=eq.${event.id}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, refresh]);

  const groupParticipants = useMemo(
    () => participants.filter((p) => p.skillGroup === activeGroup),
    [participants, activeGroup]
  );
  const groupCourts = useMemo(
    () => courts.filter((c) => c.skillGroup === activeGroup),
    [courts, activeGroup]
  );
  const groupRounds = useMemo(
    () => rounds.filter((r) => r.skill_group === activeGroup),
    [rounds, activeGroup]
  );
  const groupRoundIds = useMemo(() => new Set(groupRounds.map((r) => r.id)), [groupRounds]);
  const groupMatches = useMemo(
    () => matches.filter((m) => groupRoundIds.has(m.round_id)),
    [matches, groupRoundIds]
  );
  const groupLeaderboard = useMemo(
    () => leaderboard.filter((row) => row.skill_group === activeGroup),
    [leaderboard, activeGroup]
  );
  const courtsAreSplit = useMemo(() => {
    const groupsByCourtId = new Map<string, Set<SkillGroup>>();
    for (const c of courts) {
      if (!groupsByCourtId.has(c.courtId)) groupsByCourtId.set(c.courtId, new Set());
      groupsByCourtId.get(c.courtId)!.add(c.skillGroup);
    }
    return !Array.from(groupsByCourtId.values()).some((groups) => groups.size > 1);
  }, [courts]);

  const hasFinal = groupRounds.some((r) => r.is_final);
  const totalRounds = computeTotalRounds(event.game_minutes, event.round_minutes);
  const isClosed = event.status === "completed";
  const canManage = isHost && !isClosed;

  // Prefer showing the court numbers (e.g. "1 & 2") over a plain count -
  // falls back to full court names if they aren't numbered.
  const courtLabel =
    groupCourts.length === 0
      ? "0"
      : groupCourts
          .map((c) => c.courtName.match(/\d+/)?.[0] ?? c.courtName)
          .join(" & ");

  async function handleUpdateMaxParticipants() {
    const value = Number(maxInput);
    if (!value || value < 1) {
      setError("Enter a valid number of max players.");
      return;
    }
    if (value < participants.length) {
      setError(`Max players can't be less than the ${participants.length} already joined.`);
      return;
    }

    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("events")
      .update({ max_participants: value })
      .eq("id", event.id);
    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMaxParticipants(value);
    setEditingMax(false);
  }

  async function handleSetCourtsSplit(nextSplit: boolean) {
    if (!event.community_id) {
      setError("This event has no community, so courts can't be reassigned.");
      return;
    }

    setBusy(true);
    setError(null);
    const supabase = createClient();

    const { data: communityCourts, error: courtsError } = await supabase
      .from("courts")
      .select("id")
      .eq("community_id", event.community_id)
      .order("name");

    if (courtsError) {
      setBusy(false);
      setError(courtsError.message);
      return;
    }
    if (!communityCourts || communityCourts.length === 0) {
      setBusy(false);
      setError("No courts set up for this community yet.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("event_courts")
      .delete()
      .eq("event_id", event.id);
    if (deleteError) {
      setBusy(false);
      setError(deleteError.message);
      return;
    }

    const rows = nextSplit
      ? communityCourts.map((c, i) => ({
          event_id: event.id,
          court_id: c.id,
          skill_group: i < Math.ceil(communityCourts.length / 2) ? "beginner" : "advanced",
        }))
      : communityCourts.flatMap((c) => [
          { event_id: event.id, court_id: c.id, skill_group: "beginner" },
          { event_id: event.id, court_id: c.id, skill_group: "advanced" },
        ]);

    const { error: insertError } = await supabase.from("event_courts").insert(rows);
    setBusy(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }
    await refresh();
  }

  async function handleStartRoundRobin() {
    setError(null);
    if (groupParticipants.length < 4) {
      setError("Need at least 4 players in this group to start.");
      return;
    }
    if (groupCourts.length === 0) {
      setError("Assign at least one court to this group first (from the Courts page).");
      return;
    }

    setBusy(true);
    const schedule = generateSchedule({
      playerIds: groupParticipants.map((p) => p.profileId),
      courtIds: groupCourts.map((c) => c.courtId),
      totalRounds,
    });

    if (schedule.length === 0) {
      setBusy(false);
      setError("Couldn't build a schedule with the current players/courts.");
      return;
    }

    const supabase = createClient();
    const { data: insertedRounds, error: roundsError } = await supabase
      .from("rounds")
      .insert(
        schedule.map((r) => ({
          event_id: event.id,
          skill_group: activeGroup,
          round_number: r.roundNumber,
        }))
      )
      .select("id, round_number");

    if (roundsError || !insertedRounds) {
      setBusy(false);
      setError(roundsError?.message ?? "Failed to create rounds.");
      return;
    }

    const roundIdByNumber = new Map(insertedRounds.map((r) => [r.round_number, r.id]));
    const matchRows = schedule.flatMap((r) =>
      r.matches.map((m) => ({
        round_id: roundIdByNumber.get(r.roundNumber)!,
        event_id: event.id,
        court_id: m.courtId,
        team1_player1_id: m.team1[0],
        team1_player2_id: m.team1[1],
        team2_player1_id: m.team2[0],
        team2_player2_id: m.team2[1],
      }))
    );

    const { error: matchesError } = await supabase.from("round_matches").insert(matchRows);
    if (matchesError) {
      setBusy(false);
      setError(matchesError.message);
      return;
    }

    if (event.status === "lobby") {
      await supabase.from("events").update({ status: "in_progress" }).eq("id", event.id);
    }

    await refresh();
    setBusy(false);
  }

  async function handleScoreChange(
    matchId: string,
    team1Score: number | null,
    team2Score: number | null
  ) {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, team1_score: team1Score, team2_score: team2Score } : m))
    );
    const supabase = createClient();
    await supabase
      .from("round_matches")
      .update({ team1_score: team1Score, team2_score: team2Score })
      .eq("id", matchId);

    const { data: lb } = await supabase
      .from("event_group_leaderboard")
      .select("*")
      .eq("event_id", event.id)
      .order("point_diff", { ascending: false });
    if (lb) setLeaderboard(lb);
  }

  async function handleMoveParticipant(participantId: string, newGroup: SkillGroup) {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, skillGroup: newGroup } : p))
    );
    const supabase = createClient();
    const { error } = await supabase
      .from("event_participants")
      .update({ skill_group: newGroup })
      .eq("id", participantId);
    if (error) setError(error.message);
  }

  async function handleAddCoHost(profileId: string) {
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("event_hosts")
      .insert({ event_id: event.id, profile_id: profileId })
      .select("id, profile_id")
      .single();
    if (error || !data) {
      setError(error?.message ?? "Failed to add co-host.");
      return;
    }
    const name = participants.find((p) => p.profileId === profileId)?.name ?? "Unknown";
    setCoHosts((prev) => [...prev, { id: data.id, profileId: data.profile_id, name }]);
  }

  async function handleRemoveCoHost(rowId: string) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("event_hosts").delete().eq("id", rowId);
    if (error) {
      setError(error.message);
      return;
    }
    setCoHosts((prev) => prev.filter((ch) => ch.id !== rowId));
  }

  async function handleSubstitute(matchId: string, slot: SubstituteSlot, newPlayerId: string) {
    const columnMap: Record<SubstituteSlot, string> = {
      t1p1: "team1_player1_id",
      t1p2: "team1_player2_id",
      t2p1: "team2_player1_id",
      t2p2: "team2_player2_id",
    };
    const newName = participants.find((p) => p.profileId === newPlayerId)?.name ?? "?";

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        const updated: BoardMatch = {
          ...m,
          team1: [...m.team1] as [string, string],
          team2: [...m.team2] as [string, string],
          team1Ids: [...m.team1Ids] as [string, string],
          team2Ids: [...m.team2Ids] as [string, string],
        };
        if (slot === "t1p1") {
          updated.team1[0] = newName;
          updated.team1Ids[0] = newPlayerId;
        } else if (slot === "t1p2") {
          updated.team1[1] = newName;
          updated.team1Ids[1] = newPlayerId;
        } else if (slot === "t2p1") {
          updated.team2[0] = newName;
          updated.team2Ids[0] = newPlayerId;
        } else {
          updated.team2[1] = newName;
          updated.team2Ids[1] = newPlayerId;
        }
        return updated;
      })
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("round_matches")
      .update({ [columnMap[slot]]: newPlayerId })
      .eq("id", matchId);
    if (error) {
      setError(error.message);
      await refresh();
    }
  }

  async function handleRebuildRemainingRounds() {
    setError(null);
    if (groupParticipants.length < 4) {
      setError("Need at least 4 players in this group to rebuild.");
      return;
    }
    if (groupCourts.length === 0) {
      setError("Assign at least one court to this group first.");
      return;
    }

    setBusy(true);
    const supabase = createClient();

    const nonFinalRounds = groupRounds.filter((r) => !r.is_final);
    const roundIds = nonFinalRounds.map((r) => r.id);

    const { data: existingMatches, error: fetchError } = roundIds.length
      ? await supabase
          .from("round_matches")
          .select(
            "id, round_id, team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id, team1_score, team2_score"
          )
          .in("round_id", roundIds)
      : { data: [], error: null };

    if (fetchError) {
      setBusy(false);
      setError(fetchError.message);
      return;
    }

    const scoredRoundIds = new Set(
      (existingMatches ?? [])
        .filter((m) => m.team1_score !== null || m.team2_score !== null)
        .map((m) => m.round_id)
    );

    const playedRounds = nonFinalRounds.filter((r) => scoredRoundIds.has(r.id));
    const unplayedRounds = nonFinalRounds.filter((r) => !scoredRoundIds.has(r.id));

    const history = (existingMatches ?? [])
      .filter((m) => scoredRoundIds.has(m.round_id))
      .map((m) => ({
        team1: [m.team1_player1_id, m.team1_player2_id] as [string, string],
        team2: [m.team2_player1_id, m.team2_player2_id] as [string, string],
      }));

    const unplayedRoundIds = unplayedRounds.map((r) => r.id);
    if (unplayedRoundIds.length > 0) {
      const { error: delMatchesError } = await supabase
        .from("round_matches")
        .delete()
        .in("round_id", unplayedRoundIds);
      if (delMatchesError) {
        setBusy(false);
        setError(delMatchesError.message);
        return;
      }
      const { error: delRoundsError } = await supabase
        .from("rounds")
        .delete()
        .in("id", unplayedRoundIds);
      if (delRoundsError) {
        setBusy(false);
        setError(delRoundsError.message);
        return;
      }
    }

    const targetTotalRounds = computeTotalRounds(event.game_minutes, event.round_minutes);
    const remainingRounds = Math.max(1, targetTotalRounds - playedRounds.length);
    const startingRoundNumber = Math.max(0, ...playedRounds.map((r) => r.round_number)) + 1;

    const schedule = generateSchedule({
      playerIds: groupParticipants.map((p) => p.profileId),
      courtIds: groupCourts.map((c) => c.courtId),
      totalRounds: remainingRounds,
      startingRoundNumber,
      history,
    });

    if (schedule.length === 0) {
      setBusy(false);
      setError("Couldn't build a schedule with the current players/courts.");
      return;
    }

    const { data: insertedRounds, error: roundsError } = await supabase
      .from("rounds")
      .insert(
        schedule.map((r) => ({
          event_id: event.id,
          skill_group: activeGroup,
          round_number: r.roundNumber,
        }))
      )
      .select("id, round_number");

    if (roundsError || !insertedRounds) {
      setBusy(false);
      setError(roundsError?.message ?? "Failed to create rounds.");
      return;
    }

    const roundIdByNumber = new Map(insertedRounds.map((r) => [r.round_number, r.id]));
    const matchRows = schedule.flatMap((r) =>
      r.matches.map((m) => ({
        round_id: roundIdByNumber.get(r.roundNumber)!,
        event_id: event.id,
        court_id: m.courtId,
        team1_player1_id: m.team1[0],
        team1_player2_id: m.team1[1],
        team2_player1_id: m.team2[0],
        team2_player2_id: m.team2[1],
      }))
    );

    const { error: matchesError } = await supabase.from("round_matches").insert(matchRows);
    if (matchesError) {
      setBusy(false);
      setError(matchesError.message);
      return;
    }

    await refresh();
    setBusy(false);
  }

  async function handleRemoveParticipant(participantId: string) {
    const previous = participants;
    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    const supabase = createClient();
    const { error } = await supabase
      .from("event_participants")
      .delete()
      .eq("id", participantId);
    if (error) {
      setParticipants(previous);
      setError(error.message);
    }
  }

  async function handleStartFinal() {
    if (groupLeaderboard.length < 4 || groupCourts.length === 0) return;
    setBusy(true);
    setError(null);

    const top4 = groupLeaderboard.slice(0, 4);
    const nextRoundNumber = Math.max(0, ...groupRounds.map((r) => r.round_number)) + 1;

    const supabase = createClient();
    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .insert({
        event_id: event.id,
        skill_group: activeGroup,
        round_number: nextRoundNumber,
        is_final: true,
      })
      .select("id")
      .single();

    if (roundError || !round) {
      setBusy(false);
      setError(roundError?.message ?? "Failed to create the final.");
      return;
    }

    const { error: matchError } = await supabase.from("round_matches").insert({
      round_id: round.id,
      event_id: event.id,
      court_id: groupCourts[0].courtId,
      team1_player1_id: top4[0].player_id,
      team1_player2_id: top4[3].player_id,
      team2_player1_id: top4[1].player_id,
      team2_player2_id: top4[2].player_id,
    });

    if (matchError) {
      setBusy(false);
      setError(matchError.message);
      return;
    }

    await refresh();
    setBusy(false);
  }

  return (
    <div>
      {canManage && (
        <div className="mb-1 flex flex-wrap items-start gap-2">
          <RosterPanel
            participants={participants}
            onMove={handleMoveParticipant}
            onRemove={handleRemoveParticipant}
          />
          <EventCoHosts
            coHosts={coHosts}
            candidates={participants.map((p) => ({ profileId: p.profileId, name: p.name }))}
            onAdd={handleAddCoHost}
            onRemove={handleRemoveCoHost}
          />
          <DevSeedControls eventId={event.id} onChanged={refresh} />
          <div className="w-full rounded-xl border border-border bg-surface px-3 py-2 sm:w-auto">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Courts
            </p>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={courtsAreSplit}
                disabled={busy}
                onChange={(e) => handleSetCourtsSplit(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Split by skill level
            </label>
            <p className="mt-1 max-w-[13rem] text-[11px] text-white/40">
              {courtsAreSplit
                ? "Courts are divided between beginner and advanced."
                : "Every court is shared by both groups."}
            </p>
          </div>
        </div>
      )}

      {isClosed && (
        <p className="mb-4 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-white/50">
          This event is closed. Scores and rosters are read-only.
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["beginner", "advanced"] as SkillGroup[]).map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                activeGroup === g
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-surface text-white/50 hover:text-white"
              }`}
            >
              {g} ({participants.filter((p) => p.skillGroup === g).length})
            </button>
          ))}
        </div>
        {canManage && editingMax ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={participants.length}
              autoFocus
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              className="w-16 rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-white outline-none focus:border-primary"
            />
            <Button size="sm" disabled={busy} onClick={handleUpdateMaxParticipants}>
              Save
            </Button>
            <button
              onClick={() => {
                setEditingMax(false);
                setMaxInput(String(maxParticipants));
                setError(null);
              }}
              className="text-xs font-semibold text-white/40 hover:text-white/70"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!canManage}
            onClick={() => canManage && setEditingMax(true)}
            className={canManage ? "cursor-pointer" : "cursor-default"}
          >
            <Badge tone="default">
              {participants.length} / {maxParticipants} joined
              {canManage && <span className="ml-1.5 text-white/40">· Edit</span>}
            </Badge>
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-primary">{error}</p>}

      {/* Single centered column instead of a left/right split — the round
          cards are the primary content, so they sit centered on the page
          with a comfortable max width, and the leaderboard sits below them
          instead of off to the side. */}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="space-y-6">
          {groupRounds.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="!pt-10 !pb-10">
                <div className="mx-auto grid max-w-xs grid-cols-3 divide-x divide-border text-center">
                  <div className="px-2">
                    <div className="flex h-11 items-end justify-center">
                      <p className="font-display text-4xl leading-none text-white">
                        {groupParticipants.length}
                      </p>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                      Player{groupParticipants.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="px-2">
                    <div className="flex h-11 items-end justify-center">
                      <p className="font-display whitespace-nowrap text-3xl leading-none text-white">
                        {courtLabel}
                      </p>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                      Court{groupCourts.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="px-2">
                    <div className="flex h-11 items-end justify-center">
                      <p className="font-display text-4xl leading-none text-accent">{totalRounds}</p>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                      Rounds
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-white/30">
                  {event.round_minutes} min rounds &middot; {event.game_minutes} min game time
                </p>

                <div className="mt-6 flex flex-col items-center gap-3 border-t border-border pt-6">
                  {canManage ? (
                    <Button variant="accent" disabled={busy} onClick={handleStartRoundRobin}>
                      {busy ? "Building schedule..." : "Start round robin"}
                    </Button>
                  ) : (
                    <>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-xl leading-none">
                        ⏳
                      </span>
                      <p className="text-sm text-white/40">
                        {isClosed
                          ? "This event is closed."
                          : "Waiting for the host to start this group."}
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <RoundsBoard
              rounds={groupRounds as BoardRound[]}
              matches={groupMatches}
              isHost={canManage}
              onScoreChange={handleScoreChange}
              eligiblePlayers={groupParticipants.map((p) => ({ id: p.profileId, name: p.name }))}
              onSubstitute={handleSubstitute}
            />
          )}

          {canManage && groupRounds.length > 0 && !hasFinal && (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={handleRebuildRemainingRounds}
                className="text-xs font-semibold text-white/40 underline decoration-dotted hover:text-white/70 disabled:opacity-50"
              >
                {busy ? "Rebuilding..." : "Rebuild remaining rounds (new/removed players)"}
              </button>
            </div>
          )}

          {canManage && groupRounds.length > 0 && !hasFinal && groupLeaderboard.length >= 4 && (
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <p className="text-sm text-white/60">
                  Round robin done? Start the final with the top 4 by point difference:{" "}
                  <span className="text-white">
                    {groupLeaderboard[0].player_name} &amp; {groupLeaderboard[3].player_name}
                  </span>{" "}
                  vs{" "}
                  <span className="text-white">
                    {groupLeaderboard[1].player_name} &amp; {groupLeaderboard[2].player_name}
                  </span>
                </p>
                <Button variant="accent" size="sm" disabled={busy} onClick={handleStartFinal}>
                  Start final
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <GroupLeaderboard rows={groupLeaderboard} />
      </div>
    </div>
  );
}
