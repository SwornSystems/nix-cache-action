#!/usr/bin/env bash
set -euxo pipefail

rm -rf ~/.cache/actcache/cache ~/.cache/actcache/bolt.db
act workflow_dispatch -W .github/workflows/cache-nix-action.yml

ENTRIES=$(find ~/.cache/actcache/cache -type f | wc -l)
echo "entries: ${ENTRIES}"

SIZE=$(du -sh ~/.cache/actcache/cache | cut -f 1)
echo "size: ${SIZE}"
