import type { Artifact } from "../model/artifact";
import { catalogNumber } from "../model/artifact";

/**
 * Tiny in-memory search: every word in the query must appear somewhere.
 * Title hits rank above tag hits, which rank above body hits.
 * "#tag" restricts to that tag; "wb-12" matches catalog numbers.
 */
export function search(artifacts: Artifact[], query: string): Artifact[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return artifacts;

  const scored: [Artifact, number][] = [];
  for (const a of artifacts) {
    const title = a.title.toLowerCase();
    const summary = a.summary.toLowerCase();
    const body = a.body.toLowerCase();
    const cat = catalogNumber(a).toLowerCase();
    let score = 0;
    let all = true;
    for (let term of terms) {
      if (term.startsWith("#")) {
        const tag = term.slice(1);
        if (a.tags.some((t) => t.startsWith(tag))) score += 3;
        else all = false;
        continue;
      }
      // Naive plural folding so "city" finds "cities".
      if (term.length >= 4) term = term.replace(/(ies|es|s|y)$/, "");
      let s = 0;
      if (title.includes(term)) s += title.startsWith(term) ? 6 : 4;
      if (a.tags.some((t) => t.includes(term))) s += 3;
      if (a.type.includes(term)) s += 2;
      if (summary.includes(term)) s += 2;
      if (body.includes(term)) s += 1;
      if (cat.includes(term)) s += 5;
      if (s === 0) all = false;
      score += s;
    }
    if (all) scored.push([a, score]);
  }
  return scored.sort((x, y) => y[1] - x[1]).map(([a]) => a);
}
