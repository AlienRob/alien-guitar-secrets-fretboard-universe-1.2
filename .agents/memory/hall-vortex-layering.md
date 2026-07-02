---
name: Hall of Legends vortex layering
description: How the spinning vortex is masked by the archway in the /hall showcase
---

To make a spinning element (vortex) read as a portal set INTO a wall — with its
circular edges permanently hidden — layer it behind hall art that has a
transparent arch opening:

- Hall PNG has only the **arch opening** transparent; everything else opaque.
- Stack: vortex `z-index: 0` (behind) → hall img `z-index: 1` (on top) →
  guitar/logo/particles above. The opaque pillars/stone mask the vortex's round
  edges; only the arch reveals it.
- The vortex element can be **larger** than the arch slot (e.g. width ~28%);
  the overflow is masked, so the bright swirling centre fills the opening richly.

**Why:** A standalone circular vortex with any visible edge (hard ring OR soft
feathered circle) always looks like a medallion/disc pasted on the wall. The
user rejected three such versions. Masking the edges behind opaque architecture
is the only thing that read as a real portal.

**Checkerboard gotcha:** AI-generated "transparent arch" hall art usually has a
PAINTED grey/white checkerboard in the opening, NOT real alpha (PIL reports the
image fully opaque). Cut real transparency by detecting bright, near-grey pixels
(`min(r,g,b)>165` AND `max-min<32`) **inside a central arch box only** (the gold
frame is saturated, so it survives the filter; spotlights/crystals are coloured
too). Scan the FULL opening down to the floor — if the box stops short, a
checkerboard band remains at the base and (being opaque, on top) occludes the
vortex. A ~1px GaussianBlur on the alpha mask removes jaggies.

**How to apply:**
- Stage `aspect-ratio` must match the hall art (current art is 1536×1024 = 3/2,
  `width: min(100%, 150vh)`). If the art changes aspect, retune this AND the
  percent overlay coords (vortex/guitar/logo positions).
- Any NON-arch transparency in supplied hall art (e.g. ceiling-corner gaps) must
  be **black-filled** so it doesn't reveal the vortex or page background. Do it
  in PIL: composite the art over solid black everywhere, then `Image.composite`
  the original back only inside an arch rectangle mask. User explicitly wants
  empty stage/ceiling space black.
