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
        forceSSL = mkEnableOption "ssl + acme";
      };
      config = let
        cfg = config.signal.services.ashwalker-net;
      in
        lib.mkIf cfg.enable {
          services.nginx.virtualHosts = {
            "${cfg.name}" = {
              enableACME = cfg.forceSSL;
              forceSSL = cfg.forceSSL;
              root = ./src;
              locations."/".index = "index.html";
            };
          };
        };
    };
  };
}
