#!/usr/bin/env nix
#!nix develop --command nu

# Measure the cache an action produces via `act`.
def main [
    action: string, # Action to test.
]: nothing -> nothing {
    cd tests/act

    let workflow: string = $".github/workflows/($action).yml"
    if ($workflow | path type) != file {
        print --stderr $"No such action: ($action)"
        exit 1
    }

    let act_cache: string = $"($env.HOME)/.cache/actcache"
    rm --recursive --force $"($act_cache)/cache" $"($act_cache)/bolt.db"

    act workflow_dispatch -W $workflow

    cd $"($act_cache)/cache"
    let entries = ls **/* | where type == file
    print $"entries: ($entries | length)"
    print $"size: ($entries | get size | math sum | format filesize MiB)"
}
