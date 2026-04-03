#!/usr/bin/env -S nix develop --command bash
set -euo pipefail

GITHUB_TOKEN=$(gh auth token)
npx release-please release-pr \
  --repo-url DuskSystems/nix-cache-action \
  --token "${GITHUB_TOKEN}"
