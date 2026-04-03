#!/usr/bin/env bash
set -euxo pipefail

rm -rf ~/.cache/actcache/cache ~/.cache/actcache/bolt.db
act workflow_dispatch -W .github/workflows/magic-nix-cache.yml

# Exclude Rust binary from measurement.
rm -f ~/.cache/actcache/cache/01/1

ENTRIES=$(find ~/.cache/actcache/cache -type f | wc -l)
echo "entries: ${ENTRIES}"

SIZE=$(du -sh ~/.cache/actcache/cache | cut -f 1)
echo "size: ${SIZE}"
