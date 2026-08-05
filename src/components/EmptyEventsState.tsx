import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";

export function EmptyEventsState({
  hasCommunity,
  isHost,
  hostName,
}: {
  hasCommunity: boolean;
  isHost: boolean;
  hostName?: string | null;
}) {
  if (!hasCommunity) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center text-4xl leading-none">
            🏸
          </span>
          <h2 className="font-display text-2xl tracking-wide text-white">No community yet</h2>
          <p className="max-w-sm text-sm text-white/45">
            Join a community to see its events and, if you&apos;re the host, start scheduling
            rounds.
          </p>
          <Link
            href="/community"
            className="mt-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Browse communities
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isHost) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center text-4xl leading-none">
            🏆
          </span>
          <h2 className="font-display text-2xl tracking-wide text-white">
            Host your first event
          </h2>
          <p className="max-w-sm text-sm text-white/45">
            Use the form above to set a date, capacity, and round length. Once it&apos;s live,
            you can share a join link and start the round robin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center text-4xl leading-none">
          🕒
        </span>
        <h2 className="font-display text-2xl tracking-wide text-white">No events yet</h2>
        <p className="max-w-sm text-sm text-white/45">
          {hostName
            ? `Waiting on ${hostName} to schedule the next one. You'll get a join link once it's live.`
            : "Waiting on your community's host to schedule the next one."}
        </p>
      </CardContent>
    </Card>
  );
}
