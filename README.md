![license: MIT/Apache-2.0](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg)
[![npm](https://img.shields.io/npm/v/@dusksystems/nix-cache-action)](https://www.npmjs.com/package/@dusksystems/nix-cache-action)

# `nix-cache-action`

A GitHub Action for caching Nix.

## Usage

```yaml
- name: Cache Nix
  uses: DuskSystems/nix-cache-action@v0.1.0
  with:
    key: nix-${{ runner.os }}-${{ runner.arch }}-${{ hashFiles('flake.lock', '**/*.nix') }}
    restore-keys: |
      nix-${{ runner.os }}-${{ runner.arch }}-
```

## Why?

- [`nix-community/cache-nix-action`] caches the entire `/nix` directory.
- [`DeterminateSystems/magic-nix-cache`] caches every store path closure.
- [`DuskSystems/nix-cache-action`] caches only what can't be fetched from substituters.

As an example, a project with this Nix shell:

```nix
pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    # System
    pkg-config
  ];

  buildInputs = with pkgs; [
    # Rust
    rust-bin.stable.latest.default
    cargo-nextest
    cargo-shear

    # System
    openssl

    # Spellchecking
    typos

    # Nix
    nixfmt
  ];
}
```

Results in the following cache save stats:

| Action             | Entries | Size    |
| ------------------ | ------- | ------- |
| `cache-nix-action` | 1       | 961 MiB |
| `magic-nix-cache`  | 200     | 798 MiB |
| `nix-cache-action` | 1       | 377 MiB |

The tradeoff of course is this relies on the substituters being consistently available, and fast to fetch from, at restore time.

## License

`nix-cache-action` is licensed under the terms of both the [MIT License](LICENSE-MIT) and the [Apache License (Version 2.0)](LICENSE-APACHE).

[`nix-community/cache-nix-action`]: https://github.com/nix-community/cache-nix-action
[`DeterminateSystems/magic-nix-cache`]: https://github.com/DeterminateSystems/magic-nix-cache
[`DuskSystems/nix-cache-action`]: https://github.com/DuskSystems/nix-cache-action
