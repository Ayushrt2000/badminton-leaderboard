"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Leaderboard } from "@/components/Leaderboard";
import { MatchLogForm } from "@/components/MatchLogForm";
import { MatchesList, type MatchWithPlayers } from "@/components/MatchesList";
import type { LeaderboardRow } from "@/lib/types";

type PlayerOption = { id: string; name: string };

export function EventLive({
  eventId,
  hostId,
  isHost,
  players,
  initialLeaderboard,
  initialMatches,
}: {
  eventId: string;
  hostId: string;
  isHost: boolean;
  players: PlayerOption[];
  initialLeaderboard: LeaderboardRow[];
  initialMatches: MatchWithPlayers[];
}) {
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [matches, setMatches] = useState(initialMatches);

  const refresh = useCallback(async () => {
    const supabase = createClient();

    const [{ data: lb }, { data: ms }] = await Promise.all([
      supabase
        .from("event_leaderboard")
        .select("*")
        .eq("event_id", eventId)
        .order("points", { ascending: false })
        .order("point_diff", { ascending: false }),
      supabase
        .from("matches")
        .select(
          "id, player1_score, player2_score, winner_id, created_at, player1:profiles!matches_player1_id_fkey(id,name), player2:profiles!matches_player2_id_fkey(id,name)"
        )
        .eq("event_id", eventId)
        .order("created_at", { ascending: false }),
    ]);

    if (lb) setLeaderboard(lb);
    if (ms) setMatches(ms as unknown as MatchWithPlayers[]);
  }, [eventId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`event-${eventId}-matches`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `event_id=eq.${eventId}` },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, refresh]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <Leaderboard rows={leaderboard} />
        <MatchesList matches={matches} />
      </div>
      <div>
        {isHost ? (
          <MatchLogForm
            eventId={eventId}
            hostId={hostId}
            players={players}
            onLogged={refresh}
          />
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-white/50">
            Only the host can log matches for this event. Ask them to add results as you play —
            the leaderboard updates instantly for everyone watching.
          </div>
        )}
      </div>
    </div>
  );
}
