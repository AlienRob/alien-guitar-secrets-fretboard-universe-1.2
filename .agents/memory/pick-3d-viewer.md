---
name: 3D pick viewer
description: How the spinning branded 3D guitar pick renders (colours, decals, disposal) and the two synced copies.
---

# Spinning branded 3D pick

## Two synced copies — change both
- real app: `artifacts/ags-fretboard/src/components/pick-3d-viewer.tsx`
- canvas mockup: `artifacts/mockup-sandbox/src/components/mockups/picks-3d/Picks3D.tsx`

The mockup sandbox cannot import app code, so the material/colour/decal logic is
duplicated by hand. Any change (finishes, colour map, back label) must land in both.

## Geometry = the user's uploaded .glb — do NOT replace it with a procedural extrude
The real app's 3D pick LOADS the user-uploaded model `@assets/ags-pick.glb`
(`useGLTF`), clones the first mesh's geometry, bakes the node transform
(`scene.updateMatrixWorld(true)` + `geometry.applyMatrix4(mesh.matrixWorld)`),
recentres + normalises it, infers the thin/face/long axes from the bbox, and
finds "up" from the vertex centroid sign. It then OVERWRITES the geometry's `uv`
with a planar projection of the wide face (u across width, v point→0/wide-top→1
via upSign) so the cover-painted `CanvasTexture` still lies upright on the pick.
Thin axis drives camera-facing rotation + decal direction; `logoSize=faceMin*0.78`,
`upOffset=maxDim*0.13`. Renders only for UNLOCKED picks in the detail modal;
locked items and WebGL-unavailable fall back to the flat SVG `GearThumb`. Grid
thumbnails stay SVG (one Canvas per modal is fine; 30+ canvases in a grid is not).
**Why:** this flip-flopped. An earlier pass swapped the .glb for a procedural
`ExtrudeGeometry` of the 2D cover path to make 3D match the thumbnail; the user
pushed back hard — they want THEIR uploaded pick shape, not a cover-matched
extrude. The shape is the user's call: keep loading `ags-pick.glb`. The colour
map + back label below are liked and were kept across the revert.
**Mockup divergence:** `Picks3D.tsx` in the mockup sandbox still uses the
procedural `buildPickGeometry()` extrude. The mockup is internal-only, so this
divergence is tolerated; if you re-sync it, port the .glb-loading approach.

## Colour map is painted for ALL finishes, mirroring the cover
`buildPickColorMap` returns a `CanvasTexture` for EVERY pick (not just two-tone),
repainting each finish exactly like `gear-thumb.tsx`: holographic/foil/pearl/
neon/galaxy/marble gradients, carbon 45° weave, prism bands, marble veins,
glitter/galaxy sparkle dots, and a sheen highlight near art `(40,30)`. Cover
gradients use SVG objectBoundingBox %, so convert via the bbox helpers (bbox
x12..88 w76, y6..96 h90). `buildPickMaterial` always sets `m.map` and
`m.color = white` so the painted map shows true colours.
**Why:** users explicitly prefer the cover colour schemes; flat solids and the
old two-tone-only gradient did NOT match.
**How to apply:** `gear-thumb.tsx` is the single reference for each finish's
gradient/overlay; keep this map in lockstep with it (and across both copies).

## 2D cover silhouette is traced from the SAME .glb
The flat vault cover (`gear-thumb.tsx` `PickArt` `path`) is NOT a hand-drawn
teardrop any more — it's the `ags-pick.glb` outline: project the model's wide
face to 2D, convex-hull it (a pick is convex), simplify, and fit aspect-correct
into the old ~13..87 x / 6..96 y box so the logo mask + sheen + finish overlays
still align. **Why:** the user had the 3D pick (.glb) and the 2D thumbnail side
by side and they were "completely different"; both must share ONE silhouette.
If the .glb shape ever changes, re-trace this path from it (don't redraw by hand).

## Logo print size is matched across 2D and 3D
The stamped AGS logo size is tuned to be the same visual fraction on both: the
flat cover's mask `<image>` w/h and the 3D `logoSize` (`faceMin * k`). The user
calibrates this by eye ("print slightly too big") — change BOTH together or the
thumbnail and the spinning pick drift apart.

## Front = logo, back = label
Front decal keeps the AGS alien logo; the back decal shows a generated label
texture (name wrapped, rarity uppercase, edition number, alien-green). No mirror
correction — the back decal is the front rigidly rotated 180°, same handedness.

## Decal depth pitfall
`<Decal>` projects a box along its local Z by `scale.z`. The pick is thin, so an
oversized depth projects through to the OPPOSITE face/edges, bleeding the stamp.
Keep `decalScale.z` near the pick's own thickness (`halfThickness * 2.2`).

## Texture & geometry disposal
`material.dispose()` does NOT dispose its textures. Any runtime `CanvasTexture`
(the painted `material.map`, the `backLabel` decal) must be disposed explicitly
on unmount or it leaks as items change. The extruded geometry is also runtime:
the app viewer disposes its geometry on unmount; in the mockup the geometry is
SHARED across every pick instance, so dispose it once in the scene (not per
instance) when the scene unmounts.
