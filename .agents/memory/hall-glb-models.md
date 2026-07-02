---
name: Live .glb guitar models in the Hall
description: How real uploaded 3D guitar models are rendered in the Hall of Legends, and why only the centrepiece loads them.
---

Real uploaded 3D guitar models (.glb) are shown in the Hall of Legends via an
optional `model3d` key on a `Guitar` catalog entry (`data/guitars.ts`). When set,
both Hall centrepieces — the free `cabinet-browser` and the premium
`hall-of-legends-live` dais — render `guitar-model-3d.tsx` (R3F `useGLTF`) instead
of the usual `GuitarThumb`.

**Why this is still cheap:** the models are large (the mythic one is ~10MB) and
many WebGL canvases blow the browser context limit. It stays safe because only
ONE guitar (the masterpiece) has a `model3d`, and the Hall never shows it twice
at once — the featured guitar's wall niche is filtered out, so the masterpiece is
either on the dais OR in its wall niche, never both. Wall niches for guitars
WITHOUT a `model3d` stay on the cheap static `GuitarThumb`. So at most ~1 model
canvas renders at a time (plus the close-up, which pages one guitar at a time).
Don't give many catalog guitars a `model3d` without rethinking this.

**Interaction (per user request):** "static + ±25° drag" applies ONLY to the
hanger (cabinet + close-up). The DAIS model turntable-spins via OrbitControls
`autoRotate` (NOT the CSS `ags-lateral` spin, which is killed for `--3d` so the
flat canvas doesn't spin in-plane). The `GuitarModel3D` `autoRotate` prop: when
on, drop the azimuth clamp (need full 360) and keep enableRotate=false; the
±25° clamp is set only in `interactive && !autoRotate` (hanger). autoRotate spins
even with enableRotate=false (three gates it on master `enabled`, not enableRotate).

**Wall niche for the apex:** the masterpiece is the LAST catalog guitar (#31) but
there are only 20 niches (`wall = unlocked.slice(0,20)`), so it had no niche →
`featuredSlot` null → put-away vanished instantly instead of flying. The `wall`
useMemo now force-guarantees the apex (the `model3d` guitar) a niche (final slot
when full). Without a niche the dais guitar can't fly to/from the wall.

**How to apply / gotchas:**
- The `model3d` value is a KEY, not a URL. The asset `import "@assets/...glb?url"`
  lives in `guitar-model-3d.tsx` (a `MODEL_URLS` map), keeping `guitars.ts` a pure
  data module with no binary imports (which would bloat the test import graph).
- Sizing: the component root no longer forces an aspect-ratio; the CALL SITE'S CSS
  box defines the size, and the camera auto-frames the bbox to fit it. Cabinet/
  close-up use `.cab-guitar--3d` (a definite top/height box matching the purple
  niche); the dais uses `.ags-floating-guitar--3d` (height-driven via
  `aspect-ratio`). A canvas can't size itself from its contents like the flat
  `<img>` thumbnail can, so it MUST get an explicit box or it collapses.
- The dais flat thumbnail gets a CSS turntable spin (`ags-lateral`) via
  `.ags-stage.is-equipped .ags-floating-guitar`. The 3D element carries that same
  class, so cancel the spin with a MORE-SPECIFIC selector (double class:
  `.ags-floating-guitar.ags-floating-guitar--3d { animation: none }`) — an
  equal-specificity rule placed earlier loses to the later general rule.
- Don't eagerly `useGLTF.preload` at module scope — the cabinet imports this
  component on every Hall open, so a module-scope preload would fetch ~10MB even for
  users who never page to the mythic guitar. Let Suspense load it on demand.
- Loading placeholder must NOT be the flat `GuitarThumb` — flashing the 2D art for
  a beat before the 3D model pops in reads as a glitch (user complained). Show a
  neutral spinner (`Loader2`) while streaming; `GuitarThumb` is still the FALLBACK
  for no-model / no-WebGL, just not the loading state.
- The Vault grid ("AGS Hall of Masters" wing, `vault.tsx` HangingGuitar) also
  renders `GuitarModel3D` for the masterpiece, but ONLY when unlocked — a locked
  guitar shows the ghosted flat thumb so a greyed-out item never pulls the ~10MB glb.
- Uploaded Meshy guitars come upright (Y-up, base at y=0, thin in Z) and
  uncompressed (no draco), so no axis fix-up is needed — just recenter on origin.
- WebGL can't be screenshot-verified in the headless env; rely on typecheck/tests
  + reading the console for "Context Lost"/load errors instead.
