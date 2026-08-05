import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type EventCardProps = {
  event: {
    id: string;
    name: string;
    event_date: string;
    profiles: { name: string } | { name: string }[] | null;
    communities: { name: string } | { name: string }[] | null;
  };
};

function firstOf<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function EventCard({ event }: EventCardProps) {
  const host = firstOf(event.profiles);
  const community = firstOf(event.communities);

  const date = new Date(event.event_date + "T00:00:00");
  const formatted = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="group h-full transition-colors hover:border-primary/50">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {formatted}
              </p>
              <h3 className="mt-1 font-display text-2xl tracking-wide text-white group-hover:text-primary">
                {event.name}
              </h3>
            </div>
            {community && <Badge tone="accent">{community.name}</Badge>}
          </div>
          <p className="mt-3 text-sm text-white/45">
            Hosted by <span className="text-white/70">{host?.name ?? "Unknown"}</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
