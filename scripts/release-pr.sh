#!/usr/bin/env -S nix develop --command bash
set -euo pipefail

GITHUB_TOKEN=$(gh auth token)
npx release-please release-pr \
  --repo-url DuskSystems/nix-cache-action \
  --token "${GITHUB_TOKEN}" \
  --release-type node \
  --bump-minor-pre-major \
  --pull-request-title-pattern 'chore: Release v${version}'
