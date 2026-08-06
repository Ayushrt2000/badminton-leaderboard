"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { IconChevronUp, IconUsers } from "@/components/ui/Icons";
import type { SkillGroup } from "@/lib/types";

export type RosterParticipant = {
  id: string;
  profileId: string;
  name: string;
  skillGroup: SkillGroup;
};

const GROUPS: { key: SkillGroup; label: string }[] = [
  { key: "beginner", label: "Beginner" },
  { key: "advanced", label: "Advanced" },
];

export function RosterPanel({
  participants,
  onMove,
  onRemove,
}: {
  participants: RosterParticipant[];
  onMove: (participantId: string, newGroup: SkillGroup) => void;
  onRemove: (participantId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? participants.filter((p) => p.name.toLowerCase().includes(q)) : participants;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [participants, query]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:border-white/20 hover:text-white"
      >
        <IconUsers className="h-3.5 w-3.5" />
        Manage roster
        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] leading-none text-white/50">
          {participants.length}
        </span>
      </button>
    );
  }

  return (
    <Card className="mb-4 w-full basis-full">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-lg">Roster</CardTitle>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search players..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-48"
          />
          <button
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-white/50 transition-colors hover:border-white/20 hover:text-white"
          >
            <IconChevronUp className="h-3.5 w-3.5" />
            Hide
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <p className="text-sm text-white/40">No one has joined yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {GROUPS.map((group) => {
              const inGroup = filtered.filter((p) => p.skillGroup === group.key);
              return (
                <div key={group.key} className="rounded-xl border border-border bg-surface-2">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                      {group.label}
                    </span>
                    <span className="text-xs text-white/30">{inGroup.length}</span>
                  </div>
                  <ul className="max-h-[28rem] space-y-1 overflow-y-auto p-2 scrollbar-thin">
                    {inGroup.length === 0 ? (
                      <li className="px-2 py-3 text-center text-xs text-white/25">
                        No {group.label.toLowerCase()} players
                      </li>
                    ) : (
                      inGroup.map((p) => {
                        const target = GROUPS.find((g) => g.key !== group.key)!;
                        const confirming = confirmingId === p.id;
                        return (
                          <li
                            key={p.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-surface px-2.5 py-1.5"
                          >
                            <span className="truncate text-sm text-white">{p.name}</span>
                            {confirming ? (
                              <div className="flex shrink-0 items-center gap-1.5">
                                <span className="text-xs text-white/40">Remove?</span>
                                <button
                                  onClick={() => {
                                    onRemove(p.id);
                                    setConfirmingId(null);
                                  }}
                                  className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setConfirmingId(null)}
                                  className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-white/50 hover:text-white"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                  onClick={() => onMove(p.id, target.key)}
                                  title={`Move to ${target.label}`}
                                  className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-white/50 transition-colors hover:border-accent hover:text-accent"
                                >
                                  {target.key === "advanced" ? "→ Advanced" : "← Beginner"}
                                </button>
                                <button
                                  onClick={() => setConfirmingId(p.id)}
                                  title="Remove from event"
                                  className="rounded-md border border-border px-1.5 py-1 text-xs font-semibold text-white/40 transition-colors hover:border-primary/40 hover:text-primary"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
