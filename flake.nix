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
        domain = mkOption rec {
          type = types.str;
          default = config.networking.fqdn;
          description = "The name of the nginx virtual host to generate for this site";
        };
      };
      config = let
        cfg = config.services.ashwalker-net;
      in
        lib.mkIf cfg.enable {
          services.nginx.virtualHosts."${cfg.domain}" = let
            wfPath = "/well-known/webfinger.json";
          in {
            root = ./src;
            # webfinger (see https://willnorris.com/2014/07/webfinger-with-static-files-nginx/)
            locations."/.well-known/webfinger" = {
              extraConfig = ''
                if ($request_method !~ ^(GET|HEAD)$) { return 405; }
                if ($resource = "") { return 400; }
                if ($resource = "acct%3Aash%40${cfg.domain}")   { rewrite .* ${wfPath} last; }
                if ($resource = "mailto%3Aash%40${cfg.domain}") { rewrite .* ${wfPath} last; }
                if ($resource = "https%3A%2F%2F${cfg.domain}")    { rewrite .* ${wfPath} last; }
                if ($resource = "https%3A%2F%2F${cfg.domain}%2F")   { rewrite .* ${wfPath} last; }
              '';
            };
            locations."${wfPath}" = {
              extraConfig = ''
                types { application/jrd+json json; }
                add_header Access-Control-Allow-Origin "*";
              '';
            };
          };
        };
    };
  };
}
