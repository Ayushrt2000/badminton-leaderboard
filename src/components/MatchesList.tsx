import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export type MatchWithPlayers = {
  id: string;
  player1_score: number;
  player2_score: number;
  winner_id: string;
  created_at: string;
  player1: { id: string; name: string } | { id: string; name: string }[] | null;
  player2: { id: string; name: string } | { id: string; name: string }[] | null;
};

function firstOf<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function MatchesList({ matches }: { matches: MatchWithPlayers[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent matches</CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/40">No matches logged yet.</p>
        ) : (
          <ul className="space-y-2">
            {matches.map((m) => {
              const p1 = firstOf(m.player1);
              const p2 = firstOf(m.player2);
              const p1Won = m.winner_id === p1?.id;
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className={p1Won ? "font-semibold text-white" : "text-white/50"}>
                      {p1?.name ?? "?"}
                    </span>
                    <span className="text-white/25">vs</span>
                    <span className={!p1Won ? "font-semibold text-white" : "text-white/50"}>
                      {p2?.name ?? "?"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg tracking-wide text-white/80">
                      {m.player1_score}&ndash;{m.player2_score}
                    </span>
                    <Badge tone="win">{p1Won ? p1?.name : p2?.name} won</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
