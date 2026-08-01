#!/usr/bin/env -S nix develop .#ci --command nu

# Publish a release.
def main []: nothing -> nothing {
    if $env.CI? != "true" {
        print --stderr "Not running in CI"
        exit 1
    }

    let message = git log -1 --format=%s | str trim
    if not ($message | str starts-with "chore: Release v") {
        return
    }

    npm ci
    npx release-please github-release --repo-url SwornSystems/nix-cache-action --token $env.GITHUB_TOKEN
    npm publish --provenance --access public
}
