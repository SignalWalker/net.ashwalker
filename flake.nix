{
  description = "static personal website";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, nixpkgs, flake-utils }: let
    utils = flake-utils.lib;
  in utils.eachSystem [ "x86_64-linux" "aarch64-linux" ] (system: let
    pkgs = import nixpkgs { inherit system; overlays = [ self.overlays.${system} ]; };
  in {
    overlays = final: prev: {
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
    packages = { inherit (pkgs) ashwalker-net; };
    defaultPackage = self.packages.${system}.ashwalker-net;
    nixosModules = ({ config, pkgs, lib, ... }: {
      options.signal.services.ashwalker-net = with lib; {
        enable = mkEnableOption "personal static website";
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
      config = let cfg = config.signal.services.ashwalker-net; in lib.mkIf cfg.enable {
        services.nginx.virtualHosts = lib.mkIf cfg.vhost.enable {
          "${cfg.vhost.name}" = {
            enableACME = cfg.vhost.forceSSL;
            forceSSL = cfg.vhost.forceSSL;
            root = self.packages.${system}.ashwalker-net;
            locations."/".index = "index.html";
          };
        };
      };
    });
  });
}
