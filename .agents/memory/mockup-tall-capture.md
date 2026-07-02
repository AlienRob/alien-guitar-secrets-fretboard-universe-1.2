---
name: Capturing tall mockup-sandbox previews
description: How to screenshot full-height mockup components and why big images fail to render
---

# Capturing tall mockup-sandbox previews

`external_url` screenshots of a `/__mockup/preview/...` component only capture
roughly a 1080px-tall viewport, so a tall card's footer is cropped off. To see
the whole thing, use the `app_preview` screenshot with `artifact_dir_name:
"mockup-sandbox"`, `path: "/preview/<group>/<Component>"`, and a tall
`viewport_size` (e.g. `[720, 1620]`).

**Why:** the preview page wrapper is a flex container; the card stretches to the
viewport height (align-items stretch), so a taller viewport reveals the rest.

**Large images may render blank** in the first screenshot — multi-MB PNGs in
`public/images` aren't decoded by the time the SPA paints. Resize hero/gallery
art down (e.g. `magick in.png -resize 680x out.png`) before wiring it in; it
loads reliably and the slots are small anyway.
