import type { Artifact } from "./model/artifact";

/**
 * Shelves are just saved ways of looking at the one collection.
 * Adding a new shelf is adding an entry here.
 */
export interface Shelf {
  slug: string;
  label: string;
  glyph: string;
  /** Pre-fills the type when creating from this shelf. */
  type?: string;
  filter: (a: Artifact) => boolean;
  empty: string;
}

const live = (a: Artifact) => !a.archivedAt;
const ofType = (type: string) => (a: Artifact) => live(a) && a.type === type;

export const SHELVES: Shelf[] = [
  { slug: "projects", label: "Projects", glyph: "▣", type: "project", filter: ofType("project"), empty: "No projects yet. Anything can grow into one." },
  { slug: "ideas", label: "Ideas", glyph: "◇", type: "idea", filter: ofType("idea"), empty: "No ideas pinned up. Half-formed ones count." },
  { slug: "experiments", label: "Experiments", glyph: "△", type: "experiment", filter: ofType("experiment"), empty: "Nothing being tested. What would you like to poke at?" },
  { slug: "tools", label: "Tools", glyph: "⬡", type: "tool", filter: ofType("tool"), empty: "The tool wall is bare. Small utilities welcome." },
  { slug: "curiosities", label: "Curiosities", glyph: "◌", type: "curiosity", filter: ofType("curiosity"), empty: "No open questions. Surely something is nagging at you." },
  { slug: "everything", label: "Everything", glyph: "∗", filter: live, empty: "The bench is empty." },
  { slug: "archive", label: "Archive", glyph: "⌂", filter: (a) => !!a.archivedAt, empty: "Nothing archived. Things you put away end up here." },
];

export function shelfBySlug(slug: string | undefined): Shelf | undefined {
  return SHELVES.find((s) => s.slug === slug);
}
