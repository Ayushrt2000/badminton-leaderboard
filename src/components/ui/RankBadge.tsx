import clsx from "clsx";

export function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: "bg-gold text-background shadow-[0_0_16px_rgba(255,201,61,0.5)]",
    2: "bg-silver text-background",
    3: "bg-bronze text-background",
  };

  return (
    <div
      className={clsx(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-lg",
        styles[rank] ?? "bg-surface-2 text-white/60 border border-border"
      )}
    >
      {rank}
    </div>
  );
}
