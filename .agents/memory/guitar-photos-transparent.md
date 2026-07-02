---
name: Guitar catalog photos are transparent
description: The bundled guitar photos have had their backgrounds removed; keep new ones transparent.
---

The photo-real guitar images in
`artifacts/ags-fretboard/src/assets/guitars/<id>.png` (loaded by
`lib/guitarPhoto.ts`, shown by `GuitarThumb` everywhere — vault grid, detail
modal, avatar, and the Hall cabinet) were originally AI studio shots on a dark
cosmic STARFIELD background. They have all been background-removed to transparent
PNGs so the guitar floats (matching the hall's `guitar_frankenbolt.png`).

**Why:** in the cabinet close-up a guitar on an opaque dark box looks like an
ugly rectangle inside the purple niche; transparent guitars hang cleanly.

**How to apply:** any NEW or regenerated guitar photo must be a transparent PNG
(run background removal before saving) or it will show a box in the cabinet/hall.
The starfield backgrounds are gradients with stars, so use the background-removal
service — a flat chroma-key won't work. Pre-removal originals were backed up to
`.local/guitar-photo-backup/` during the first pass.

# Back-view reference images (`<id>-back.png`)

The same folder also holds a `<id>-back.png` rear view for every guitar. These are
EXPORT-ONLY reference art (handed to Meshy to build 3D models) — **the app never
imports them**, so don't treat them as runtime assets or wire them into GuitarThumb.
They were AI-generated to match each front's shape/finish/colour, transparent
background, 3:4. Recipe that worked: prompt = body-shape phrase + finish/colour
phrase + (bolt-on neck plate vs set-neck heel) + (tremolo cavity cover only for
strat/superstrat) + "BACK of guitar, headstock up, centered, plain grey bg";
negative-prompt out the front (pickups/pickguard/knobs/strings/logo); generate on
grey then `removeBackground: true`. If you add a new catalog guitar, make a
matching `-back.png` the same way.
