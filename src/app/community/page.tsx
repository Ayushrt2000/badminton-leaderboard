import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { CommunityManager } from "@/components/CommunityManager";
import { isCommunityAdmin } from "@/lib/admins";

export default async function CommunityPage() {
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

  const [{ data: communities }, { data: courts }, { data: communityHostRows }, { data: members }] =
    await Promise.all([
      supabase.from("communities").select("id, name, host_id").order("name"),
      supabase.from("courts").select("id, community_id, name").order("name"),
      supabase
        .from("community_hosts")
        .select("id, community_id, profile_id, profiles!community_hosts_profile_id_fkey(name)"),
      supabase
        .from("profiles")
        .select("id, name, community_id")
        .not("community_id", "is", null)
        .order("name"),
    ]);

  const communityHosts = (communityHostRows ?? []).map((row) => {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      communityId: row.community_id,
      profileId: row.profile_id,
      name: p?.name ?? "Unknown",
    };
  });

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl tracking-wide text-white">Communities</h1>
        <p className="mt-2 text-sm text-white/50">
          Courts set up for a community are what hosts choose from when scheduling rounds for
          an event.
        </p>

        <CommunityManager
          isAdmin={isCommunityAdmin(user.email)}
          myProfileId={profile.id}
          myCommunityId={profile.community_id}
          initialCommunities={communities ?? []}
          initialCourts={courts ?? []}
          initialCommunityHosts={communityHosts}
          initialMembers={(members ?? []).map((m) => ({
            id: m.id,
            name: m.name,
            communityId: m.community_id as string,
          }))}
        />
      </main>
    </>
  );
}
