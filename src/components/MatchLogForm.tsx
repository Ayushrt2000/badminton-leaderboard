"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type PlayerOption = { id: string; name: string };

export function MatchLogForm({
  eventId,
  hostId,
  players,
  onLogged,
}: {
  eventId: string;
  hostId: string;
  players: PlayerOption[];
  onLogged?: () => void;
}) {
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!player1 || !player2) {
      setError("Pick both players.");
      return;
    }
    if (player1 === player2) {
      setError("Players must be different.");
      return;
    }
    const s1 = Number(score1);
    const s2 = Number(score2);
    if (Number.isNaN(s1) || Number.isNaN(s2) || s1 === s2) {
      setError("Enter a final score with a winner (no ties).");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const winnerId = s1 > s2 ? player1 : player2;

    const { error } = await supabase.from("matches").insert({
      event_id: eventId,
      player1_id: player1,
      player2_id: player2,
      player1_score: s1,
      player2_score: s2,
      winner_id: winnerId,
      logged_by: hostId,
    });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setPlayer1("");
    setPlayer2("");
    setScore1("");
    setScore2("");
    onLogged?.();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log a match</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="player1">Player 1</Label>
              <select
                id="player1"
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Select player</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="player2">Player 2</Label>
              <select
                id="player2"
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Select player</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="score1">Score 1</Label>
              <Input
                id="score1"
                type="number"
                min={0}
                inputMode="numeric"
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="score2">Score 2</Label>
              <Input
                id="score2"
                type="number"
                min={0}
                inputMode="numeric"
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-primary">{error}</p>}
          <Button type="submit" variant="accent" className="w-full" disabled={submitting}>
            {submitting ? "Logging..." : "Log match"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
