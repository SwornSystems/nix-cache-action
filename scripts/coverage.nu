#!/usr/bin/env -S nix develop .#ci --command nu

# Generate a coverage report.
def main []: nothing -> nothing {
    npm ci
    npx vitest run --coverage
}
