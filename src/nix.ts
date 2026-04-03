import { exec as execCallback, execFile as execFileCallback } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execCallback);
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
  readonly version: string;
  readonly platform: Platform;
  readonly mode: Mode;
  readonly substituters: string[];

  private constructor(init: { version: string; platform: Platform; mode: Mode; substituters: string[] }) {
    this.version = init.version;
    this.platform = init.platform;
    this.mode = init.mode;
    this.substituters = init.substituters;
  }

  // Detects platform/mode and loads version + substituters in parallel.
  static async load(): Promise<Nix> {
    const platform = Nix.detectPlatform();

    const [versionResult, substitutersResult, mode] = await Promise.all([
      execFile("nix", ["--version"]),
      execFile("nix", ["config", "show", "substituters"]),
      Nix.detectMode()
    ]);

    const version = versionResult.stdout.trim();
    const substituters = substitutersResult.stdout
      .trim()
      .split(" ")
      .filter((substituter) => !substituter.startsWith("file://"));

    return new Nix({ version, platform, mode, substituters });
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
        throw new Error(`Unsupported platform: ${process.platform}`);
      }
    }
  }

  private static async detectMode(): Promise<Mode> {
    try {
      await execFile("pgrep", ["-x", "nix-daemon"]);
      return Mode.MultiUser;
    } catch {
      return Mode.SingleUser;
    }
  }

  private async registerMultiUser(substituter: string): Promise<void> {
    const nixDirectory = "/etc/nix";
    await exec(`sudo mkdir -p ${nixDirectory}`);
    await exec(`echo ${JSON.stringify(substituter)} | sudo tee -a ${nixDirectory}/nix.conf`);

    switch (this.platform) {
      case Platform.Darwin: {
        await exec("sudo launchctl kickstart -k system/org.nixos.nix-daemon");
        break;
      }
      case Platform.Linux: {
        await exec("sudo systemctl restart nix-daemon");
        break;
      }
    }
  }

  private async registerSingleUser(substituter: string): Promise<void> {
    const nixDirectory = join(homedir(), ".config", "nix");
    await exec(`mkdir -p ${nixDirectory}`);
    await exec(`echo ${JSON.stringify(substituter)} | tee -a ${nixDirectory}/nix.conf`);
  }

  // Encodes bytes as Nix base32.
  static toBase32(bytes: Buffer): string {
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
