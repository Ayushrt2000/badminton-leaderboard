"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";

export function CreateEventForm({
  hostId,
  communityId,
}: {
  hostId: string;
  communityId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [maxParticipants, setMaxParticipants] = useState("30");
  const [sessionMinutes, setSessionMinutes] = useState("120");
  const [gameMinutes, setGameMinutes] = useState("90");
  const [roundMinutes, setRoundMinutes] = useState("6");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="accent">
        + Host a new event
      </Button>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data: event, error } = await supabase
      .from("events")
      .insert({
        name: name.trim(),
        event_date: date,
        host_id: hostId,
        community_id: communityId,
        max_participants: Number(maxParticipants) || 30,
        session_minutes: Number(sessionMinutes) || 120,
        game_minutes: Number(gameMinutes) || 90,
        round_minutes: Number(roundMinutes) || 6,
      })
      .select("id")
      .single();

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    // Auto-split the community's courts between the two skill groups so
    // there's a sensible default the host can adjust later from the event
    // page. If there are no courts yet, this is just a no-op.
    if (communityId) {
      const { data: courts } = await supabase
        .from("courts")
        .select("id")
        .eq("community_id", communityId)
        .order("name");

      if (courts && courts.length > 0) {
        const mid = Math.ceil(courts.length / 2);
        const rows = courts.map((c, i) => ({
          event_id: event.id,
          court_id: c.id,
          skill_group: i < mid ? "beginner" : "advanced",
        }));
        await supabase.from("event_courts").insert(rows);
      }
    }

    router.push(`/events/${event.id}`);
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="eventName">Event name</Label>
              <Input
                id="eventName"
                required
                placeholder="Sunday Night Smash"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="eventDate">Date</Label>
              <Input
                id="eventDate"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="maxParticipants">Max players</Label>
              <Input
                id="maxParticipants"
                type="number"
                min={4}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sessionMinutes">Session (min)</Label>
              <Input
                id="sessionMinutes"
                type="number"
                min={1}
                value={sessionMinutes}
                onChange={(e) => setSessionMinutes(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="gameMinutes">Game time (min)</Label>
              <Input
                id="gameMinutes"
                type="number"
                min={1}
                value={gameMinutes}
                onChange={(e) => setGameMinutes(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="roundMinutes">Round length (min)</Label>
              <Input
                id="roundMinutes"
                type="number"
                min={1}
                value={roundMinutes}
                onChange={(e) => setRoundMinutes(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-primary">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create event"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
