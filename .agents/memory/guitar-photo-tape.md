---
name: Guitar photo logo tape
description: How brand logos on the photo-real guitar images are handled, and which approaches the user rejected.
---

# Covering brand logos on photo-real guitar images

The 31 guitars in AGS Fretboard use photo-real AI studio images
(`artifacts/ags-fretboard/src/assets/guitars/<id>.png`). The AI renders real-brand
headstock logos. The user's FINAL chosen solution is to cover each logo with a
realistic strip of **black artist/electrical tape** (like players do to hide
endorsements), composited onto the headstock.

**Why:** Earlier attempts were explicitly rejected by the user as "ugly":
- Overlaying an AGS-branded graphic headstock on top of the photo.
- Cropping the headstock off / generating headless guitars.

**How to apply:**
- Tape is composited per-guitar at known headstock coordinates; a guitar with no
  visible logo (e.g. `polka-v`) gets NO tape and keeps its clean original.
- Headstocks shown straight-on take a horizontal tape strip; angled 3/4 views where
  the script runs diagonally/vertically need the tape rotated to lie along the logo
  (e.g. Fender-style script down the headstock).
- Source clean originals live in `attached_assets/generated_images/guitar_<id>.png`
  so the tape pass can always be re-run idempotently from a clean base.
- ImageMagick (`magick`) is available for compositing; there is NO inpainting tool,
  so covering (not erasing) is the only option.
