![license: MIT/Apache-2.0](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg)
[![npm](https://img.shields.io/npm/v/@dusksystems/nix-cache-action)](https://www.npmjs.com/package/@dusksystems/nix-cache-action)

[![codecov](https://codecov.io/gh/DuskSystems/nix-cache-action/graph/badge.svg)](https://codecov.io/gh/DuskSystems/nix-cache-action)

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

## License

`nix-cache-action` is licensed under the terms of both the [MIT License](LICENSE-MIT) and the [Apache License (Version 2.0)](LICENSE-APACHE).
