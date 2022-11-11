{
  description = "static personal website";
  inputs = {
    nixpkgs.url = github:NixOS/nixpkgs/nixpkgs-unstable;
    alejandra = {
      url = github:kamadorueda/alejandra;
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
        name = mkOption rec {
          type = types.str;
          default = "ashwalker.net";
          example = default;
          description = "The name of the nginx virtual host to generate for this site";
        };
        ssl = {
          enable = mkEnableOption "ssl";
          force = mkEnableOption "force ssl";
          autoRenewEmail = mkOption {
            type = types.nullOr types.str;
            default = null;
          };
        };
      };
      config = let
        cfg = config.services.ashwalker-net;
      in
        lib.mkIf cfg.enable {
          services.nginx.virtualHosts = {
            "${cfg.name}" = {
              enableACME = cfg.ssl.autoRenewEmail != null;
              addSSL = cfg.ssl.enable;
              forceSSL = cfg.ssl.force;
              root = ./src;
              locations."/".index = "index.html";
            };
          };
          security.acme.certs = lib.mkIf (cfg.ssl.autoRenewEmail != null) {
            ${cfg.name}.email = cfg.ssl.autoRenewEmail;
          };
        };
    };
  };
}
