import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import {
  DEFAULT_TYPE,
  normalizeTag,
  type Artifact,
  type ArtifactId,
  type Link,
  type LinkKind,
} from "../model/artifact";

/**
 * The only door into persistence. Components use these hooks and actions;
 * nothing outside store/ knows that Dexie or IndexedDB exist.
 *
 * Personal collections are small, so the hooks load the whole set and
 * filtering happens in memory. Revisit if that ever stops being true.
 */

/* ---------- Reading ---------- */

export function useArtifacts(): Artifact[] | undefined {
  return useLiveQuery(() => db.artifacts.toArray(), []);
}

export function useArtifact(id: ArtifactId | undefined): Artifact | null | undefined {
  return useLiveQuery(async () => (id ? ((await db.artifacts.get(id)) ?? null) : null), [id]);
}

export interface ResolvedLink {
  link: Link;
  /** The artifact on the other end. */
  other: Artifact;
  /** True when the current artifact is the link's "from" side. */
  outgoing: boolean;
}

export function useLinksFor(id: ArtifactId | undefined): ResolvedLink[] | undefined {
  return useLiveQuery(async () => {
    if (!id) return [];
    const [out, inc] = await Promise.all([
      db.links.where("fromId").equals(id).toArray(),
      db.links.where("toId").equals(id).toArray(),
    ]);
    const all = [...out.map((l) => ({ l, outgoing: true })), ...inc.map((l) => ({ l, outgoing: false }))];
    const others = await db.artifacts.bulkGet(all.map(({ l, outgoing }) => (outgoing ? l.toId : l.fromId)));
    return all
      .map(({ l, outgoing }, i) => ({ link: l, outgoing, other: others[i] }))
      .filter((r): r is ResolvedLink => !!r.other)
      .sort((a, b) => b.link.createdAt - a.link.createdAt);
  }, [id]);
}

/** Number of links per artifact, for showing connection counts on cards. */
export function useLinkCounts(): Map<ArtifactId, number> | undefined {
  return useLiveQuery(async () => {
    const counts = new Map<ArtifactId, number>();
    for (const l of await db.links.toArray()) {
      counts.set(l.fromId, (counts.get(l.fromId) ?? 0) + 1);
      counts.set(l.toId, (counts.get(l.toId) ?? 0) + 1);
    }
    return counts;
  }, []);
}

/* ---------- Writing ---------- */

export type NewArtifact = Partial<Omit<Artifact, "id" | "seq">> & { title: string };

export async function createArtifact(input: NewArtifact): Promise<Artifact> {
  const now = Date.now();
  return db.transaction("rw", db.artifacts, db.meta, async () => {
    const counter = (await db.meta.get("seq"))?.value ?? 0;
    const seq = counter + 1;
    await db.meta.put({ key: "seq", value: seq });
    const artifact: Artifact = {
      id: crypto.randomUUID(),
      seq,
      type: DEFAULT_TYPE,
      summary: "",
      body: "",
      status: "seed",
      createdAt: now,
      updatedAt: now,
      viewedAt: now,
      archivedAt: null,
      metadata: {},
      ...input,
      title: input.title.trim() || "Untitled thing",
      tags: [...new Set((input.tags ?? []).map(normalizeTag).filter(Boolean))],
    };
    await db.artifacts.add(artifact);
    return artifact;
  });
}

export type ArtifactPatch = Partial<Omit<Artifact, "id" | "seq" | "createdAt">>;

export async function updateArtifact(id: ArtifactId, patch: ArtifactPatch): Promise<void> {
  const clean = { ...patch };
  if (clean.tags) clean.tags = [...new Set(clean.tags.map(normalizeTag).filter(Boolean))];
  await db.artifacts.update(id, { ...clean, updatedAt: Date.now() });
}

/** Record a visit without counting it as an edit. */
export async function markViewed(id: ArtifactId): Promise<void> {
  await db.artifacts.update(id, { viewedAt: Date.now() });
}

export async function setArchived(id: ArtifactId, archived: boolean): Promise<void> {
  await updateArtifact(id, { archivedAt: archived ? Date.now() : null });
}

export async function deleteArtifact(id: ArtifactId): Promise<void> {
  await db.transaction("rw", db.artifacts, db.links, async () => {
    await db.links.where("fromId").equals(id).delete();
    await db.links.where("toId").equals(id).delete();
    await db.artifacts.delete(id);
  });
}

export async function connect(fromId: ArtifactId, toId: ArtifactId, kind: LinkKind): Promise<void> {
  if (fromId === toId) return;
  const existing = await db.links.where("fromId").equals(fromId).filter((l) => l.toId === toId && l.kind === kind).first();
  if (existing) return;
  await db.links.add({ id: crypto.randomUUID(), fromId, toId, kind, createdAt: Date.now() });
}

export async function disconnect(linkId: string): Promise<void> {
  await db.links.delete(linkId);
}

/* ---------- Backup ---------- */

export interface WorkbenchExport {
  format: "workbench";
  version: 1;
  exportedAt: number;
  artifacts: Artifact[];
  links: Link[];
}

export async function exportAll(): Promise<WorkbenchExport> {
  const [artifacts, links] = await Promise.all([db.artifacts.toArray(), db.links.toArray()]);
  return { format: "workbench", version: 1, exportedAt: Date.now(), artifacts, links };
}

/** Merge an export into the current bench. Items with the same id are overwritten. */
export async function importAll(data: WorkbenchExport): Promise<{ artifacts: number; links: number }> {
  if (data?.format !== "workbench" || !Array.isArray(data.artifacts)) {
    throw new Error("This file isn't a Workbench export.");
  }
  await db.transaction("rw", db.artifacts, db.links, db.meta, async () => {
    await db.artifacts.bulkPut(data.artifacts);
    await db.links.bulkPut(data.links ?? []);
    const maxSeq = Math.max(0, ...data.artifacts.map((a) => a.seq ?? 0));
    const counter = (await db.meta.get("seq"))?.value ?? 0;
    if (maxSeq > counter) await db.meta.put({ key: "seq", value: maxSeq });
  });
  return { artifacts: data.artifacts.length, links: data.links?.length ?? 0 };
}
