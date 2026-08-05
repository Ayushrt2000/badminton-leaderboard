"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type CourtRow = { id: string; name: string };

export function CourtsManager({
  communityId,
  initialCourts,
}: {
  communityId: string;
  initialCourts: CourtRow[];
}) {
  const [courts, setCourts] = useState(initialCourts);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("courts")
      .insert({ community_id: communityId, name })
      .select("id, name")
      .single();
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    setCourts((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName("");
  }

  async function handleRename(id: string) {
    const name = editingName.trim();
    if (!name) return;

    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("courts").update({ name }).eq("id", id);
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    setCourts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c)).sort((a, b) => a.name.localeCompare(b.name))
    );
    setEditingId(null);
  }

  return (
    <div>
      {courts.length === 0 ? (
        <p className="text-sm text-white/40">No courts yet. Add the ones you play on below.</p>
      ) : (
        <ul className="space-y-2">
          {courts.map((court) => (
            <li
              key={court.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-2.5"
            >
              {editingId === court.id ? (
                <>
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="mr-2"
                  />
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" disabled={busy} onClick={() => handleRename(court.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-white">{court.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(court.id);
                      setEditingName(court.name);
                    }}
                  >
                    Edit
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <Input
          placeholder="Court name (e.g. Court 3)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" disabled={busy} className="shrink-0">
          Add court
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-primary">{error}</p>}
    </div>
  );
}
