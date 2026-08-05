import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

export async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    name = profile?.name ?? null;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/events" className="font-display text-2xl tracking-wide text-white">
          SMASH<span className="text-primary">RANK</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/events"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
          >
            Events
          </Link>
          <Link
            href="/community"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
          >
            Community
          </Link>
          <Link
            href="/profile"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
          >
            {name ? name.split(" ")[0] : "Profile"}
          </Link>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
