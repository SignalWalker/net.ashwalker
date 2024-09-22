---
title: "Melia"
tags:
  - article
  - post
  - melia
  - web
  - css
  - rust
---

[Melia](/project/melia/) is a web server designed for personal websites, and, if you're reading this on [ashwalker.net](https://ashwalker.net/), it's what served you this page (probably through Nginx).

I originally used [Eleventy](https://www.11ty.dev/) for static site generation, but there were a couple features that couldn't really work with a purely static site (ex. comments, posting from my phone, etc.), so I decided to write a whole web server in Rust and now I'm gonna explain to you how it works.
