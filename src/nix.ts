import { execFile as execFileCallback, spawn } from "node:child_process";
import { access, appendFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

// oxlint-disable-next-line typescript/strict-void-return
const execFile = promisify(execFileCallback);

enum Platform {
  Linux = "linux",
  Darwin = "darwin"
}

enum Mode {
  MultiUser = "multi-user",
  SingleUser = "single-user"
}

export class Nix {
  readonly platform: Platform;
  readonly mode: Mode;
  readonly substituters: readonly string[];

  private constructor(init: Readonly<{ platform: Platform; mode: Mode; substituters: readonly string[] }>) {
    this.platform = init.platform;
    this.mode = init.mode;
    this.substituters = init.substituters;
  }

  static async load(): Promise<Nix> {
    const platform = Nix.detectPlatform();

    const [substitutersResult, mode] = await Promise.all([
      execFile("nix", ["config", "show", "substituters"]),
      Nix.detectMode()
    ]);

    const substituters = substitutersResult.stdout
      .trim()
      .split(" ")
      .filter((substituter) => !substituter.startsWith("file://"));

    return new Nix({ platform, mode, substituters });
  }

  // Registers the cache directory as a Nix substituter.
  async register(cacheDirectory: string): Promise<void> {
    const substituter = `extra-substituters = file://${cacheDirectory}?trusted=true\n`;

    switch (this.mode) {
      case Mode.MultiUser: {
        await this.registerMultiUser(substituter);
        break;
      }
      case Mode.SingleUser: {
        await this.registerSingleUser(substituter);
        break;
      }
    }
  }

  private static detectPlatform(): Platform {
    switch (process.platform) {
      case "linux": {
        return Platform.Linux;
      }
      case "darwin": {
        return Platform.Darwin;
      }
      case "aix":
      case "android":
      case "cygwin":
      case "freebsd":
      case "haiku":
      case "netbsd":
      case "openbsd":
      case "sunos":
      case "win32": {
        break;
      }
    }

    throw new Error(`Unsupported platform: ${process.platform}`);
  }

  private static async detectMode(): Promise<Mode> {
    try {
      await access("/nix/var/nix/daemon-socket/socket");
      return Mode.MultiUser;
    } catch {
      return Mode.SingleUser;
    }
  }

  private async registerMultiUser(substituter: string): Promise<void> {
    const nixDirectory = "/etc/nix";
    await execFile("sudo", ["mkdir", "-p", nixDirectory]);

    const nixConf = join(nixDirectory, "nix.conf");
    await new Promise<void>((resolve, reject) => {
      const proc = spawn("sudo", ["tee", "-a", nixConf], { stdio: ["pipe", "ignore", "inherit"] });
      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to append to ${nixConf}`));
        }
      });

      proc.on("error", reject);
      proc.stdin.end(substituter);
    });

    switch (this.platform) {
      case Platform.Darwin: {
        await execFile("sudo", ["launchctl", "kickstart", "-k", "system/org.nixos.nix-daemon"]);
        break;
      }
      case Platform.Linux: {
        await execFile("sudo", ["systemctl", "restart", "nix-daemon"]);
        break;
      }
    }
  }

  private async registerSingleUser(substituter: string): Promise<void> {
    const nixDirectory = join(homedir(), ".config", "nix");
    await mkdir(nixDirectory, { recursive: true });

    const nixConf = join(nixDirectory, "nix.conf");
    await appendFile(nixConf, substituter);
  }

  // Encodes bytes as nix32.
  static nix32(bytes: Buffer): string {
    const alphabet = "0123456789abcdfghijklmnpqrsvwxyz";

    let value = 0n;
    for (let index = bytes.length - 1; index >= 0; index--) {
      value = (value << 8n) | BigInt(bytes[index]);
    }

    const length = Math.ceil((bytes.length * 8) / 5);
    const chars = Array.from<string>({ length });

    for (let index = length - 1; index >= 0; index--) {
      chars[index] = alphabet[Number(value & 0x1fn)];
      value >>= 5n;
    }

    return chars.join("");
  }
}
