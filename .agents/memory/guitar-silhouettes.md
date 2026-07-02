---
name: Guitar silhouette paths (2D + 3D)
description: BODY_PATHS is duplicated across two files and hardware must stay within the silhouette
---

The guitar body silhouette `BODY_PATHS` map exists in TWO files and must be kept byte-identical:
`guitar-art.tsx` (2D SVG) and `guitar3d.ts` (3D ExtrudeGeometry). Editing one without the
other desyncs the 2D preview from the 3D viewer.

**Why:** there is no shared source; each file parses its own copy. The 3D extrude parses the
same `d` strings via `shapeFromPath`, so decimal coords are fine in both.

**How to apply:**
- When changing a shape, apply the exact same path string to both files.
- Hardware in `guitar-art.tsx` (pickups, bridge, control knobs in `knobPositions`) is positioned
  with absolute coords in the 120x380 viewBox and is NOT clipped to the body — so any silhouette
  change can push knobs/bridge outside the body. The lower-bout/treble region around y300–320 is
  the safe zone for the knob cluster; verify knobs stay inside after editing a body path.
- For sharper 3D edges, reduce ExtrudeGeometry `bevelThickness`/`bevelSize` in `guitar3d.ts`.
- Validate silhouettes offline with a throwaway @resvg/resvg-js rasterizer + a Catmull-Rom
  spline-from-points helper (far easier than hand-authoring béziers). /avatar and /vault are
  premium+Clerk-gated and cannot be screenshotted, so rasterize raw SVG to check visuals.
