#!/usr/bin/env -S nix develop .#ci --command bash
set -euxo pipefail
shopt -s globstar

nix flake check
nixfmt --check --width=120 **/*.nix

MAIN=$(git rev-parse --verify origin/main || git rev-parse --verify main)
if BASE=$(git merge-base "${MAIN}" HEAD) && [[ "${BASE}" != "$(git rev-parse HEAD)" ]]; then
  committed "${BASE}..HEAD"
fi
typos
tombi lint --error-on-warnings
zizmor --pedantic .github
npm ci
oxlint
oxfmt --check
tsgo
npx knip
npx vitest run
npm run build
if git status --porcelain | grep .; then
  exit 1
fi
