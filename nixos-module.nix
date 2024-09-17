{self}: {
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
      buildScript = mkOption {
        type = types.package;
        readOnly = true;
        default = self.packages.${pkgs.system}."ashwalker.net-build-script";
      };
      user = mkOption {
        type = types.str;
        default = "ashwalker-net";
      };
      group = mkOption {
        type = types.str;
        default = "ashwalker-net";
      };
      dirs = {
        configuration = mkOption {
          type = types.str;
          readOnly = true;
          default = "/etc/${site.user}";
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
    users.users.${site.user} = {
      isSystemUser = true;
      group = site.group;
    };
    users.groups.${site.group} = {};
    # environment.etc."${site.user}" = {
    #   user = site.user;
    #   group = site.group;
    #   source = site.src;
    # };
    # systemd.services = {
    #   "ashwalker-net-build" = {
    #     # partOf = ["ashwalker-net-watcher.path"];
    #     wantedBy = ["multi-user.target"];
    #     serviceConfig = {
    #       Type = "oneshot";
    #       ExecStartPre = "${pkgs.coreutils}/bin/rm -rf ${site.dirs.cache}/*";
    #       ExecStart = "${site.buildScript}/bin/build-ashwalker-net --output=${site.dirs.cache}";
    #       WorkingDirectory = site.dirs.configuration;
    #       ConfigurationDirectory = site.user;
    #       CacheDirectory = site.user;
    #       User = site.user;
    #       Group = site.group;
    #     };
    #   };
    # };
    # systemd.paths = {
    #   "ashwalker-net-watcher" = {
    #     wantedBy = ["multi-user.target"];
    #     pathConfig = {
    #       PathModified = site.dirs.configuration;
    #       Unit = "ashwalker-net-build.service";
    #       MakeDirectory = true;
    #       TriggerLimitIntervalSec = "1m";
    #     };
    #   };
    # };
    services.nginx.virtualHosts."${site.domain}" = {
      root = self.packages.${pkgs.system}."ashwalker.net";
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
