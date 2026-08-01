![license: MIT/Apache-2.0](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg)
[![npm](https://img.shields.io/npm/v/@swornsystems/nix-cache-action)](https://www.npmjs.com/package/@swornsystems/nix-cache-action)

[![codecov](https://codecov.io/gh/SwornSystems/nix-cache-action/graph/badge.svg)](https://app.codecov.io/gh/SwornSystems/nix-cache-action)

# `nix-cache-action`

A GitHub Action for caching Nix.

## Usage

```yaml
- name: Cache Nix
  uses: SwornSystems/nix-cache-action@${VERSION}
  with:
    key: nix-${{ runner.os }}-${{ runner.arch }}-${{ hashFiles('**/flake.lock', '**/*.nix') }}
    restore-keys: |
      nix-${{ runner.os }}-${{ runner.arch }}-
```

## Why

### Efficiency

- [`nix-community/cache-nix-action`] caches the entire `/nix` directory.
- [`DeterminateSystems/magic-nix-cache`] caches every store path closure.
- [`SwornSystems/nix-cache-action`] caches only what substituters can't offer.

As an example, a project with this setup:

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

| Action                               | Entries | Size    |
| ------------------------------------ | ------- | ------- |
| `nix-community/cache-nix-action`     | 1       | 682 MiB |
| `DeterminateSystems/magic-nix-cache` | 200     | 523 MiB |
| `SwornSystems/nix-cache-action`      | 1       | 377 MiB |

The tradeoff is this relies on substituters being consistently available and fast to fetch from at restore time.

### Compatibility

Since this action uses [`@actions/cache`], it should be compatible with alternative GitHub Actions runners with their own cache backends.

## License

Licensed under the terms of both the [MIT License](LICENSE-MIT) and the [Apache License (Version 2.0)](LICENSE-APACHE).

<!-- Footer -->

[`nix-community/cache-nix-action`]: https://github.com/nix-community/cache-nix-action
[`DeterminateSystems/magic-nix-cache`]: https://github.com/DeterminateSystems/magic-nix-cache
[`SwornSystems/nix-cache-action`]: https://github.com/SwornSystems/nix-cache-action
[`@actions/cache`]: https://github.com/actions/toolkit/tree/main/packages/cache
