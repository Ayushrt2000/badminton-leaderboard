import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { EventControlCenter } from "@/components/EventControlCenter";
import { Badge } from "@/components/ui/Badge";
import { ShareJoinLink } from "@/components/ShareJoinLink";
import { EventSettingsMenu } from "@/components/EventSettingsMenu";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/complete-profile");

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, name, event_date, host_id, community_id, max_participants, session_minutes, game_minutes, round_minutes, status, profiles!events_host_id_fkey(name), communities(name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!event) notFound();

  const host = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles;
  const community = Array.isArray(event.communities) ? event.communities[0] : event.communities;

  const [
    { data: participants },
    { data: eventCourts },
    { data: rounds },
    { data: leaderboardRows },
    { data: eventHosts },
  ] = await Promise.all([
    supabase
      .from("event_participants")
      .select("id, profile_id, skill_group, profiles(id, name)")
      .eq("event_id", id)
      .order("joined_at"),
    supabase
      .from("event_courts")
      .select("id, court_id, skill_group, courts(id, name)")
      .eq("event_id", id),
    supabase
      .from("rounds")
      .select("id, skill_group, round_number, is_final")
      .eq("event_id", id)
      .order("round_number"),
    supabase
      .from("event_group_leaderboard")
      .select("*")
      .eq("event_id", id)
      .order("point_diff", { ascending: false }),
    supabase
      .from("event_hosts")
      .select("id, profile_id, profiles!event_hosts_profile_id_fkey(id, name)")
      .eq("event_id", id),
  ]);

  const isCoHost = (eventHosts ?? []).some((h) => h.profile_id === user.id);
  const isHost = event.host_id === user.id || isCoHost;

  const roundIds = (rounds ?? []).map((r) => r.id);
  const { data: roundMatches } = roundIds.length
    ? await supabase
        .from("round_matches")
        .select(
          "id, round_id, court_id, team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id, team1_score, team2_score, courts(name), " +
            "t1p1:profiles!round_matches_team1_player1_id_fkey(id,name), t1p2:profiles!round_matches_team1_player2_id_fkey(id,name), " +
            "t2p1:profiles!round_matches_team2_player1_id_fkey(id,name), t2p2:profiles!round_matches_team2_player2_id_fkey(id,name)"
        )
        .in("round_id", roundIds)
    : { data: [] };

  const isParticipant = (participants ?? []).some((p) => p.profile_id === profile.id);

  const date = new Date(event.event_date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{date}</p>
              <h1 className="mt-1 font-display text-4xl tracking-wide text-white">{event.name}</h1>
              <p className="mt-2 text-sm text-white/45">
                Hosted by <span className="text-white/70">{host?.name}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {community && <Badge tone="accent">{community.name}</Badge>}
              {event.host_id === user.id && <Badge tone="default">You&apos;re hosting</Badge>}
              {isCoHost && <Badge tone="default">You&apos;re co-hosting</Badge>}
              {event.status === "completed" && <Badge tone="loss">Closed</Badge>}
              {!isHost && <ShareJoinLink eventId={event.id} compact />}
            </div>
          </div>

          {isHost && (
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
              <ShareJoinLink eventId={event.id} />
              <EventSettingsMenu eventId={event.id} status={event.status} />
            </div>
          )}
        </div>

        {!isParticipant && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xl leading-none">
                🏸
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  {isHost ? "You haven't joined as a player yet" : "You haven't joined this event yet"}
                </p>
                <p className="text-xs text-white/45">
                  Pick your skill group and get on the roster.
                </p>
              </div>
            </div>
            <Link
              href={`/events/${event.id}/join`}
              className="shrink-0 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:brightness-95"
            >
              Join now
            </Link>
          </div>
        )}

        <EventControlCenter
          event={event}
          isHost={isHost}
          initialParticipants={participants ?? []}
          initialEventCourts={eventCourts ?? []}
          initialRounds={rounds ?? []}
          initialRoundMatches={roundMatches ?? []}
          initialLeaderboard={leaderboardRows ?? []}
          initialEventHosts={eventHosts ?? []}
        />
      </main>
    </>
  );
}
