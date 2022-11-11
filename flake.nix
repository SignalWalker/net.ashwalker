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
          default = config.networking.fqdn;
          description = "The name of the nginx virtual host to generate for this site";
        };
        ssl = {
          enable = mkOption {
		    type = types.either types.bool (types.enum [ "force" ]);
			default = false;
		  };
        };
      };
      config = let
        cfg = config.services.ashwalker-net;
      in
        lib.mkIf cfg.enable {
          services.nginx.virtualHosts = {
            "${cfg.name}" = {
              enableACME = cfg.ssl.enable != false;
              addSSL = cfg.ssl.enable == true;
              forceSSL = cfg.ssl.enable == "force";
              root = ./src;
              locations."/".root = ./src;
            };
          };
        };
    };
  };
}
