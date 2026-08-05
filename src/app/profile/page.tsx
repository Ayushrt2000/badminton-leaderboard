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
    .select("name, phone, email, community_id, communities(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/complete-profile");

  const communityName = (profile as unknown as { communities: { name: string } | null })
    .communities?.name;

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
      </main>
    </>
  );
}
