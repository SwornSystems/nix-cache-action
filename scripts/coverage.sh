#!/usr/bin/env -S nix develop .#ci --command bash
set -euxo pipefail

npm ci
npm run coverage
