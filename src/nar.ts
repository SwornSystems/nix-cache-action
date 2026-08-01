import type { WriteStream } from "node:fs";

import { createHash, type Hash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { createReadStream } from "node:fs";
import { lstat, readdir, readlink } from "node:fs/promises";
import { join } from "node:path";

import { Nix } from "./nix.ts";

const ZEROS = Buffer.alloc(7, 0);

interface NarResult {
  nix32: string;
  size: number;
}

// Serializes a store path as a Nix archive.
export class Nar {
  private readonly hash: Hash;
  private readonly file: WriteStream;
  private size = 0;

  private constructor(destination: string) {
    this.hash = createHash("sha256");
    this.file = createWriteStream(destination);
  }

  static async pack(storePath: string, destination: string): Promise<NarResult> {
    const nar = new Nar(destination);

    nar.str("nix-archive-1");
    await nar.packPath(storePath);

    await new Promise<void>((resolve, reject) => {
      nar.file.end(() => {
        resolve();
      });

      nar.file.on("error", reject);
    });

    const { size } = nar;
    const nix32 = Nix.nix32(nar.hash.digest());

    return { nix32, size };
  }

  private async packPath(fsPath: string): Promise<void> {
    const stats = await lstat(fsPath);
    this.str("(");

    if (stats.isFile()) {
      this.str("type");
      this.str("regular");

      if (stats.mode & 0o111) {
        this.str("executable");
        this.str("");
      }

      this.str("contents");
      await this.streamFile(fsPath, stats.size);
    } else if (stats.isSymbolicLink()) {
      this.str("type");
      this.str("symlink");
      this.str("target");
      this.str(await readlink(fsPath));
    } else if (stats.isDirectory()) {
      this.str("type");
      this.str("directory");

      const entries = await readdir(fsPath);
      entries.sort();

      for (const entry of entries) {
        this.str("entry");
        this.str("(");
        this.str("name");
        this.str(entry);
        this.str("node");
        await this.packPath(join(fsPath, entry)); // oxlint-disable-line no-await-in-loop
        this.str(")");
      }
    }

    this.str(")");
  }

  private async streamFile(fsPath: string, fileSize: number): Promise<void> {
    const length = Buffer.allocUnsafe(8);
    length.writeBigUInt64LE(BigInt(fileSize));

    this.hash.update(length);
    this.file.write(length);
    this.size += 8;

    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream(fsPath);
      stream.on("data", (chunk: Buffer) => {
        this.hash.update(chunk);
        this.size += chunk.length;

        if (!this.file.write(chunk)) {
          stream.pause();
          this.file.once("drain", () => void stream.resume());
        }
      });

      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const padding = (8 - (fileSize % 8)) % 8;
    if (padding > 0) {
      const pad = ZEROS.subarray(0, padding);
      this.hash.update(pad);
      this.file.write(pad);
      this.size += padding;
    }
  }

  private str(value: string | Buffer): void {
    const bytes = typeof value === "string" ? Buffer.from(value, "utf8") : value;

    const length = Buffer.allocUnsafe(8);
    length.writeBigUInt64LE(BigInt(bytes.length));

    this.hash.update(length);
    this.file.write(length);
    this.hash.update(bytes);
    this.file.write(bytes);
    this.size += 8 + bytes.length;

    const padding = (8 - (bytes.length % 8)) % 8;
    if (padding > 0) {
      const pad = ZEROS.subarray(0, padding);
      this.hash.update(pad);
      this.file.write(pad);
      this.size += padding;
    }
  }
}
