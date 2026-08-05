"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { SkillGroup } from "@/lib/types";

export function JoinEventForm({
  eventId,
  profileId,
  eventCommunityId,
  hasCommunity,
}: {
  eventId: string;
  profileId: string;
  eventCommunityId: string | null;
  hasCommunity: boolean;
}) {
  const router = useRouter();
  const [group, setGroup] = useState<SkillGroup>("beginner");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("event_participants").insert({
      event_id: eventId,
      profile_id: profileId,
      skill_group: group,
    });
    setSubmitting(false);

    if (error) {
      setError(error.message.includes("full") ? "This event just filled up." : error.message);
      return;
    }

    // If you're not part of a community yet, joining an event puts you in
    // that event's community automatically - no separate step needed.
    if (!hasCommunity && eventCommunityId) {
      await supabase
        .from("profiles")
        .update({ community_id: eventCommunityId })
        .eq("id", profileId);
    }

    router.push(`/events/${eventId}`);
    router.refresh();
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-2">
        {(["beginner", "advanced"] as SkillGroup[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition-colors ${
              group === g
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface-2 text-white/60 hover:text-white"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-primary">{error}</p>}
      <Button
        variant="accent"
        className="mt-4 w-full"
        disabled={submitting}
        onClick={handleJoin}
      >
        {submitting ? "Joining..." : "Join event"}
      </Button>
    </div>
  );
}
