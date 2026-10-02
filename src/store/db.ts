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
    // v0.1 quick capture could save artifacts with no type; give them the default.
    this.version(2).upgrade((tx) =>
      tx
        .table("artifacts")
        .toCollection()
        .modify((a: Partial<Artifact>) => {
          if (typeof a.type !== "string" || !a.type) a.type = "thing";
          if (!Array.isArray(a.tags)) a.tags = [];
          if (typeof a.status !== "string") a.status = "seed";
        }),
    );
  }
}

export const db = new WorkbenchDB();
