#!/usr/bin/env -S nix develop --command nu

# Open a release pull request.
def main []: nothing -> nothing {
    let auth = do { gh auth token } | complete
    if $auth.exit_code != 0 {
        print --stderr "Not signed in to GitHub"
        exit 1
    }

    let token = $auth.stdout | str trim
    npx release-please release-pr --repo-url SwornSystems/nix-cache-action --token $token
}
