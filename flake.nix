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
      nixosModules.default = import ./nixos-module.nix {inherit self;};
      packages =
        std.mapAttrs (system: pkgs: let
          std = pkgs.lib;
          stdenv = stdenvFor pkgs;
          nodejs = nodejsFor pkgs;
          npmDepsHash = "sha256-lCWTpZgs6RPgVI2P9jEb5qFWwRe10tnGdrnXC7yrEEE=";
        in {
          "ashwalker.net" = pkgs.buildNpmPackage {
            pname = "ashwalker.net";
            version = "2.0.0";
            src = ./.;
            inherit nodejs;
            nativeBuildInputs =
              []
              ++ (with pkgs; [
                ]);
            inherit npmDepsHash;
            postBuild = ''
              mkdir $out

              mv -t $out _site/*
            '';

            dontNpmInstall = true;
          };
          "ashwalker.net-env" = pkgs.buildNpmPackage {
            pname = "ashwalker.net-eleventy";
            inherit (self.packages.${system}."ashwalker.net") version;
            src = ./.;
            inherit nodejs;
            nativeBuildInputs =
              []
              ++ (with pkgs; [
                ]);
            inherit npmDepsHash;
            dontNpmBuild = true;
            postInstall = let
            in ''
            '';
          };
          "ashwalker.net-build-script" = pkgs.writeShellScriptBin "build-ashwalker-net" (let
            env = self.packages.${system}."ashwalker.net-env";
            nm = "${env}/lib/node_modules/ashwalker-net/node_modules";
          in ''
            env NODE_PATH=${nm}:$NODE_PATH ${nodejs}/bin/node ${nm}/.bin/eleventy "$@"
          '');
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
            packages = with pkgs; [neocities];
            nativeBuildInputs = [nodejs];
          };
        })
        nixpkgsFor;
    };
}
