// Doubles round-robin scheduler for a single skill group.
//
// Goal (per the host's spec): over the course of the session, every player
// should face every other player in their group as an OPPONENT at least
// once. Partners are rotated too, but opponent variety is weighted higher
// since that's the primary fairness goal. This is a heuristic, not a
// mathematically perfect combinatorial design - for larger groups or few
// courts/rounds it won't always reach a full round robin, but it gets as
// close as the available court-time allows and spreads byes evenly.

export type ScheduledMatch = {
  courtId: string;
  team1: [string, string];
  team2: [string, string];
};

export type ScheduledRound = {
  roundNumber: number;
  matches: ScheduledMatch[];
  sittingOut: string[];
};

const ATTEMPTS_PER_ROUND = 40;

export function computeTotalRounds(gameMinutes: number, roundMinutes: number): number {
  return Math.max(1, Math.floor(gameMinutes / roundMinutes));
}

export function generateSchedule(params: {
  playerIds: string[];
  courtIds: string[];
  totalRounds: number;
  // Round numbers assigned to the generated rounds start here instead of 1 -
  // used when appending fresh rounds after some rounds have already been
  // played (e.g. rebuilding the remainder of a schedule for a latecomer).
  startingRoundNumber?: number;
  // Already-played matches (from earlier, untouched rounds) used to seed the
  // opponent/partner/games-played counters so the new rounds don't just
  // repeat pairings the group already saw.
  history?: { team1: [string, string]; team2: [string, string] }[];
}): ScheduledRound[] {
  const { playerIds, courtIds, totalRounds, startingRoundNumber = 1, history = [] } = params;
  if (playerIds.length < 4 || courtIds.length === 0 || totalRounds <= 0) return [];

  const gamesPlayed = new Map<string, number>(playerIds.map((id) => [id, 0]));
  const byes = new Map<string, number>(playerIds.map((id) => [id, 0]));
  const opponentCount = new Map<string, number>();
  const partnerCount = new Map<string, number>();

  const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const getOpp = (a: string, b: string) => opponentCount.get(pairKey(a, b)) ?? 0;
  const getPartner = (a: string, b: string) => partnerCount.get(pairKey(a, b)) ?? 0;
  const bumpOpp = (a: string, b: string) => {
    const k = pairKey(a, b);
    opponentCount.set(k, (opponentCount.get(k) ?? 0) + 1);
  };
  const bumpPartner = (a: string, b: string) => {
    const k = pairKey(a, b);
    partnerCount.set(k, (partnerCount.get(k) ?? 0) + 1);
  };

  history.forEach((m) => {
    bumpOpp(m.team1[0], m.team2[0]);
    bumpOpp(m.team1[0], m.team2[1]);
    bumpOpp(m.team1[1], m.team2[0]);
    bumpOpp(m.team1[1], m.team2[1]);
    bumpPartner(m.team1[0], m.team1[1]);
    bumpPartner(m.team2[0], m.team2[1]);
    [m.team1[0], m.team1[1], m.team2[0], m.team2[1]].forEach((id) => {
      if (gamesPlayed.has(id)) gamesPlayed.set(id, (gamesPlayed.get(id) ?? 0) + 1);
    });
  });

  const rounds: ScheduledRound[] = [];

  for (let i = 0; i < totalRounds; i++) {
    const roundNumber = startingRoundNumber + i;
    const maxActive = Math.min(playerIds.length, courtIds.length * 4);
    const activeCount = maxActive - (maxActive % 4);

    if (activeCount < 4) break;

    // Players who've played the fewest games so far get priority to play
    // this round, so byes rotate fairly across the session.
    const sorted = [...playerIds].sort((a, b) => {
      const diff = (gamesPlayed.get(a) ?? 0) - (gamesPlayed.get(b) ?? 0);
      return diff !== 0 ? diff : Math.random() - 0.5;
    });

    const active = sorted.slice(0, activeCount);
    const sittingOut = sorted.slice(activeCount);
    sittingOut.forEach((id) => byes.set(id, (byes.get(id) ?? 0) + 1));

    let bestMatches: ScheduledMatch[] | null = null;
    let bestScore = Infinity;

    for (let attempt = 0; attempt < ATTEMPTS_PER_ROUND; attempt++) {
      const shuffled = [...active].sort(() => Math.random() - 0.5);
      const quads: string[][] = [];
      for (let i = 0; i < shuffled.length; i += 4) {
        quads.push(shuffled.slice(i, i + 4));
      }

      let score = 0;
      const matches: ScheduledMatch[] = [];

      quads.forEach((quad, idx) => {
        const [a, b, c, d] = quad;
        const splits: [[string, string], [string, string]][] = [
          [
            [a, b],
            [c, d],
          ],
          [
            [a, c],
            [b, d],
          ],
          [
            [a, d],
            [b, c],
          ],
        ];

        let bestSplit = splits[0];
        let bestSplitScore = Infinity;
        for (const [team1, team2] of splits) {
          const oppScore =
            getOpp(team1[0], team2[0]) +
            getOpp(team1[0], team2[1]) +
            getOpp(team1[1], team2[0]) +
            getOpp(team1[1], team2[1]);
          const partnerScore = getPartner(team1[0], team1[1]) + getPartner(team2[0], team2[1]);
          // Opponent variety is the primary goal, so it's weighted higher
          // than partner variety.
          const splitScore = oppScore * 3 + partnerScore;
          if (splitScore < bestSplitScore) {
            bestSplitScore = splitScore;
            bestSplit = [team1, team2];
          }
        }

        score += bestSplitScore;
        matches.push({
          courtId: courtIds[idx],
          team1: bestSplit[0],
          team2: bestSplit[1],
        });
      });

      if (score < bestScore) {
        bestScore = score;
        bestMatches = matches;
      }
    }

    const matches = bestMatches ?? [];
    matches.forEach((m) => {
      bumpOpp(m.team1[0], m.team2[0]);
      bumpOpp(m.team1[0], m.team2[1]);
      bumpOpp(m.team1[1], m.team2[0]);
      bumpOpp(m.team1[1], m.team2[1]);
      bumpPartner(m.team1[0], m.team1[1]);
      bumpPartner(m.team2[0], m.team2[1]);
      [m.team1[0], m.team1[1], m.team2[0], m.team2[1]].forEach((id) => {
        gamesPlayed.set(id, (gamesPlayed.get(id) ?? 0) + 1);
      });
    });

    rounds.push({ roundNumber, matches, sittingOut });
  }

  return rounds;
}
