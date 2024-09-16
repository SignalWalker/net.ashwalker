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
        runtime = mkOption {
          type = types.str;
          readOnly = true;
          default = "/run/${site.user}";
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
      "ashwalker-net" = {
        path = [site.eleventy];
        serviceConfig = {
          Type = "simple";
          ExecStart = "${site.eleventy}/bin/eleventy --output=${site.dirs.runtime} --watch";
          WorkingDirectory = site.dirs.state;
          StateDirectory = site.user;
          RuntimeDirectory = site.user;
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
