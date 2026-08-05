import { HTMLAttributes } from "react";
import clsx from "clsx";

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "win" | "loss" | "accent";
}) {
  const tones = {
    default: "bg-surface-2 text-white/70 border-border",
    win: "bg-accent/10 text-accent border-accent/30",
    loss: "bg-white/5 text-white/40 border-white/10",
    accent: "bg-primary/10 text-primary border-primary/30",
  } as const;

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
