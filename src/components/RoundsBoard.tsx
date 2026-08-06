"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export type BoardRound = {
  id: string;
  round_number: number;
  is_final: boolean;
};

export type BoardMatch = {
  id: string;
  round_id: string;
  court_name: string | null;
  team1: [string, string];
  team2: [string, string];
  team1Ids: [string, string];
  team2Ids: [string, string];
  team1_score: number | null;
  team2_score: number | null;
};

export type SubstituteSlot = "t1p1" | "t1p2" | "t2p1" | "t2p2";

export type EligiblePlayer = { id: string; name: string };

function ScoreStepper({
  value,
  onCommit,
  disabled,
  won,
}: {
  value: number | null;
  onCommit: (value: number | null) => void;
  disabled: boolean;
  won: boolean;
}) {
  const [local, setLocal] = useState(value === null ? "" : String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setLocal(value === null ? "" : String(value));
  }, [value, focused]);

  function step(delta: number) {
    if (disabled) return;
    const next = Math.max(0, (value ?? 0) + delta);
    onCommit(next);
  }

  const boxClasses = `flex h-8 w-10 shrink-0 items-center justify-center rounded-lg border font-display text-lg ${
    won ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface-2 text-white"
  }`;

  if (disabled) {
    return <div className={`${boxClasses} opacity-80`}>{value === null ? "–" : value}</div>;
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label="Decrease score"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-base font-semibold text-white/50 transition-colors hover:border-primary/50 hover:text-primary active:scale-95"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={local}
        onFocus={() => setFocused(true)}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          setFocused(false);
          const trimmed = local.trim();
          onCommit(trimmed === "" ? null : Math.max(0, Number(trimmed)));
        }}
        className={`${boxClasses} text-center outline-none transition-colors focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
          won ? "focus:border-accent" : "focus:border-primary"
        }`}
      />
      <button
        type="button"
        onClick={() => step(1)}
        aria-label="Increase score"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-base font-semibold text-white/50 transition-colors hover:border-accent/50 hover:text-accent active:scale-95"
      >
        +
      </button>
    </div>
  );
}

function PlayerSlot({
  name,
  playerId,
  editable,
  bold,
  alignRight,
  options,
  onChange,
}: {
  name: string;
  playerId: string;
  editable: boolean;
  bold: boolean;
  alignRight: boolean;
  options: EligiblePlayer[];
  onChange: (newPlayerId: string) => void;
}) {
  if (!editable) {
    return (
      <span
        className={`min-w-0 truncate text-sm ${bold ? "font-semibold text-accent" : "text-white/60"}`}
      >
        {name}
      </span>
    );
  }

  return (
    <select
      value={playerId}
      onChange={(e) => onChange(e.target.value)}
      className={`min-w-0 max-w-[38vw] truncate rounded-md border border-transparent bg-transparent text-sm outline-none transition-colors hover:border-border focus:border-primary sm:max-w-[10rem] ${
        bold ? "font-semibold text-accent" : "text-white/60"
      } ${alignRight ? "text-right" : "text-left"}`}
    >
      {options.map((o) => (
        <option key={o.id} value={o.id} className="bg-surface-2 text-white">
          {o.name}
        </option>
      ))}
    </select>
  );
}

export function RoundsBoard({
  rounds,
  matches,
  isHost,
  onScoreChange,
  eligiblePlayers = [],
  onSubstitute,
}: {
  rounds: BoardRound[];
  matches: BoardMatch[];
  isHost: boolean;
  onScoreChange: (matchId: string, team1Score: number | null, team2Score: number | null) => void;
  eligiblePlayers?: EligiblePlayer[];
  onSubstitute?: (matchId: string, slot: SubstituteSlot, newPlayerId: string) => void;
}) {
  if (rounds.length === 0) {
    return (
      <Card>
        <CardContent className="!pt-8 !pb-8 text-center text-sm text-white/40">
          No rounds scheduled yet.
        </CardContent>
      </Card>
    );
  }

  const playersById = new Map(eligiblePlayers.map((p) => [p.id, p]));

  return (
    <div className="space-y-4">
      {rounds.map((round) => {
        const roundMatches = matches.filter((m) => m.round_id === round.id);
        const usedInRound = new Set(
          roundMatches.flatMap((m) => [...m.team1Ids, ...m.team2Ids])
        );

        function optionsFor(currentPlayerId: string): EligiblePlayer[] {
          const opts = eligiblePlayers.filter(
            (p) => p.id === currentPlayerId || !usedInRound.has(p.id)
          );
          if (!opts.some((p) => p.id === currentPlayerId)) {
            const fallbackName = playersById.get(currentPlayerId)?.name ?? "Unknown";
            opts.unshift({ id: currentPlayerId, name: fallbackName });
          }
          return [...opts].sort((a, b) => a.name.localeCompare(b.name));
        }

        return (
          <Card key={round.id}>
            <CardHeader className="flex flex-row items-center gap-2">
              <CardTitle className="text-lg">
                {round.is_final ? "Final" : `Round ${round.round_number}`}
              </CardTitle>
              {round.is_final && <Badge tone="win">Championship</Badge>}
            </CardHeader>
            <CardContent className="space-y-2">
              {roundMatches.map((m) => {
                const decided = m.team1_score !== null && m.team2_score !== null;
                const team1Won = decided && (m.team1_score as number) > (m.team2_score as number);
                const team2Won = decided && (m.team2_score as number) > (m.team1_score as number);
                const editable = isHost && !!onSubstitute && !decided;

                const team1Slots = (
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    <PlayerSlot
                      name={m.team1[0]}
                      playerId={m.team1Ids[0]}
                      editable={editable}
                      bold={team1Won}
                      alignRight={false}
                      options={optionsFor(m.team1Ids[0])}
                      onChange={(newId) => onSubstitute?.(m.id, "t1p1", newId)}
                    />
                    <span className="shrink-0 text-xs text-white/25">&amp;</span>
                    <PlayerSlot
                      name={m.team1[1]}
                      playerId={m.team1Ids[1]}
                      editable={editable}
                      bold={team1Won}
                      alignRight={false}
                      options={optionsFor(m.team1Ids[1])}
                      onChange={(newId) => onSubstitute?.(m.id, "t1p2", newId)}
                    />
                  </div>
                );

                const team2Slots = (
                  <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
                    <PlayerSlot
                      name={m.team2[0]}
                      playerId={m.team2Ids[0]}
                      editable={editable}
                      bold={team2Won}
                      alignRight={true}
                      options={optionsFor(m.team2Ids[0])}
                      onChange={(newId) => onSubstitute?.(m.id, "t2p1", newId)}
                    />
                    <span className="shrink-0 text-xs text-white/25">&amp;</span>
                    <PlayerSlot
                      name={m.team2[1]}
                      playerId={m.team2Ids[1]}
                      editable={editable}
                      bold={team2Won}
                      alignRight={true}
                      options={optionsFor(m.team2Ids[1])}
                      onChange={(newId) => onSubstitute?.(m.id, "t2p2", newId)}
                    />
                  </div>
                );

                // Mobile-only: team 2's names left-aligned (instead of the
                // right-aligned version used on desktop) so both rows read
                // "names ... score" the same way instead of zig-zagging.
                const team2SlotsMobile = (
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    <PlayerSlot
                      name={m.team2[0]}
                      playerId={m.team2Ids[0]}
                      editable={editable}
                      bold={team2Won}
                      alignRight={false}
                      options={optionsFor(m.team2Ids[0])}
                      onChange={(newId) => onSubstitute?.(m.id, "t2p1", newId)}
                    />
                    <span className="shrink-0 text-xs text-white/25">&amp;</span>
                    <PlayerSlot
                      name={m.team2[1]}
                      playerId={m.team2Ids[1]}
                      editable={editable}
                      bold={team2Won}
                      alignRight={false}
                      options={optionsFor(m.team2Ids[1])}
                      onChange={(newId) => onSubstitute?.(m.id, "t2p2", newId)}
                    />
                  </div>
                );

                const score1 = (
                  <ScoreStepper
                    value={m.team1_score}
                    disabled={!isHost}
                    won={team1Won}
                    onCommit={(v) => onScoreChange(m.id, v, m.team2_score)}
                  />
                );
                const score2 = (
                  <ScoreStepper
                    value={m.team2_score}
                    disabled={!isHost}
                    won={team2Won}
                    onCommit={(v) => onScoreChange(m.id, m.team1_score, v)}
                  />
                );

                const courtBadge = (
                  <Badge tone={decided ? "win" : "default"} className="shrink-0">
                    {m.court_name ?? "Court"}
                  </Badge>
                );

                return (
                  <div
                    key={m.id}
                    className={`rounded-xl border bg-surface-2 px-4 py-3 transition-colors ${
                      decided ? "border-l-4 border-l-accent border-y-border border-r-border" : "border-border"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between sm:hidden">
                      {courtBadge}
                      {decided && <span className="text-xs font-semibold text-accent">✓ Final</span>}
                    </div>

                    {/* Mobile: stacked scorecard, one team per row. Both rows
                        read "names ... score" so the two score boxes line up
                        in the same column instead of alternating sides. */}
                    <div className="flex flex-col gap-2 sm:hidden">
                      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
                        {team1Slots}
                        {score1}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        {team2SlotsMobile}
                        {score2}
                      </div>
                    </div>

                    {/* Desktop: court badge sits above so it doesn't pull the
                        team/score row off-center, then a single centered row */}
                    <div className="hidden sm:block">
                      <div className="mb-2 flex items-center justify-between">
                        {courtBadge}
                        {decided && <span className="text-xs font-semibold text-accent">✓ Final</span>}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        {team1Slots}
                        {score1}
                        <span className="shrink-0 text-xs text-white/25">vs</span>
                        {score2}
                        {team2Slots}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
