{
  description = "integration";

  inputs = {
    nixpkgs = {
      url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    };
  };

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
        default =
          let
            nix-cache-action = pkgs.runCommand "nix-cache-action" { } ''
              mkdir -p $out/bin
              echo '#!/bin/sh' > $out/bin/nix-cache-action
              echo 'echo nix-cache-action' >> $out/bin/nix-cache-action
              chmod +x $out/bin/nix-cache-action
            '';
          in
          pkgs.mkShell {
            name = "integration-shell";

            buildInputs = with pkgs; [
              hello
              nix-cache-action
            ];
          };
      });
    };
}
