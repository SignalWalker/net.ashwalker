---
date: 2024-10-24T11:08:31-04:00
tags:
  - post
  - idea
  - game
---
had an idea for a weird "mmo"-ish thing where, like, if somebody has a website, they could add a web component to a page, and it would replace itself with a game client that lets you walk around a 2D room that the site author could design and arrange like in animal crossing, and you could hang out in it with whoever else is looking at that same page in that moment

and then maybe you could also walk out of that room and walk to a neighboring building, which would take you to another website running the same game?

there would, unfortunately, have to be a central server that clients connect to just because of the way that websockets work, but you'd be able to host your own pretty easily if you wanted to, and all it'd do is coordinate client connections (and maybe keep track of cross-site metadata like "these two sites are neighbors"?)
