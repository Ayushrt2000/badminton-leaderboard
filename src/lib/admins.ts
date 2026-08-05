// Email allowlist for who can create communities. Mirrors the
// `communities_insert_admins_only` RLS policy in Supabase - this is only
// used to decide whether to show the "create community" UI. The real
// enforcement lives in the database policy, not here.
const COMMUNITY_ADMIN_EMAILS = ["ayushrock13@hotmail.co.uk", "trainrightmuscle@gmail.com"];

export function isCommunityAdmin(email: string | null | undefined): boolean {
  return !!email && COMMUNITY_ADMIN_EMAILS.includes(email.toLowerCase());
}
