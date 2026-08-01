#!/usr/bin/env -S nix develop .#ci --command nu

# Run all linters and formatters.
def main []: nothing -> nothing {
    let markdown: list<string> = files "*.md"
    let scripts: list<string> = files "*.nu"
    let nix: list<string> = files "*.nix"

    # Git
    committed origin/main..HEAD

    # GitHub
    zizmor --pedantic .github

    # Spellchecking
    typos

    # Markdown
    lychee --verbose .
    let alerts = vale --no-exit --output=JSON ...$markdown | from json
    if ($alerts | is-not-empty) {
        vale ...$markdown
        exit 1
    }

    # TOML
    tombi lint --error-on-warnings

    # Nushell
    nufmt --dry-run ...$scripts
    nu-lint --config .nu-lint.toml ...$scripts

    # Nix
    nix flake check
    nixfmt --check --width=120 ...$nix
    deadnix --fail .

    # Node
    npm ci
    oxlint
    oxfmt --check
    tsgo
    npx knip
    npx vitest run
    npm run build

    # Dirty
    let dirty = git status --porcelain | str trim
    if ($dirty | is-not-empty) {
        print --stderr "Working tree dirty"
        exit 1
    }
}

def files [pattern: string]: nothing -> list<string> {
    git ls-files --cached --others --exclude-standard $pattern | lines
}
