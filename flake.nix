{
  description = "static personal website";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    alejandra = {
      url = "github:kamadorueda/alejandra";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs = {
    self,
    nixpkgs,
    alejandra,
  }: let
    std = nixpkgs.lib;
  in {
    formatter = std.mapAttrs (system: pkgs: pkgs.default) alejandra.packages;
    nixosModules.default = {
      config,
      pkgs,
      lib,
      ...
    }: {
      options.services."ashwalker-net" = with lib; {
        enable = mkEnableOption "nginx vhost for ashwalker.net";
        domain = mkOption {
          type = types.str;
          default = config.networking.fqdn;
          description = "The name of the nginx virtual host to generate for this site";
        };
        favicon = mkOption {
          type = types.path;
          readOnly = true;
          default = ./src/favicon.ico;
          description = "Nix store path to the favicon used for this site. Immutable.";
        };
      };
      config = let
        cfg = config.services.ashwalker-net;
      in
        lib.mkIf cfg.enable {
          services.nginx.virtualHosts."${cfg.domain}" = {
            root = ./src;
            locations."~ =/resume" = {
              return = "301 $scheme://signalwalker.github.io/meta.resume";
            };
          };
        };
    };
  };
}
