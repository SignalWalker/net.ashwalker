---
title: "Adding Comments To This Site"
summary: "JavaScript package managers are the devil."
date: 2024-10-17T10:30:25-04:00
tags:
  - post
  - article
  - meta
  - javascript
  - nix
  - yarn
---
I've been wanting to add a comment section to the site but I don't want to use any third-party services, so I hadn't done so until after finding out about [Comentario](https://comentario.app/), which is an open-source comment server that I'm now self-hosting [an instance of](https://comments.ashwalker.net/). This *would* have been pretty simple to set up if I were using Debian/Ubuntu (for which Comentario has already been packaged) or if I were willing to use Docker, but my server's running [NixOS](https://nixos.org/), which didn't have a Comentario package.

[Until now!](https://github.com/signalwalker/nix.pkg.comentario) I made one myself.

This ended up being much more complicated than I initially aassumed because, while building the *backend* was pretty easy, the *frontend* is built with [Yarn](https://yarnpkg.com/), which isn't supported very well by the build tools available in Nixpkgs. I ended up having to go through a lot of trial-and-error to figure out exactly what build tools the frontend depended on -- for example, [Hugo](https://gohugo.io/) is used, but the [docs](https://docs.comentario.app/en/installation/building/), as of 2024-10-17, don't mention it.

I initially used [`mkYarnPackage`](https://nixos.org/manual/nixpkgs/unstable/#javascript-yarn2nix-mkYarnPackage), because that seemed like the obvious answer, but apparently that's not very useful for building web frontends, so I wasted a lot of time trying to get that to work until I just gave up and wrote a custom build script.

The main issue ended up being the `yarn run generate` step, which uses [OpenAPI Generator](https://openapi-generator.tech/), which nixpkgs *does* provide but which tries to download a specific version of itself at runtime, so I had write a script to patch the build config to use the nixpkgs version.

Its NixOS module is pretty standard for this sort of thing (just a simple systemd service and a Nginx vhost), and adding the web components to the site template was trivial, so at least everything else was easy.
