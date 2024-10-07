---
title: "How to Block Scrapers on Every Nginx Virtualhost in NixOS"
date: 2024-09-18T19:34
modified: 2024-09-24
tags:
  - "article"
  - "nix"
  - "nginx"
summary: "Because my bandwidth usage is already too high."
---

A couple months ago I realized that a lot of my home bandwidth was being eaten by AI scrapers constantly refreshing the login screen of the [Jellyfin](https://jellyfin.org) instance I host for my friends on my home server. Regardless of one's opinions about the ethicality of LLMs, the scrapers gathering training data for them are bad for the ecosystem and they're making me pay extra money to Comcast, so: here's how to block them in [Nginx](https://nginx.org/) (as long as you're using [NixOS](https://nixos.org)).

First, [here](https://github.com/ai-robots-txt/ai.robots.txt/blob/main/robots.txt) is a `robots.txt` file containing a list of user agent strings for common scrapers. If you want to add that to a vhost, you can add this to the vhost config:
```
location =/robots.txt {
  alias /path/to/the/robots.txt/file;
}
```

Web crawlers are *supposed* to respect rules set in `robots.txt` files, but they sometimes ignore them (either through malice or by mistake), so it's also useful to block them entirely.

All you have to do to block a specific user agent in Nginx is to add something like this to the server config, where "GPTBot", "Amazonbot" and "Bytespider" are the user agent strings you want to block:
```
if ($http_user_agent ~* "(GPTBot|Amazonbot|Bytespider)") {
  return 444;
}
```
("444" isn't a real HTTP status code; [Nginx uses it internally to signal that it should drop the connection without a response.](https://nginx.org/en/docs/http/request_processing.html))

Nginx, as far as I know, doesn't let you set common configuration settings shared by all vhosts, so, if you've got more than one vhost, you'll have to do a lot of copy-and-pasting. *Nix*, however, makes that (relatively) simple.

The naive way to do this in NixOS would be something like this:
```nix
services.nginx.virtualHosts = let
  robots = ["GPTBot" "Amazonbot" "Bytespider"];
  rules = lib.concatStringsSep "|" robots;
  robotsTxt = let
    agentsStr = pkgs.lib.concatStringsSep "\n" (map (agent: "User-agent: ${agent}" robots));
  in pkgs.writeText "robots.txt" ''
    ${agentsStr}
    Disallow: /
  '';
in {
  "vhost-A" = {
    # ... other config ...
    locations."=/robots.txt".alias = ${robotsTxt};
    extraConfig = ''
      if ($http_user_agent ~* "(${rules})") {
        return 444;
      }
    '';
  };
  "vhost-B" = {
    # ... other config ...
    locations."=/robots.txt".alias = ${robotsTxt};
    extraConfig = ''
      if ($http_user_agent ~* "(${rules})") {
        return 444;
      }
    '';
  };
  # ... and so on
};
```

But that gets tedious and it's easy to forget to add the rules to a specific vhost. Instead, you can override the `services.nginx.virtualHosts` module to automatically apply the rules for you:
```nix
let
  robots = ["GPTBot" "Amazonbot" "Bytespider"];
  rules = lib.concatStringsSep "|" robots;
  robotsTxt = let
    agentsStr = pkgs.lib.concatStringsSep "\n" (map (agent: "User-agent: ${agent}" robots));
  in pkgs.writeText "robots.txt" ''
    ${agentsStr}
    Disallow: /
  '';
in {
  options = with lib; {
    services.nginx.virtualHosts = mkOption {
      type = types.attrsOf (types.submodule {
        config = {
          locations."=/robots.txt" = lib.mkDefault {
            alias = robotsTxt;
          };
          extraConfig = ''
            if ($http_user_agent ~* "(${rules})") {
              return 444;
            }
          '';
        };
      });
    };
  };
  config = {
    # normal nginx vhost config goes here
  };
}
```

Because that overrides the submodule used by `virtualHosts.<name>`, this configuration will automatically apply to every vhost, including ones defined by external modules.

## Addendum, 2024-09-24

[I wrote a NixOS module](https://github.com/SignalWalker/nix.nginx.vhost-defaults) implementing this, including automatically getting the block list from [ai-robots-txt](https://github.com/ai-robots-txt/ai.robots.txt).

::: small
Apparently, the NixOS manual does actually obliquely reference that you can type-merge submodules, in the [documentation for `types.deferredModule`](https://nixos.org/manual/nixos/unstable/#sec-option-types-submodule).
:::
