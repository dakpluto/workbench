import Dexie, { type EntityTable } from "dexie";
import type { Artifact, Link } from "../model/artifact";

/**
 * IndexedDB via Dexie. Only the store/ folder should import this —
 * the UI talks to store/artifacts.ts so the backing store can change later.
 */
export class WorkbenchDB extends Dexie {
  artifacts!: EntityTable<Artifact, "id">;
  links!: EntityTable<Link, "id">;
  meta!: EntityTable<{ key: string; value: number }, "key">;

  constructor() {
    super("workbench");
    this.version(1).stores({
      artifacts: "id, seq, type, status, createdAt, updatedAt, viewedAt, archivedAt, *tags",
      links: "id, fromId, toId",
      meta: "key",
    });
  }
}

export const db = new WorkbenchDB();
