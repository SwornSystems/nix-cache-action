import type { Db } from "./db.ts";

import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export class Snapshot {
  static readonly path = join(tmpdir(), "nix-cache-action-snapshot");
  readonly activePaths: Set<string>;

  private constructor(activePaths: Set<string>) {
    this.activePaths = activePaths;
  }

  static take(db: Db): Snapshot {
    return new Snapshot(db.allPaths());
  }

  static async load(): Promise<Snapshot> {
    const content = await readFile(Snapshot.path, "utf8");
    const paths = new Set(content.trim().split("\n").filter(Boolean));
    return new Snapshot(paths);
  }

  async save(): Promise<void> {
    const content = [...this.activePaths].join("\n");
    await writeFile(Snapshot.path, content);
  }

  diff(other: Snapshot): string[] {
    return [...this.activePaths].filter((path) => !other.activePaths.has(path));
  }
}
