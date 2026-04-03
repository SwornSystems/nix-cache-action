{
  description = "nix-cache-action";

  inputs = {
    nixpkgs = {
      url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    };
  };

  # nix flake show
  outputs =
    {
      nixpkgs,
      ...
    }:

    let
      perSystem = nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed;

      systemPkgs = perSystem (
        system:

        import nixpkgs {
          inherit system;
        }
      );

      perSystemPkgs = f: perSystem (system: f (systemPkgs.${system}));
    in
    {
      devShells = perSystemPkgs (pkgs: {
        # nix develop
        default = pkgs.mkShell {
          name = "nix-cache-action-shell";

          env = {
            # Nix
            NIX_PATH = "nixpkgs=${nixpkgs.outPath}";
          };

          buildInputs = with pkgs; [
            # Node
            nodejs
            typescript-go
            tsgolint
            oxlint
            oxfmt
            vtsls
            vscode-langservers-extracted

            # Git
            committed

            # GitHub
            act
            gh
            zizmor

            # Spellchecking
            typos
            typos-lsp

            # TOML
            tombi

            # Nix
            nixfmt
            nixd
            nil
          ];
        };

        # nix develop .#ci
        ci = pkgs.mkShell {
          name = "nix-cache-action-ci-shell";

          buildInputs = with pkgs; [
            # Node
            nodejs
            typescript-go
            tsgolint
            oxlint
            oxfmt

            # Git
            committed

            # GitHub
            zizmor

            # Spellchecking
            typos

            # TOML
            tombi

            # Nix
            nixfmt
          ];
        };
      });
    };
}
