import * as actions from "@actions/cache";
import * as core from "@actions/core";

import { Cache } from "./cache.ts";
import { Db } from "./db.ts";
import { Nix } from "./nix.ts";
import { Snapshot } from "./snapshot.ts";

const main = async (): Promise<void> => {
  const nix = await Nix.load();

  const key = core.getInput("key", { required: true });
  const restoreKeys = core
    .getInput("restore-keys")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  await Cache.init();

  const matchedKey = await actions.restoreCache([Cache.path], key, restoreKeys);
  if (matchedKey === undefined) {
    core.info("Cache miss");
  } else {
    core.info(`Cache restored from key: ${matchedKey}`);
  }

  const cacheHit = matchedKey === key;
  core.setOutput("cache-hit", String(cacheHit));
  core.saveState("key", key);
  core.saveState("substituters", nix.substituters.join(" "));

  if (cacheHit) {
    core.saveState("matched-key", matchedKey);
  }

  await nix.register(Cache.path);

  const db = Db.open();
  const snapshot = Snapshot.take(db);
  db.close();

  await snapshot.save();
  core.info(`Store snapshot: ${snapshot.activePaths.size} paths`);
};

try {
  await main();
} catch (error: unknown) {
  core.setFailed(error instanceof Error ? error.message : String(error));
}
