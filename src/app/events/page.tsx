import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { CreateEventForm } from "@/components/CreateEventForm";
import { EventCard } from "@/components/EventCard";
import { EmptyEventsState } from "@/components/EmptyEventsState";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, community_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/complete-profile");

  const [{ data: events }, { data: community }, { data: coHostRow }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, event_date, host_id, profiles!events_host_id_fkey(name), communities(name)")
      .order("event_date", { ascending: false }),
    profile.community_id
      ? supabase
          .from("communities")
          .select("host_id, profiles!communities_host_id_fkey(name)")
          .eq("id", profile.community_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    profile.community_id
      ? supabase
          .from("community_hosts")
          .select("id")
          .eq("community_id", profile.community_id)
          .eq("profile_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const communityHost = Array.isArray(community?.profiles)
    ? community?.profiles[0]
    : community?.profiles;
  const isCommunityHost =
    !!profile.community_id && (community?.host_id === profile.id || !!coHostRow);

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-wide text-white">Events</h1>
            <p className="mt-1 text-sm text-white/50">
              Live leaderboards for every social. Host one to get started.
            </p>
          </div>
        </div>

        {isCommunityHost && <CreateEventForm hostId={profile.id} communityId={profile.community_id} />}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {(events ?? []).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {(events ?? []).length === 0 && (
          <div className="mt-8">
            <EmptyEventsState
              hasCommunity={!!profile.community_id}
              isHost={isCommunityHost}
              hostName={communityHost?.name}
            />
          </div>
        )}
      </main>
    </>
  );
}
