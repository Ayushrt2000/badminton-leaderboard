import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { JoinEventForm } from "@/components/JoinEventForm";
import { Card, CardContent } from "@/components/ui/Card";

export default async function JoinEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const joinPath = `/events/${id}/join`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/?next=${encodeURIComponent(joinPath)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, community_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect(`/complete-profile?next=${encodeURIComponent(joinPath)}`);

  const { data: event } = await supabase
    .from("events")
    .select("id, name, event_date, max_participants, community_id, profiles!events_host_id_fkey(name)")
    .eq("id", id)
    .maybeSingle();

  if (!event) notFound();

  const { data: existing } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", id)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existing) redirect(`/events/${id}`);

  const { count } = await supabase
    .from("event_participants")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);

  const host = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles;
  const spotsLeft = event.max_participants - (count ?? 0);

  const date = new Date(event.event_date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-md px-6 py-12">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{date}</p>
            <h1 className="mt-1 font-display text-3xl tracking-wide text-white">{event.name}</h1>
            <p className="mt-1 text-sm text-white/45">
              Hosted by <span className="text-white/70">{host?.name}</span>
            </p>

            {spotsLeft <= 0 ? (
              <p className="mt-6 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-white/60">
                This event is full ({event.max_participants} players).
              </p>
            ) : (
              <>
                <p className="mt-4 text-sm text-white/50">
                  {spotsLeft} of {event.max_participants} spots left. Pick your skill group to
                  join.
                </p>
                <JoinEventForm
                  eventId={id}
                  profileId={profile.id}
                  eventCommunityId={event.community_id}
                  hasCommunity={!!profile.community_id}
                />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
