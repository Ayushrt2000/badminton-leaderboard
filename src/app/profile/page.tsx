import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, email, community_id, communities!profiles_community_id_fkey(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/complete-profile");

  const communityName = (profile as unknown as { communities: { name: string } | null })
    .communities?.name;

  const { data: participations } = await supabase
    .from("event_participants")
    .select("event_id, skill_group, joined_at, events(id, name, event_date, status)")
    .eq("profile_id", user.id)
    .order("joined_at", { ascending: false });

  const eventIds = (participations ?? []).map((p) => p.event_id);

  const { data: stats } = eventIds.length
    ? await supabase
        .from("event_leaderboard")
        .select("event_id, matches_played, wins, losses, points, point_diff")
        .eq("player_id", user.id)
        .in("event_id", eventIds)
    : { data: [] };

  type EventInfo = { id: string; name: string; event_date: string; status: string };
  type StatRow = {
    event_id: string;
    matches_played: number;
    wins: number;
    losses: number;
    points: number;
    point_diff: number;
  };

  const statsByEvent = new Map<string, StatRow>((stats ?? []).map((s) => [s.event_id, s]));

  const history = (participations ?? [])
    .map((p) => {
      const event = (Array.isArray(p.events) ? p.events[0] : p.events) as EventInfo | null;
      if (!event) return null;
      const stat = statsByEvent.get(p.event_id);
      return {
        eventId: event.id,
        name: event.name,
        date: event.event_date,
        status: event.status,
        skillGroup: p.skill_group,
        matchesPlayed: stat?.matches_played ?? 0,
        wins: stat?.wins ?? 0,
        losses: stat?.losses ?? 0,
        points: stat?.points ?? 0,
      };
    })
    .filter((h): h is NonNullable<typeof h> => h !== null);

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-md px-6 py-12">
        <h1 className="font-display text-4xl tracking-wide text-white">Profile</h1>
        <Card className="mt-6">
          <CardContent className="pt-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-2xl text-primary">
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="font-display text-2xl leading-tight text-white">
                  {profile.name}
                </p>
                {communityName && <Badge tone="accent" className="mt-1">{communityName}</Badge>}
              </div>
            </div>
            <dl className="space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/40">Email</dt>
                <dd className="text-white">{profile.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/40">Phone</dt>
                <dd className="text-white">{profile.phone ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <h2 className="mt-10 font-display text-2xl tracking-wide text-white">Event History</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-white/45">
            You haven&apos;t joined any events yet. Join one to see your match history and stats
            here.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {history.map((h) => (
              <Card key={h.eventId}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <a
                        href={`/events/${h.eventId}`}
                        className="font-display text-lg tracking-wide text-white hover:text-primary"
                      >
                        {h.name}
                      </a>
                      <p className="mt-0.5 text-xs text-white/40">
                        {new Date(h.date + "T00:00:00").toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {h.skillGroup}
                      </p>
                    </div>
                    <Badge tone={h.status === "completed" ? "default" : "accent"}>
                      {h.status === "completed" ? "Closed" : "Live"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 border-t border-border pt-3 text-center text-xs">
                    <div>
                      <p className="text-white/40">Played</p>
                      <p className="mt-0.5 font-semibold text-white">{h.matchesPlayed}</p>
                    </div>
                    <div>
                      <p className="text-white/40">Wins</p>
                      <p className="mt-0.5 font-semibold text-white">{h.wins}</p>
                    </div>
                    <div>
                      <p className="text-white/40">Losses</p>
                      <p className="mt-0.5 font-semibold text-white">{h.losses}</p>
                    </div>
                    <div>
                      <p className="text-white/40">Points</p>
                      <p className="mt-0.5 font-semibold text-primary">{h.points}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
