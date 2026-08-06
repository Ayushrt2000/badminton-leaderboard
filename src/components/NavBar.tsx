import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavMenu } from "@/components/NavMenu";

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
      <div className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/events" className="font-display text-xl tracking-wide text-white sm:text-2xl">
          SMASH<span className="text-primary">RANK</span>
        </Link>
        <NavMenu name={name} />
      </div>
    </header>
  );
}
