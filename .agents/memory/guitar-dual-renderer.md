---
name: Guitar dual renderer parity
description: AGS guitars render via two independent renderers that must be kept in sync when adding shapes/finishes/hardware.
---

# Guitar dual renderer parity

AGS guitars have TWO independent renderers that duplicate body geometry and
hardware logic:

- `guitar-art.tsx` — SVG (used as fallback when WebGL is unavailable, and for some thumbnails)
- `guitar3d.ts` — Three.js (primary 3D viewer + thumbnail capture)

**Rule:** any new `GuitarShape`, `GuitarFinish`, `PickupConfig`, or hardware field
(e.g. `strings`) must be implemented in BOTH files (each has its own `BODY_PATHS`,
`HEADSTOCK`, `DEFAULT_PICKUPS`). Implementing in only one renders fine in 3D but
breaks the SVG fallback (or vice versa).

**Why:** the fallback path is real (non-WebGL devices), so a 4-string bass with
`strings` only wired into the 3D path silently renders as 6 strings in fallback.

**How to apply:**
- New props on `GuitarArt` must also be threaded through every call site:
  `guitar-thumb.tsx` and `guitar-3d-viewer.tsx` both render `<GuitarArt>` and each
  prop must be passed explicitly (they do NOT spread the guitar object).
- Inline tuner / string spacing uses `(stringCount - 1)` as a divisor — guard with
  `Math.max(1, stringCount - 1)` to avoid divide-by-zero / NaN coordinates.
- New shapes that need inline (single-side) tuners must be added to the `inline`
  shape set in both renderers (e.g. axebass).
