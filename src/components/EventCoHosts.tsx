"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export type EventCoHost = { id: string; profileId: string; name: string };
export type EventCoHostCandidate = { profileId: string; name: string };

export function EventCoHosts({
  coHosts,
  candidates,
  onAdd,
  onRemove,
}: {
  coHosts: EventCoHost[];
  candidates: EventCoHostCandidate[];
  onAdd: (profileId: string) => void;
  onRemove: (rowId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-white/40 underline decoration-dotted hover:text-white/70"
      >
        Manage co-hosts ({coHosts.length})
      </button>
    );
  }

  const eligible = candidates.filter((c) => !coHosts.some((ch) => ch.profileId === c.profileId));

  return (
    <Card className="mb-4 w-full basis-full">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-lg">Co-hosts</CardTitle>
        <button
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-white/40 hover:text-white/70"
        >
          Hide
        </button>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-white/40">
          Co-hosts get the same powers as you for this event: roster, scores, rounds, and
          settings.
        </p>

        {coHosts.length === 0 ? (
          <p className="mb-3 text-sm text-white/40">No co-hosts yet.</p>
        ) : (
          <div className="mb-3 flex flex-wrap gap-2">
            {coHosts.map((ch) => (
              <span
                key={ch.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-white/70"
              >
                {ch.name}
                <button
                  onClick={() => onRemove(ch.id)}
                  title="Remove co-host"
                  className="text-white/40 hover:text-primary"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {eligible.length === 0 ? (
          <p className="text-xs text-white/30">
            {candidates.length === 0
              ? "No one has joined this event yet."
              : "Everyone on the roster is already a co-host."}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm text-white outline-none focus:border-primary"
            >
              <option value="">Select a player...</option>
              {eligible.map((c) => (
                <option key={c.profileId} value={c.profileId}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selected}
              onClick={() => {
                onAdd(selected);
                setSelected("");
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
            >
              Add co-host
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
