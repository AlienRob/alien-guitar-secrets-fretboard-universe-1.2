---
name: Gear catalog / thumbnail render sync
description: Adding a gear finish/pattern value requires a matching render branch, or it silently falls back.
---

The vault "gear locker" collectibles are split across two files that must stay in sync:

- `artifacts/ags-fretboard/src/data/gear.ts` — data catalog + the `PickFinish`
  and `StrapPattern` union types + the `GEAR` array.
- `artifacts/ags-fretboard/src/components/gear-thumb.tsx` — procedural SVG art for
  picks/straps/cables, drawn from each item's colours/finish/pattern.

**Pedals AND amps are the exception:** they are NOT procedural any more. Both variants are
`{ category:...; image:string }` (no finish/style/colour/grille/brand), and `PedalArt`/`AmpArt`
just render the background-removed PNG via `<img object-contain>`. Adding one = drop a
transparent PNG in `attached_assets/pedals/` or `attached_assets/amps/`, import it in
`gear.ts`, add a catalog item with `image`. No render branch needed. (Old SVG
`PedalFinish`/`PedalStyle`/`Knob` and the amp `AmpStyle`/`BrandPlate` were deleted in the
photo migrations.)

**Rule (picks/straps only):** any new `PickFinish` / `StrapPattern` value you add to the
data types MUST get a matching render branch in `gear-thumb.tsx`. TypeScript will
NOT catch a missing one — the renderers use `if/else` chains and a default fill, so
an unhandled finish silently renders as a plain solid colour (looks broken, not a
compile error).

**Why:** the union widening and the SVG drawing live in different files with no
exhaustiveness check between them; the only signal of a miss is a dull-looking thumb.

**How to apply:** when expanding gear, edit both files together. Keep SVG gradient/
pattern/clip ids namespaced by `item.id` (e.g. `holo-${uid}`) to avoid collisions
when many thumbs render in one grid. Keep new geometry inside the `0 0 100 102`
viewBox. Unlock convention: picks/straps/pedals use `sessions`/`streak` requirements
(daily practice); amps and guitars are level-gated (leveling / boss levels).
