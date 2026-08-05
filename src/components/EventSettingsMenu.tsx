"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function EventSettingsMenu({
  eventId,
  status,
}: {
  eventId: string;
  status: string;
}) {
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClose() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({ status: "completed" })
      .eq("id", eventId);
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  async function handleReopen() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({ status: "in_progress" })
      .eq("id", eventId);
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.push("/events");
    router.refresh();
  }

  if (confirmingDelete) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs">
        <span className="text-primary">Delete this event and all its matches?</span>
        <Button variant="primary" size="sm" disabled={busy} onClick={handleDelete}>
          {busy ? "Deleting..." : "Yes, delete"}
        </Button>
        <button
          onClick={() => setConfirmingDelete(false)}
          className="text-white/50 hover:text-white"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <p className="text-xs text-primary">{error}</p>}
      {status === "completed" ? (
        <Button variant="ghost" size="sm" disabled={busy} onClick={handleReopen}>
          Reopen event
        </Button>
      ) : (
        <Button variant="secondary" size="sm" disabled={busy} onClick={handleClose}>
          Close event
        </Button>
      )}
      <Button variant="primary" size="sm" onClick={() => setConfirmingDelete(true)}>
        Delete event
      </Button>
    </div>
  );
}
