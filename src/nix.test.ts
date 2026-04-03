import { describe, expect, test } from "vitest";

import { Nix } from "./nix.ts";

// Test fixtures from `tvix`:
// https://github.com/tvlfyi/tvix/blob/1becae0/nix-compat/src/nixbase32.rs
describe("toNix32", () => {
  test("empty bytes", () => {
    expect(Nix.toNix32(Buffer.alloc(0))).toBe("");
  });

  test("one byte", () => {
    expect(Nix.toNix32(Buffer.from("1f", "hex"))).toBe("0z");
  });

  test("store path", () => {
    const input = Buffer.from("8a12321522fd91efbd60ebb2481af88580f61600", "hex");
    expect(Nix.toNix32(input)).toBe("00bgd045z0d4icpbc2yyz4gx48ak44la");
  });

  test("sha256", () => {
    const input = Buffer.from("b3a24de97a8fdbc835b9833169501030b8977031bcb54b3b3ac13740f846ab30", "hex");
    expect(Nix.toNix32(input)).toBe("0c5b8vw40dy178xlpddw65q9gf1h2186jcc3p4swinwggbllv8mk");
  });
});
