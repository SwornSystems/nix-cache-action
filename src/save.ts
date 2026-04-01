import * as core from "@actions/core";

try {
  core.info("nix-cache-action: save");
} catch (error: unknown) {
  if (error instanceof Error) {
    core.setFailed(error.message);
  }
}
