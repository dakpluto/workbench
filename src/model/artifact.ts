/**
 * The Workbench data model.
 *
 * Everything is an Artifact. Types and statuses are open strings with a small
 * registry of known values for display; unknown values still work, they just
 * get generic presentation. Relationships live in their own table (Link) so a
 * future graph view can read them without unpacking every artifact.
 */

export type ArtifactId = string;

/** Known types get a glyph and a shelf; any other string is still a valid type. */
export type ArtifactType = string;

export interface Artifact {
  id: ArtifactId;
  /** Human-friendly catalog number, shown as WB-0042. Never reused. */
  seq: number;
  title: string;
  type: ArtifactType;
  /** One-line description shown on cards. */
  summary: string;
  /** Free-form notes. Plain text for now; may become blocks later. */
  body: string;
  status: ArtifactStatus;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  /** Last time the artifact was opened. Drives "you haven't looked at this in…" */
  viewedAt: number;
  /** Set when put away in the archive. Archive is orthogonal to status. */
  archivedAt: number | null;
  /**
   * Open-ended bag for things that don't deserve a column yet: an embedded
   * instrument id, experiment parameters, a source URL, etc.
   */
  metadata: Record<string, unknown>;
}

export interface Link {
  id: string;
  fromId: ArtifactId;
  toId: ArtifactId;
  kind: LinkKind;
  createdAt: number;
}

/* ---------- Types ---------- */

export interface TypeInfo {
  key: string;
  label: string;
  plural: string;
  glyph: string;
}

export const KNOWN_TYPES: TypeInfo[] = [
  { key: "thing", label: "Thing", plural: "Things", glyph: "·" },
  { key: "idea", label: "Idea", plural: "Ideas", glyph: "◇" },
  { key: "project", label: "Project", plural: "Projects", glyph: "▣" },
  { key: "experiment", label: "Experiment", plural: "Experiments", glyph: "△" },
  { key: "tool", label: "Tool", plural: "Tools", glyph: "⬡" },
  { key: "curiosity", label: "Curiosity", plural: "Curiosities", glyph: "◌" },
  { key: "note", label: "Note", plural: "Notes", glyph: "≡" },
  { key: "reference", label: "Reference", plural: "References", glyph: "※" },
  { key: "collection", label: "Collection", plural: "Collections", glyph: "⊞" },
];

export const DEFAULT_TYPE = "thing";

export function typeInfo(type: string): TypeInfo {
  if (typeof type !== "string" || !type) type = DEFAULT_TYPE;
  const known = KNOWN_TYPES.find((t) => t.key === type);
  if (known) return known;
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return { key: type, label, plural: label, glyph: "◦" };
}

/* ---------- Statuses ---------- */

export type ArtifactStatus = "seed" | "exploring" | "simmering" | "done" | "abandoned";

export interface StatusInfo {
  key: ArtifactStatus;
  label: string;
  hint: string;
}

export const STATUSES: StatusInfo[] = [
  { key: "seed", label: "Seed", hint: "Just an inkling" },
  { key: "exploring", label: "Exploring", hint: "On the bench right now" },
  { key: "simmering", label: "Simmering", hint: "Set aside, not forgotten" },
  { key: "done", label: "Done", hint: "Finished, or finished enough" },
  { key: "abandoned", label: "Abandoned", hint: "Left behind, kept for the record" },
];

export function statusInfo(status: string): StatusInfo {
  return STATUSES.find((s) => s.key === status) ?? STATUSES[0];
}

/** Statuses that count as "unfinished business". */
export const OPEN_STATUSES: ArtifactStatus[] = ["seed", "exploring", "simmering"];

/* ---------- Links ---------- */

export type LinkKind = "related" | "derived" | "inspired" | "contains" | "depends";

export interface LinkKindInfo {
  key: LinkKind;
  /** Read from the "from" side: A <forward> B */
  forward: string;
  /** Read from the "to" side: B <backward> A */
  backward: string;
}

export const LINK_KINDS: LinkKindInfo[] = [
  { key: "related", forward: "related to", backward: "related to" },
  { key: "derived", forward: "derived from", backward: "led to" },
  { key: "inspired", forward: "inspired by", backward: "inspired" },
  { key: "contains", forward: "contains", backward: "part of" },
  { key: "depends", forward: "depends on", backward: "needed by" },
];

export function linkKindInfo(kind: string): LinkKindInfo {
  return LINK_KINDS.find((k) => k.key === kind) ?? LINK_KINDS[0];
}

/* ---------- Helpers ---------- */

export function catalogNumber(a: Pick<Artifact, "seq">): string {
  return `WB-${String(a.seq).padStart(4, "0")}`;
}

/** The most recent moment anyone did anything with this artifact. */
export function touchedAt(a: Artifact): number {
  return Math.max(a.updatedAt, a.viewedAt);
}

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
}
