import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { Nar } from "./nar.ts";

// Test fixtures from `tvix`:
// https://github.com/tvlfyi/tvix/tree/1becae0/nix-compat/src/nar/tests
const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

let testDir = "";

beforeAll(async () => {
  testDir = await mkdtemp(join(tmpdir(), "nar-test-"));
});

afterAll(async () => {
  await rm(testDir, { recursive: true, force: true });
});

const packAndCompare = async (sourcePath: string, fixtureName: string): Promise<void> => {
  const narPath = join(testDir, fixtureName);
  await Nar.pack(sourcePath, narPath);

  const actual = await readFile(narPath);
  const expected = await readFile(join(fixturesDir, fixtureName));
  expect(actual.equals(expected)).toBe(true);
};

describe("Nar.pack", () => {
  test("helloworld.nar", async () => {
    const path = join(testDir, "hello");
    await writeFile(path, "Hello World!");
    await packAndCompare(path, "helloworld.nar");
  });

  test("symlink.nar", async () => {
    const path = join(testDir, "link");
    await symlink("/nix/store/somewhereelse", path);
    await packAndCompare(path, "symlink.nar");
  });

  test("complicated.nar", async () => {
    const path = join(testDir, "root");
    await mkdir(path);
    await writeFile(join(path, ".keep"), "");
    await symlink("/nix/store/somewhereelse", join(path, "aa"));
    await mkdir(join(path, "keep"));
    await writeFile(join(path, "keep", ".keep"), "");
    await packAndCompare(path, "complicated.nar");
  });
});
