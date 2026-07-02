---
name: Rig share image capture
description: Exporting a DOM scene to PNG (html-to-image toPng) must wait for descendant images to decode first.
---

When capturing a DOM region to a PNG (e.g. the avatar "Share Rig" button using
`html-to-image`'s `toPng`), await every descendant `<img>` decode/load BEFORE
calling `toPng`. The rig scene embeds photo assets (avatar portrait, guitar art,
pick logo stamps); clicking Share right after the page loads otherwise produces a
PNG with half-loaded/missing assets.

**Why:** `toPng` snapshots whatever is painted at call time; lazily-decoded
images aren't ready yet on a fresh page.

**How to apply:** before `toPng`, collect `ref.querySelectorAll("img")` and
`Promise.all` over each — `img.decode()` if already `complete && naturalWidth>0`,
otherwise resolve on its `load`/`error`. Then capture.
