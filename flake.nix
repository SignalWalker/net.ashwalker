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
            type = types.either types.bool (types.enum ["force"]);
            default = false;
          };
        };
      };
      config = let
        cfg = config.services.ashwalker-net;
      in
        lib.mkIf cfg.enable {
          services.nginx.virtualHosts."${cfg.name}" = let
            wfPath = "/well-known/webfinger.json";
          in {
            enableACME = cfg.ssl.enable != false;
            addSSL = cfg.ssl.enable == true;
            forceSSL = cfg.ssl.enable == "force";
            root = ./src;
            serverAliases = ["www.ashwalker.net"];
            # webfinger (see https://willnorris.com/2014/07/webfinger-with-static-files-nginx/)
            locations."/.well-known/webfinger" = {
              extraConfig = ''
                if ($request_method != ^(GET|HEAD)$) { return 405; }
                set_by_lua $resource 'return ngx.unescape_uri(ngx.req.get_uri_args()["resource"])';
                if ($resource = "") { return 400; }
                if ($resource = "acct:ash@ashwalker.net")   { rewrite .* ${wfPath} last; }
                if ($resource = "mailto:ash@ashwalker.net") { rewrite .* ${wfPath} last; }
                if ($resource = "https://ashwalker.net")    { rewrite .* ${wfPath} last; }
                if ($resource = "https://ashwalker.net/")   { rewrite .* ${wfPath} last; }
              '';
            };
            locations."${wfPath}" = {
              extraConfig = ''
                types { application/jrd+json json; }
                add_header Access-Control-Allow-Origin "*";
              '';
            };
            locations."/.well-known" = {
              root = ./src/well-known;
            };
          };
        };
    };
  };
}
