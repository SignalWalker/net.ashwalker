{
  description = "";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    alejandra = {
      url = "github:kamadorueda/alejandra";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    eleventy = {
      type = "github";
      owner = "11ty";
      repo = "eleventy";
      ref = "v3.0.0-alpha.20";
      flake = false;
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
          overlays = [self.overlays.default];
        });
      stdenvFor = pkgs: pkgs.stdenvAdapters.useMoldLinker pkgs.llvmPackages_latest.stdenv;
    in {
      formatter = std.mapAttrs (system: pkgs: pkgs.default) inputs.alejandra.packages;
      nixosModules.default = import ./nixos-module.nix {overlay = self.overlays.default;};
      packages =
        std.mapAttrs (system: pkgs: let
          std = pkgs.lib;
          stdenv = stdenvFor pkgs;
        in {
          eleventy = pkgs.eleventy;
          "ashwalker.net" = stdenv.mkDerivation {
            pname = "ashwalker.net";
            version = "2.0.0";
            src = ./src;
            nativeBuildInputs =
              [self.packages.${system}.eleventy]
              ++ (with pkgs; [
                ]);
            buildPhase = ''
              runHook preBuild
              mkdir $out
              eleventy --input=$src --output=$out --config=$src/.eleventy.js
              runHook postBuild
            '';
            dontInstall = true;
          };
          default = self.packages.${system}."ashwalker.net";
        })
        nixpkgsFor;
      overlays.default = final: prev: {
        eleventy = final.buildNpmPackage {
          pname = "11ty";
          version = "3.0.0-alpha.20";
          src = inputs.eleventy;
          nodejs = final.nodejs_22;
          npmDepsHash = "sha256-fa270Gb/MQh75z4nVZuzlyLdVmU8A9xZ047C01pSu/Q=";
          dontNpmBuild = true;
        };
      };
      apps =
        std.mapAttrs (system: selfPkgs: {
          eleventy = {
            type = "app";
            program = "${selfPkgs.eleventy}/bin/eleventy";
          };
        })
        self.packages;
      devShells =
        std.mapAttrs (system: pkgs: let
          selfPkgs = self.packages.${system};
          stdenv = stdenvFor pkgs;
        in {
          default = (pkgs.mkShell.override {inherit stdenv;}) {
            inputsFrom = [];
            nativeBuildInputs = with pkgs; [eleventy];
          };
        })
        nixpkgsFor;
    };
}
