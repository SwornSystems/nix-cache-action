import * as actions from "@actions/cache";
import * as core from "@actions/core";

import { Cache } from "./cache.ts";
import { Db } from "./db.ts";
import { Nix } from "./nix.ts";
import { Snapshot } from "./snapshot.ts";

const main = async (): Promise<void> => {
  const nix = await Nix.load();
  core.info(nix.version);

  const key = core.getState("key");
  const matchedKey = core.getState("matched-key");

  if (matchedKey === key) {
    core.info("Exact cache hit, skipping save");
    return;
  }

  const db = Db.open();

  const before = await Snapshot.load();
  const after = Snapshot.take(db);
  core.info(`Store snapshot: ${after.activePaths.size} paths`);

  const newPaths = after.diff(before);
  core.info(`New paths: ${newPaths.length}`);

  const cache = await Cache.open();

  if (newPaths.length > 0) {
    const populated = await cache.populate(newPaths, db);
    core.info(`Locally-built paths: ${populated}`);
  }

  db.close();

  const stale = await cache.gc(after.activePaths);
  if (stale.length > 0) {
    core.info(`GC: removed ${stale.length} stale paths`);
  }

  const upstream = await cache.sync(nix.substituters);
  if (upstream.length > 0) {
    core.info(`Substituter sync: removed ${upstream.length} paths now available upstream`);
  }

  await actions.saveCache([Cache.path], key);
  core.info(`Cache saved with key: ${key}`);
};

try {
  await main();
} catch (error: unknown) {
  if (error instanceof Error) {
    core.setFailed(error.message);
  }
}
