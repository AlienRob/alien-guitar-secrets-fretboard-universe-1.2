---
name: Avatar species & portraits
description: How the player avatar resolves to a photo-real portrait by species + gender + hair colour.
---

# Avatar portrait model

**Primary renderer is now 3D.** The avatar shows a live `.glb` character per
species × gender (the user's uploaded models) via `Avatar3D` (`components/avatar-3d.tsx`,
one `<Canvas>`, drei `useGLTF`). `AvatarArt` picks 3D when
`getAvatarModel(species, gender)` (`lib/avatarModel.ts`) returns a url AND
`isWebGLAvailable()`; otherwise it falls back to the 2D photo path below. Models
live in `src/assets/avatars3d/avatar_<species>_<gender>.glb` (all 6 species ×
2 genders). **Hair colour does NOT change the 3D model** (one model per
species+gender) — it only affects the 2D fallback; the customiser shows a note
saying so. See `glb-avatar-compression.md` for how the raw uploads were shrunk.

The 2D photo path (below) is the fallback (no WebGL, e.g. headless screenshots,
AND runtime GLB load failure — `Avatar3D` wraps its `useGLTF` model in an error
boundary whose `onError` flips `AvatarArt` to the photo for that model).

**Do NOT dispose the cloned model's geometries/materials/textures on unmount.**
`scene.clone(true)` shares those GPU resources *by reference* with drei's
`useGLTF` cache, so disposing them corrupts every other live mount of the same
model. Let the bounded useGLTF cache own them (only 12 models exist).

The player avatar's fallback is a **photo-real portrait image**, not procedural SVG. Images
live in `artifacts/ags-fretboard/src/assets/avatars/` and are matched by
`getAvatarPortrait(species, gender, hairColour)` in `lib/avatarPhoto.ts` (eager
`import.meta.glob`, mirrors `guitarPhoto.ts`).

Naming convention (the resolver depends on it exactly):
- human-like species (`human`, `nordic`, `pleiadian`, `hybrid`): `avatar_<species>_<gender>_<hairColour>.png`
- hairless species (`alien`/Grey, `reptilian`, listed in `HAIRLESS_SPECIES`): `avatar_<species>_<gender>.png`

Matrix = 4 human-like × 2 genders × 7 hair colours (56) + 2 hairless × 2 (4) = **60 images**.

**Why:** the avatar stands ALONGSIDE its equipped guitar (separate photo), never
holding it — baking each being×guitar combo would be 60×31 images. Keep them
independent.

**How to apply:**
- Adding a species/gender/hair-colour means generating the matching image(s) with
  the exact filename, or `getAvatarPortrait` returns undefined → "portrait coming
  soon" placeholder.
- The avatar *picture* varies ONLY by `species` + `gender` (+ `hairColour` for
  the 2D fallback). `AvatarConfig` also carries equipped-gear/stage ids
  (`guitarId`, `strapId`, `ampId`, `cableId`, `sceneId`) and `skin` (unlock aura),
  but those do NOT change the figure itself — they render separately. The old
  appearance fields (bodyType, skinTone, hair, outfit, pose, theme) and
  `SKIN_TONES`/`COLOR_THEMES`/etc. were removed (user-accepted tradeoff).
- Avatar PNGs are **background-removed (transparent cutouts)** — the AI source art
  had baked starfield backgrounds that made the figure look like a photo card pasted
  on the rig stage. Keep any NEW avatar art transparent (mirrors guitar photos).
  `AvatarArt` renders with `object-contain object-bottom` (not cover/top) so the full
  figure shows and stands grounded in its slot; don't revert to object-cover.
- Unlock auras (`SKINS`) still apply: rendered as a CSS glow behind the portrait.
- `loadAvatar()` spreads `DEFAULT_AVATAR` over parsed localStorage, so old saved
  configs with stale keys are harmless.
