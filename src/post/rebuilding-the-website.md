---
title: "Rebuilding the Website"
tags:
  - article
  - post
  - web
  - nix
  - eleventy
  - javascript
  - systemd
date: 2024-11-17
---

Because [Cohost is shutting down](https://cohost.org/staff/post/7611443-cohost-to-shut-down), I decided to rebuild my whole website so I could use it as a blog. I already have an [ActivityPub server](https://social.ashwalker.net/Ash), but the software running it ([Akkoma](https://akkoma.dev/AkkomaGang/akkoma/)) doesn't really work well for long-form posting.

I hadn't been using any sort of site generator for this website -- the whole thing was entirely manual, which involved a lot of copy-and-pasting and would've made something like an RSS feed a Sisyphean effort.

<aside class="end"><img src="/post/ashwalker.net_old.png" alt="A screenshot of the old version of this website." title="The old version of this website." /></aside>

Ideally, I'd have written some sort of bespoke HTTP server in Rust, with on-demand page generation, image processing, and ActivityPub support, but I, unfortunately, have a life outside of yak shaving trivial projects, so, instead, I'm just using [Eleventy](https://www.11ty.dev/).

This server runs [Nix](https://nixos.org/), though, ~~so I've also set up a relatively simple NixOS module defining a couple systemd services to build the site whenever it detects a change to its source folder. (I'm doing it this way instead of just building it once during `nixos-rebuild` so that I can post things without having to go in and rebuild the whole system every time.)~~ Nevermind, I had insomnia last night and I don't want to deal anymore with trying to get Eleventy to work in a systemd unit installed through Nix; it's just building in a derivation for now.

(Make sure not to use Git LFS in a Nix flake repo; <a href="https://github.com/NixOS/nix/issues/10079" rel="external">it's illegal as of Nix 2.20.</a> This has been causing problems for like 2 hours and I only just now discovered why.)

Eleventy is pretty simple to use, so most of the work here has been in wrangling Nix and NodeJS to cooperate with each other and in dealing with weird CSS edge cases (like the tiny gap underneath images in posts that I can't seem to get rid of).

There are a couple extra things I'd like to get to (like CSS for mobile & a dark theme), but this is good enough for now -- I've been at this long enough that I'm typing `;` instead of `.` at the end of my sentences, so I think it's time to work on something else.

[Here's the source code](https://git.ashwalker.net/ashwalker.net/src/tag/v2.0.0), if anyone's interested.

