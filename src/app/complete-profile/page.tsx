import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompleteProfileForm } from "@/components/CompleteProfileForm";

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(next ? `/?next=${encodeURIComponent(next)}` : "/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) redirect(next || "/events");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl tracking-wide text-white">
            One quick step
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Tell us your name so we know who&apos;s on the leaderboard.
          </p>
        </div>
        <CompleteProfileForm userId={user.id} userEmail={user.email ?? null} next={next} />
      </div>
    </main>
  );
}
