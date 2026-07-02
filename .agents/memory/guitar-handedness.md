---
name: Guitar handedness rendering
description: How GuitarArt renders right/left-handed and how callers pass the handed flag
---

GuitarArt renders right-handed by default. Left-handed is a pure SVG mirror: the
geometry group gets `transform="translate(120,0) scale(-1,1)"` only when
`handed === "left"` (viewBox is 120 wide, mirrored around x=60).

**Why:** Mirroring at the SVG group level avoids redrawing every shape for the
left-handed case and keeps a single source of geometry.

**How to apply:**
- Keep only geometry inside the mirrored group — never text/labels, or they flip.
- Persistence lives in `playerCustomization.ts` (`loadHandedness`/`saveHandedness`,
  localStorage key `ags.handed.v1`, default `'right'`).
- The vault page owns the toggle and is the source of truth in-session. Modal /
  unlock-animation / avatar read `loadHandedness()` on render; if immediate
  in-session sync matters there, pass `handed` down as a prop from vault state
  instead of re-reading localStorage.

Guitar hardware accuracy is data-driven: `guitars.ts` has optional
`pickups` ('sss'|'hsh'|'hh'|'h'|'sh'), `pickguard`, `controls`, `maple`.
GuitarArt renders different pickup/hardware/fretboard configs from these.

## 3D guitar models (current approach)

Guitars now render as real orbitable 3D models, not the flat SVG `GuitarArt`.
`guitar3d.ts` `buildGuitarGroup(guitar, handed)` reuses the SAME SVG body path data
(parsed M/C/L/Z into THREE.Shape, extruded) so silhouettes match the old art, then
adds neck/frets/inlays/headstock/hardware. Finishes (stripes/bullseye/polkadot/
floral/sunburst/alien) are painted via CanvasTexture; chrome = metallic material.
Left-handed = `group.scale.x = -1`.

**Two render paths (do not merge them):**
- Detail view only: `Guitar3DViewer` (r3f Canvas + OrbitControls, autorotate until
  pointer-down). Uses a local RoomEnvironment/PMREM (NO drei `Environment` preset —
  that fetches an HDR over the network).
- Everywhere else (vault grid, unlock card, avatar picker): `GuitarThumb` shows a
  STILL PNG from `guitarThumbnail.ts`, which uses ONE shared offscreen
  WebGLRenderer (preserveDrawingBuffer) and caches dataURLs in-memory by
  `id|handed`. Never spawn 25 live canvases in the grid.

**Resource rules (caused medium-severity review findings):**
- In `guitarThumbnail.ensure()`, dispose the PMREMGenerator and RoomEnvironment
  right after building the env texture.
- `isWebGLAvailable()` (`lib/webgl.ts`) must release its probe context via
  `WEBGL_lose_context` so it doesn't eat a context slot.
- Both `GuitarThumb` and `Guitar3DViewer` fall back to the old SVG `GuitarArt`
  when `isWebGLAvailable()` is false (headless screenshot env has no WebGL, so
  app_preview screenshots show the SVG fallback — real browsers get 3D).
