"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CourtsManager } from "@/components/CourtsManager";

type CommunityRow = { id: string; name: string; host_id: string | null };
type CourtRow = { id: string; community_id: string; name: string };
type CommunityHostRow = { id: string; communityId: string; profileId: string; name: string };
type MemberRow = { id: string; name: string; communityId: string };

export function CommunityManager({
  isAdmin,
  myProfileId,
  myCommunityId,
  initialCommunities,
  initialCourts,
  initialCommunityHosts,
  initialMembers,
}: {
  isAdmin: boolean;
  myProfileId: string;
  myCommunityId: string | null;
  initialCommunities: CommunityRow[];
  initialCourts: CourtRow[];
  initialCommunityHosts: CommunityHostRow[];
  initialMembers: MemberRow[];
}) {
  const router = useRouter();
  const [communities, setCommunities] = useState(initialCommunities);
  const [courts, setCourts] = useState(initialCourts);
  const [communityHosts, setCommunityHosts] = useState(initialCommunityHosts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [addingCoHostFor, setAddingCoHostFor] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  async function handleAddCoHost(communityId: string) {
    if (!selectedMemberId) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("community_hosts")
      .insert({ community_id: communityId, profile_id: selectedMemberId, added_by: myProfileId })
      .select("id, community_id, profile_id")
      .single();
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    const name = initialMembers.find((m) => m.id === selectedMemberId)?.name ?? "Unknown";
    setCommunityHosts((prev) => [
      ...prev,
      { id: data.id, communityId: data.community_id, profileId: data.profile_id, name },
    ]);
    setSelectedMemberId("");
    setAddingCoHostFor(null);
  }

  async function handleRemoveCoHost(rowId: string) {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("community_hosts").delete().eq("id", rowId);
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    setCommunityHosts((prev) => prev.filter((ch) => ch.id !== rowId));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("communities")
      .insert({ name, host_id: myProfileId })
      .select("id, name, host_id")
      .single();
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    setCommunities((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName("");
    setExpandedId(data.id);
  }

  async function handleJoin(communityId: string) {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ community_id: communityId })
      .eq("id", myProfileId);
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      {isAdmin && (
        <Card>
          <CardContent className="pt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              Create a community
            </p>
            <form onSubmit={handleCreate} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="newCommunity" className="sr-only">
                  Community name
                </Label>
                <Input
                  id="newCommunity"
                  placeholder="Downtown Smashers"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={busy}>
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-primary">{error}</p>}

      {communities.length === 0 ? (
        <p className="text-sm text-white/40">
          {isAdmin
            ? "No communities yet. Create the first one above."
            : "No communities have been set up yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {communities.map((c) => {
            const isMine = c.id === myCommunityId;
            const isHostOfThis = c.host_id === myProfileId;
            const coHostsOfThis = communityHosts.filter((ch) => ch.communityId === c.id);
            const isCoHostOfThis = coHostsOfThis.some((ch) => ch.profileId === myProfileId);
            const canManageThis = isAdmin || isHostOfThis || isCoHostOfThis;
            const isExpanded = expandedId === c.id;
            const eligibleMembers = initialMembers.filter(
              (m) =>
                m.communityId === c.id &&
                m.id !== c.host_id &&
                !coHostsOfThis.some((ch) => ch.profileId === m.id)
            );
            return (
              <Card key={c.id}>
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xl tracking-wide text-white">
                        {c.name}
                      </span>
                      {isHostOfThis && <Badge tone="win">You host this</Badge>}
                      {isCoHostOfThis && !isHostOfThis && (
                        <Badge tone="win">You co-host this</Badge>
                      )}
                      {isMine && !isHostOfThis && !isCoHostOfThis && (
                        <Badge tone="accent">Your community</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isAdmin && !isMine && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => handleJoin(c.id)}
                        >
                          Set as mine
                        </Button>
                      )}
                      {canManageThis && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        >
                          {isExpanded ? "Hide courts" : "Manage courts"}
                        </Button>
                      )}
                      {!isAdmin && !canManageThis && !isMine && (
                        <Button
                          size="sm"
                          variant="accent"
                          disabled={busy}
                          onClick={() => handleJoin(c.id)}
                        >
                          Join community
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && canManageThis && (
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      <CourtsManager
                        communityId={c.id}
                        initialCourts={courts.filter((court) => court.community_id === c.id)}
                      />

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                          Co-hosts
                        </p>
                        {coHostsOfThis.length === 0 ? (
                          <p className="mb-2 text-sm text-white/40">No co-hosts yet.</p>
                        ) : (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {coHostsOfThis.map((ch) => (
                              <span
                                key={ch.id}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-white/70"
                              >
                                {ch.name}
                                <button
                                  onClick={() => handleRemoveCoHost(ch.id)}
                                  title="Remove co-host"
                                  className="text-white/40 hover:text-primary"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {addingCoHostFor === c.id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={selectedMemberId}
                              onChange={(e) => setSelectedMemberId(e.target.value)}
                              className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm text-white outline-none focus:border-primary"
                            >
                              <option value="">Select a member...</option>
                              {eligibleMembers.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busy || !selectedMemberId}
                              onClick={() => handleAddCoHost(c.id)}
                            >
                              Add
                            </Button>
                            <button
                              onClick={() => {
                                setAddingCoHostFor(null);
                                setSelectedMemberId("");
                              }}
                              className="text-xs font-semibold text-white/40 hover:text-white/70"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingCoHostFor(c.id)}
                            className="text-xs font-semibold text-white/40 underline decoration-dotted hover:text-white/70"
                          >
                            + Add co-host
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
