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
    eleventy-navigation = {
      type = "github";
      owner = "11ty";
      repo = "eleventy-navigation";
      ref = "v0.3.5";
      flake = false;
    };
    eleventy-plugin-syntaxhighlight = {
      type = "github";
      owner = "11ty";
      repo = "eleventy-plugin-syntaxhighlight";
      ref = "v5.0.0";
      flake = false;
    };
    eleventy-plugin-rss = {
      type = "github";
      owner = "11ty";
      repo = "eleventy-plugin-rss";
      ref = "v2.0.2";
      flake = false;
    };
    eleventy-img = {
      type = "github";
      owner = "11ty";
      repo = "eleventy-img";
      ref = "v5.0.0-beta.10";
      flake = false;
    };
    markdown-it = {
      type = "github";
      owner = "markdown-it";
      repo = "markdown-it";
      ref = "14.1.0";
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
                lightningcss
              ]);
            buildPhase = ''
              runHook preBuild
              mkdir $out
              cd $src
              eleventy --output=$out
              runHook postBuild
            '';
            dontInstall = true;
          };
          default = self.packages.${system}."ashwalker.net";
        })
        nixpkgsFor;
      overlays.default = final: prev: let
        nodejs = final.nodejs_22;
      in {
        mkPackageLock = {nodejs ? final.nodejs_latest, ...} @ args:
          final.stdenvNoCC.mkDerivation ((removeAttrs args ["nodejs"])
            // {
              pname = args.pname or "package-lock.json";
              version = args.version or "";
              nativeBuildInputs = (args.nativeBuildInputs or []) ++ [nodejs];
              outputHashMode = "flat";
              outputHashAlgo = args.outputHashAlgo or "sha256";
              outputHash = args.outputHash or final.lib.fakeHash;
              buildPhase = ''
                runHook preBuild
                cd $src
                npm i --package-lock-only --verbose
                runHook postBuild
              '';
              installPhase = ''
                runHook preInstall
                mv $src/package-lock.json $out
                runHook postInstall
              '';
            });
        eleventy-navigation = final.buildNpmPackage {
          pname = "eleventy-navigation";
          version = "0.3.5";
          src = inputs.eleventy-navigation;
          inherit nodejs;
          dontNpmBuild = true;
          patches = [./plugin-locks/eleventy-navigation.patch];
          npmDepsHash = "sha256-kVZc2M3sVFFgqTAR+2K76PkwwU/Y6I2nYPr/lUlSqmw=";
        };
        eleventy-plugin-syntaxhighlight = final.buildNpmPackage {
          pname = "eleventy-plugin-syntaxhighlight";
          version = "5.0.0";
          src = inputs.eleventy-plugin-syntaxhighlight;
          inherit nodejs;
          dontNpmBuild = true;
          patches = [./plugin-locks/eleventy-plugin-syntaxhighlight.patch];
          npmDepsHash = "sha256-+/gg0fEY50UKTaKcvVpCxlNNeHBVdNnJOTrMoprSy40=";
        };
        eleventy-plugin-rss = final.buildNpmPackage {
          pname = "eleventy-plugin-rss";
          version = "2.0.2";
          src = inputs.eleventy-plugin-rss;
          inherit nodejs;
          dontNpmBuild = true;
          patches = [./plugin-locks/eleventy-plugin-rss.patch];
          npmDepsHash = "sha256-AzkUgyEHEUgaRvlVNlcHH2N5v2GZJRSqJh2F8w4gX0c=";
        };
        eleventy-img = final.buildNpmPackage {
          pname = "eleventy-img";
          version = "5.0.0-beta.10";
          src = inputs.eleventy-img;
          inherit nodejs;
          dontNpmBuild = true;
          patches = [./plugin-locks/eleventy-img.patch];
          npmDepsHash = "sha256-cCFeuAlqfesaYHLSZfc7vhK5tJe91Fb0gSmA0brRkys=";
        };
        markdown-it = final.buildNpmPackage {
          pname = "markdown-it";
          version = "14.1.0";
          src = inputs.markdown-it;
          inherit nodejs;
          patches = [./plugin-locks/markdown-it.patch];
          npmDepsHash = "sha256-MxvmEybCookMhM1b6S1i8aEG8LBx1Xw+x82qvilqjpA=";
        };
        eleventy = final.buildNpmPackage {
          pname = "eleventy";
          version = "3.0.0-alpha.20";
          src = inputs.eleventy;
          inherit nodejs;
          npmDepsHash = "sha256-fa270Gb/MQh75z4nVZuzlyLdVmU8A9xZ047C01pSu/Q=";
          dontNpmBuild = true;
          postInstall = let
            extraNodeModules = std.concatStringsSep ":" (map (module: "${module}/lib/node_modules") [
              final.eleventy-navigation
              final.eleventy-plugin-syntaxhighlight
              final.eleventy-plugin-rss
              final.eleventy-img
              final.markdown-it
            ]);
          in ''
            mv $out/bin/eleventy $out/bin/.eleventy-unwrapped
            makeWrapper $out/bin/.eleventy-unwrapped $out/bin/eleventy \
              --inherit-argv0 \
              --suffix NODE_PATH : ${extraNodeModules}
          '';
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
            inputsFrom = [self.packages.${system}."ashwalker.net"];
            nativeBuildInputs = with pkgs; [nodejs_22 eleventy];
          };
        })
        nixpkgsFor;
    };
}
