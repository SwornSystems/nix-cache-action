import type { Db } from "./db.ts";

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { Nar } from "./nar.ts";

interface NarInfo {
  file: string;
  fields: Map<string, string>;
}

export class Cache {
  static readonly path = join(tmpdir(), "nix-cache-action");
  private entries: NarInfo[];

  private constructor(entries: NarInfo[]) {
    this.entries = entries;
  }

  static async open(): Promise<Cache> {
    const files = await readdir(Cache.path);
    const narInfos = await Promise.all(
      files
        .filter((file) => file.endsWith(".narinfo"))
        .map(async (file) => {
          const filePath = join(Cache.path, file);
          const content = await readFile(filePath, "utf8");
          const fields = Cache.parseNarInfo(content);
          return { file, fields };
        })
    );

    return new Cache(narInfos);
  }

  static async init(): Promise<void> {
    await mkdir(Cache.path, { recursive: true });
    await writeFile(join(Cache.path, "nix-cache-info"), "StoreDir: /nix/store\n");
  }

  // Caches ultimate paths.
  async populate(paths: string[], db: Db): Promise<number> {
    const narDirectory = join(Cache.path, "nar");
    await mkdir(narDirectory, { recursive: true });

    const ultimates = db.ultimates(paths);
    const newEntries = await Promise.all(
      ultimates.map(async (info) => {
        const [storeHash] = basename(info.path).split("-");
        const references = info.references.map((ref) => basename(ref)).join(" ");

        const narPath = join(narDirectory, `${storeHash}.nar`);
        const nar = await Nar.pack(info.path, narPath);

        const fields = new Map([
          ["StorePath", info.path],
          ["URL", `nar/${storeHash}.nar`],
          ["Compression", "none"],
          ["FileHash", `sha256:${nar.nix32}`],
          ["FileSize", String(nar.size)],
          ["NarHash", `sha256:${nar.nix32}`],
          ["NarSize", String(nar.size)],
          ["References", references]
        ]);

        const narInfoFile = `${storeHash}.narinfo`;
        const narInfoPath = join(Cache.path, narInfoFile);
        const narInfo = [...fields].map(([key, value]) => `${key}: ${value}`).join("\n");
        await writeFile(narInfoPath, `${narInfo}\n`);

        return { file: narInfoFile, fields };
      })
    );

    this.entries.push(...newEntries);
    return newEntries.length;
  }

  gc(activePaths: Set<string>): Promise<NarInfo[]> {
    return this.retain((narInfo) => {
      const path = narInfo.fields.get("StorePath");
      return path === undefined || activePaths.has(path);
    });
  }

  async sync(substituters: string[]): Promise<NarInfo[]> {
    if (this.entries.length === 0 || substituters.length === 0) {
      return [];
    }

    const results = await Promise.all(
      this.entries.map(async (narInfo) => {
        const hash = basename(narInfo.file, ".narinfo");
        const checks = substituters.map(async (sub) => {
          const response = await fetch(`${sub}/${hash}.narinfo`, {
            method: "HEAD",
            signal: AbortSignal.timeout(5000)
          });

          if (!response.ok) {
            throw new Error(`Not found: ${sub}/${hash}.narinfo`);
          }
        });

        // Short-circuit on first substituter hit.
        const available = await Promise.any(checks).then(
          () => true,
          () => false
        );

        return { narInfo, available };
      })
    );

    const upstream = new Set(results.filter((result) => result.available).map((result) => result.narInfo));
    return this.retain((narInfo) => !upstream.has(narInfo));
  }

  // Keeps matching entries, deletes the rest from disk.
  private async retain(predicate: (narInfo: NarInfo) => boolean): Promise<NarInfo[]> {
    const targets = this.entries.filter((narInfo) => !predicate(narInfo));
    if (targets.length === 0) {
      return [];
    }

    await Promise.all(
      targets.map(async (narInfo) => {
        const url = narInfo.fields.get("URL");
        if (url !== undefined) {
          const narFile = join(Cache.path, url);
          await rm(narFile, { force: true });
        }

        const narInfoPath = join(Cache.path, narInfo.file);
        await rm(narInfoPath, { force: true });
      })
    );

    const removed = new Set(targets);
    this.entries = this.entries.filter((narInfo) => !removed.has(narInfo));

    return targets;
  }

  private static parseNarInfo(content: string): Map<string, string> {
    const fields = new Map<string, string>();

    for (const line of content.split("\n")) {
      if (line.includes(":")) {
        const separator = line.indexOf(":");
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();
        fields.set(key, value);
      }
    }

    return fields;
  }
}
