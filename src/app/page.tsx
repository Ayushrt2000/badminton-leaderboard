import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignInForm } from "@/components/SignInForm";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      redirect(next || "/events");
    }
    redirect(next ? `/complete-profile?next=${encodeURIComponent(next)}` : "/complete-profile");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            Badminton Socials
          </div>
          <h1 className="font-display text-5xl leading-none tracking-wide text-white">
            SMASH<span className="text-primary">RANK</span>
          </h1>
          <p className="mt-3 text-sm text-white/50">
            Live leaderboards for your badminton meetups. Sign up, play, climb the ranks.
          </p>
        </div>
        <SignInForm next={next} />
      </div>
    </main>
  );
}
