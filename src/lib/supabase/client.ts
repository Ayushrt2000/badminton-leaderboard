import { createBrowserClient } from "@supabase/ssr";

// Not typed against the generated Database schema on purpose: several queries
// in this app embed multiple foreign-key relationships to the same table
// (e.g. matches -> profiles via player1_id/player2_id/winner_id), which the
// hand-written types in `lib/types.ts` don't model. Use the exported row
// types from lib/types.ts to annotate results where useful.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
