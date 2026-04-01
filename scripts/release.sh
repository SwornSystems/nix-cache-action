#!/usr/bin/env -S nix develop .#ci --command bash
set -euo pipefail

if [[ "${CI}" != "true" ]]; then
  exit 1
fi

MESSAGE=$(git log -1 --format=%s)
if [[ "${MESSAGE}" != "chore: release v"* ]]; then
  exit 0
fi

npm ci

npx release-please github-release \
  --repo-url DuskSystems/nix-cache-action \
  --token "${GITHUB_TOKEN}" \
  --release-type node \
  --pull-request-title-pattern 'chore: release v${version}'

npm publish --provenance --access public
