{overlay}: {
  config,
  pkgs,
  lib,
  ...
}:
with builtins; let
  std = pkgs.lib;
  site = config.services."ashwalker-net";
in {
  options = with lib; {
    services."ashwalker-net" = {
      enable = mkEnableOption "nginx vhost for ashwalker.net";
      src = mkOption {
        type = types.path;
        default = ./src;
      };
      eleventy = mkPackageOption pkgs "eleventy" {};
      user = mkOption {
        type = types.str;
        default = "ashwalker-net";
      };
      group = mkOption {
        type = types.str;
        default = "ashwalker-net";
      };
      dirs = {
        state = mkOption {
          type = types.str;
          readOnly = true;
          default = "/var/lib/${site.user}";
        };
        cache = mkOption {
          type = types.str;
          readOnly = true;
          default = "/var/cache/${site.user}";
        };
      };
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
  };
  disabledModules = [];
  imports = [];
  config = lib.mkIf site.enable {
    nixpkgs.overlays = [overlay];
    systemd.services = {
      "ashwalker-net-build" = {
        path = [site.eleventy];
        serviceConfig = {
          Type = "simple";
          ExecStart = "${site.eleventy}/bin/eleventy --input=${site.dirs.state} --output=${site.dirs.cache} --config=${site.src}/.eleventy.js";
          StateDirectory = site.user;
          CacheDirectory = site.user;
        };
      };
    };
    services.nginx.virtualHosts."${cfg.domain}" = {
      root = ./src;
      extraConfig = ''
        rewrite ^/resume?$ https://signalwalker.github.io/meta.resume permanent;
      '';
      # locations."=/resume" = {
      #   proxyPass = "https://signalwalker.github.io";
      #   extraConfig = ''
      #     proxy_redirect default;
      #     rewrite ^/resume?$ /meta.resume permanent;
      #   '';
      # };
    };
  };
  meta = {};
}
