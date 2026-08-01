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
      self,
      nixpkgs,
      ...
    }:

    let
      perSystem = nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed;

      systemPkgs = perSystem (
        system:

        import nixpkgs {
          inherit system;

          overlays = [
            self.overlays.default
          ];
        }
      );

      perSystemPkgs = f: perSystem (system: f (systemPkgs.${system}));
    in
    {
      overlays = {
        default = final: _prev: {
          vale-styles = final.symlinkJoin {
            name = "vale-styles";
            paths = with final.valeStyles; [
              proselint
              write-good
              redhat
            ];
          };
        };
      };

      devShells = perSystemPkgs (pkgs: {
        # nix develop
        default = pkgs.mkShell {
          name = "nix-cache-action-shell";

          env = {
            # Nix
            NIX_PATH = "nixpkgs=${nixpkgs.outPath}";

            # Vale
            VALE_STYLES_PATH = "${pkgs.vale-styles}/share/vale/styles";
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

            # YAML
            yaml-language-server

            # Git
            committed

            # GitHub
            act
            gh
            pinact
            zizmor

            # Spellchecking
            typos
            typos-lsp

            # Markdown
            lychee
            vale
            vale-ls

            # TOML
            tombi

            # Nushell
            nushell
            nufmt
            nu-lint

            # Nix
            deadnix
            nixfmt
            nixd
            nil
          ];
        };

        # nix develop .#ci
        ci = pkgs.mkShell {
          name = "nix-cache-action-ci-shell";

          env = {
            # Vale
            VALE_STYLES_PATH = "${pkgs.vale-styles}/share/vale/styles";
          };

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

            # Markdown
            lychee
            vale

            # TOML
            tombi

            # Nushell
            nushell
            nufmt
            nu-lint

            # Nix
            deadnix
            nixfmt
          ];
        };
      });
    };
}
