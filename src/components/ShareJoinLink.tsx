"use client";

import { useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 10.51l6.83-3.02M8.59 13.49l6.83 3.02" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function ShareJoinLink({
  eventId,
  compact = false,
}: {
  eventId: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/events/${eventId}/join`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this join link:", url);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        title="Share join link"
        aria-label="Share join link"
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
          copied
            ? "border-accent/30 bg-accent/10 text-accent"
            : "border-border bg-surface-2 text-white/70 hover:text-white"
        )}
      >
        {copied ? <CheckIcon className="h-3 w-3" /> : <ShareIcon className="h-3 w-3" />}
        {copied ? "Copied!" : "Share link"}
      </button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleCopy}
      title="Share join link"
      aria-label="Share join link"
    >
      {copied ? <CheckIcon /> : <ShareIcon />}
      {copied ? "Copied!" : "Share link"}
    </Button>
  );
}
