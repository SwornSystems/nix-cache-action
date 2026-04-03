{
  description = "integration";

  inputs = {
    nixpkgs = {
      url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    };

    rust-overlay = {
      url = "github:oxalica/rust-overlay";

      inputs = {
        nixpkgs.follows = "nixpkgs";
      };
    };
  };

  outputs =
    {
      nixpkgs,
      rust-overlay,
      ...
    }:

    let
      perSystem = nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed;

      systemPkgs = perSystem (
        system:

        import nixpkgs {
          inherit system;

          overlays = [
            rust-overlay.overlays.default
          ];
        }
      );

      perSystemPkgs = f: perSystem (system: f (systemPkgs.${system}));
    in
    {
      devShells = perSystemPkgs (pkgs: {
        default = pkgs.mkShell.override { stdenv = pkgs.clangStdenv; } {
          name = "integration-shell";

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
        };
      });
    };
}
