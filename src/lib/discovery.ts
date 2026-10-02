import { OPEN_STATUSES, touchedAt, type Artifact } from "../model/artifact";
import { daysSince } from "./time";

/**
 * Heuristics for the bench. Deliberately simple — these are the seams where
 * smarter discovery (clusters, embeddings, AI) can slot in later.
 */

const LONG_AGO_DAYS = 21;

/** Small deterministic PRNG so a "random" pick holds steady for a day. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function dayNumber(now = Date.now()) {
  return Math.floor(now / 86_400_000);
}

/** Pick something that's been left alone a while. Same pick all day unless `nonce` changes. */
export function resurface(artifacts: Artifact[], nonce = 0): Artifact | null {
  const live = artifacts.filter((a) => !a.archivedAt);
  const forgotten = live.filter((a) => daysSince(touchedAt(a)) >= LONG_AGO_DAYS);
  const pool = forgotten.length ? forgotten : live;
  if (!pool.length) return null;
  // Weight older things more heavily.
  const weights = pool.map((a) => 1 + Math.sqrt(daysSince(touchedAt(a))));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = seeded(dayNumber() * 7919 + nonce)() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/** A fully random pick, for "surprise me". */
export function randomPick(artifacts: Artifact[], excludeId?: string): Artifact | null {
  const pool = artifacts.filter((a) => !a.archivedAt && a.id !== excludeId);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

const UNFINISHED_DAYS = 14;

/** Open things nobody has touched in a couple of weeks. */
export function unfinished(artifacts: Artifact[]): Artifact[] {
  return artifacts
    .filter(
      (a) =>
        !a.archivedAt &&
        OPEN_STATUSES.includes(a.status) &&
        a.status !== "exploring" &&
        daysSince(touchedAt(a)) >= UNFINISHED_DAYS,
    )
    .sort((a, b) => touchedAt(b) - touchedAt(a));
}

/** Tags shared by several open artifacts — a hint of a recurring interest. */
export function recurringThreads(artifacts: Artifact[], min = 3): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const a of artifacts) {
    if (a.archivedAt) continue;
    for (const t of a.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts]
    .filter(([, c]) => c >= min)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
