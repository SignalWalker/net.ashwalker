{
  description = "static personal website";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable-small";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, nixpkgs, flake-utils }: let
    systems = ["x86_64-linux"];
    utils = flake-utils.lib;
    lib = nixpkgs.lib;
    syspkgs = lib.genAttrs systems (system: import nixpkgs { inherit system; overlays = [ self.overlay ]; });
  in rec {
    overlay = final: prev: {
      ashwalker-net = (final.stdenv.mkDerivation {
        name = "ashwalker-net";
        version = "1.0.0";
        src = ./src;
        installPhase = ''
          mkdir $out
          cp -R ./* $out
        '';
        meta = with final.lib; {
          description = "A package for serving my personal static website";
          homepage = https://ashwalker.net;
          license = licenses.agpl3;
          platforms = platforms.linux;
          maintainers = [ "Ash Walker" ];
        };
      });
    };
    packages = lib.genAttrs systems (system: {
      inherit (syspkgs.${system}) ashwalker-net;
    });
    defaultPackage = lib.genAttrs systems (system: self.packages.${system}.ashwalker-net);
    nixosModule = ({ config, pkgs, lib, ... }: {
      options.signal.services.ashwalker-net = with lib; {
        enable = mkEnableOption "personal static website";
        #repo = mkOption rec {
        #  type = types.str;
        #  default = "gitlab.com:SignalWalker/ashwalker.net";
        #  example = default;
        #  description = "Repo from which to clone the static site files";
        #};
        vhost = {
          enable = mkEnableOption "personal website nginx vhost";
          name = mkOption rec {
            type = types.str;
            default = "ashwalker.net";
            example = default;
            description = "If not null, the name of the nginx virtual host to generate for this site";
          };
          forceSSL = mkEnableOption "ssl + acme";
        };
      };
      config = let cfg = config.signal.services.ashwalker-net; in lib.mkIf cfg.enable rec {
        services.nginx.virtualHosts = lib.mkIf cfg.vhost.enable {
          "${cfg.vhost.name}" = {
            enableACME = cfg.vhost.forceSSL;
            forceSSL = cfg.vhost.forceSSL;
            root = pkgs.ashwalker-net;
            locations."/".index = "index.html";
          };
        };
      };
    });
  };
}
