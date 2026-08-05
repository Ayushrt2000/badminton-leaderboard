"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function DevSeedControls({
  eventId,
  onChanged,
}: {
  eventId: string;
  onChanged: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState("16");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAdd() {
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("dev_seed_dummy_players", {
      p_event_id: eventId,
      p_count: Number(count) || 0,
    });
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(`Added ${data?.length ?? 0} test player${data?.length === 1 ? "" : "s"}.`);
    await onChanged();
  }

  async function handleClear() {
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .rpc("dev_clear_dummy_players", { p_event_id: eventId })
      .single();
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }
    const result = data as { deleted_count: number; skipped_count: number };
    setMessage(
      `Removed ${result.deleted_count} test player${result.deleted_count === 1 ? "" : "s"}` +
        (result.skipped_count > 0
          ? ` (${result.skipped_count} skipped — already in scored matches).`
          : ".")
    );
    await onChanged();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-white/30 underline decoration-dotted hover:text-white/60"
      >
        Dev: add test players
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
        Testing only — fills the roster with fake players (Beginner/Advanced alternating)
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="number"
          min={1}
          value={count}
          onChange={(e) => setCount(e.target.value)}
          className="w-20"
        />
        <Button size="sm" variant="secondary" disabled={busy} onClick={handleAdd}>
          Add test players
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={handleClear}>
          Clear test players
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Hide
        </Button>
      </div>
      {message && <p className="mt-2 text-xs text-white/50">{message}</p>}
    </div>
  );
}
