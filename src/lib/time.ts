const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function daysSince(t: number, now = Date.now()): number {
  return Math.floor((now - t) / DAY);
}

/** Compact relative time: "just now", "12m", "3h", "yesterday", "14d", "5mo". */
export function ago(t: number, now = Date.now()): string {
  const d = now - t;
  if (d < MIN) return "just now";
  if (d < HOUR) return `${Math.floor(d / MIN)}m ago`;
  if (d < DAY) return `${Math.floor(d / HOUR)}h ago`;
  const days = Math.floor(d / DAY);
  if (days === 1) return "yesterday";
  if (days < 60) return `${days}d ago`;
  if (days < 730) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function stamp(t: number): string {
  return new Date(t).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
