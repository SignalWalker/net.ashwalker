{
  description = "";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    alejandra = {
      url = "github:kamadorueda/alejandra";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs = inputs @ {
    self,
    nixpkgs,
    ...
  }:
    with builtins; let
      std = nixpkgs.lib;
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-darwin"
        "x86_64-linux"
      ];
      nixpkgsFor = std.genAttrs systems (system:
        import nixpkgs {
          localSystem = builtins.currentSystem or system;
          crossSystem = system;
          overlays = [];
        });
      stdenvFor = pkgs: pkgs.stdenvAdapters.useMoldLinker pkgs.llvmPackages_latest.stdenv;
      nodejsFor = pkgs: pkgs.nodejs_22;
    in {
      formatter = std.mapAttrs (system: pkgs: pkgs.default) inputs.alejandra.packages;
      nixosModules.default = import ./nixos-module.nix {overlay = self.overlays.default;};
      packages =
        std.mapAttrs (system: pkgs: let
          std = pkgs.lib;
          stdenv = stdenvFor pkgs;
          nodejs = nodejsFor pkgs;
        in {
          "ashwalker.net" = pkgs.buildNpmPackage {
            pname = "ashwalker.net";
            version = "2.0.0";
            src = ./.;
            inherit nodejs;
            nativeBuildInputs =
              []
              ++ (with pkgs; [
                lightningcss
              ]);
          };
          default = self.packages.${system}."ashwalker.net";
        })
        nixpkgsFor;
      devShells =
        std.mapAttrs (system: pkgs: let
          selfPkgs = self.packages.${system};
          stdenv = stdenvFor pkgs;
          nodejs = nodejsFor pkgs;
        in {
          default = (pkgs.mkShell.override {inherit stdenv;}) {
            # inputsFrom = [self.packages.${system}."ashwalker.net"];
            nativeBuildInputs = [nodejs] ++ (with pkgs; [nodejs_22]);
          };
        })
        nixpkgsFor;
    };
}
