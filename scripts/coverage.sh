#!/usr/bin/env -S nix develop .#ci --command bash
set -euxo pipefail

npm ci
npx vitest run --coverage
