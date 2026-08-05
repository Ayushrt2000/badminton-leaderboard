import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RankBadge } from "@/components/ui/RankBadge";
import type { GroupLeaderboardRow } from "@/lib/types";

export function GroupLeaderboard({ rows }: { rows: GroupLeaderboardRow[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Leaderboard</CardTitle>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          LIVE
        </span>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">
            No scores logged yet. Rankings appear as soon as a round is scored.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="w-12 py-2 font-medium"></th>
                  <th className="py-2 font-medium">Player</th>
                  <th className="py-2 text-center font-medium">W</th>
                  <th className="py-2 text-center font-medium">L</th>
                  <th className="py-2 text-right font-medium">+/-</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.player_id}
                    className="border-b border-border/60 last:border-0 transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="py-3">
                      <RankBadge rank={i + 1} />
                    </td>
                    <td className="py-3 font-medium text-white">{row.player_name}</td>
                    <td className="py-3 text-center text-white/70">{row.wins}</td>
                    <td className="py-3 text-center text-white/40">{row.losses}</td>
                    <td className="py-3 text-right font-display text-xl text-accent">
                      {row.point_diff > 0 ? `+${row.point_diff}` : row.point_diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
