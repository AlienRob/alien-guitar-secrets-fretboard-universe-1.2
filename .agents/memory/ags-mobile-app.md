---
name: AGS mobile app (ags-mobile)
description: Phase plan, sync rule, and theme quirk for the Expo phone app
---

# Alien Guitar Secrets — mobile (Expo) app

Slug `ags-mobile`, preview `/mobile/`. A native phone companion to the
`ags-fretboard` web app, sharing its cosmic dark look.

## Duplicated logic — keep in sync by hand
- **Rule:** `ags-mobile/lib/musicTheory.ts` and `ags-mobile/lib/drills.ts` are
  an independent COPY of the web app's theory/drill logic, not a shared lib.
- **Why:** Expo/Metro resolution + the web app's browser-only deps made a shared
  workspace lib more friction than value for Phase 1.
- **How to apply:** when changing scale/chord pools, note spelling, or degree
  logic, update BOTH the web and mobile copies, or they drift.

## Phased scope
- **Phase 1 (done):** frontend-only. Drills (intervals, fretboard notes, scale &
  chord spelling), XP/levels/belts, degree reference card + post-drill recap.
  All state on-device via AsyncStorage (`ags-progress-v1`). No backend, no auth.
- **Later phases:** accounts (Clerk), cloud sync, premium (RevenueCat). Don't
  assume any server/auth exists in the mobile app yet.

## Expo Go vs native modules (crash on launch)
- **Rule:** the scaffold ships with `react-native-keyboard-controller`
  (`KeyboardProvider` in `app/_layout.tsx`). That native module is NOT bundled in
  Expo Go, so it crashes the app at launch ("Expo Go closed because the app has a
  bug") even though the web preview works fine.
- **Why:** Expo Go only contains expo-* and a curated native module set; arbitrary
  third-party native libs need a dev/EAS build. The crash is native-only, so the
  web preview and `typecheck` both pass and hide it.
- **How to apply:** if testing in Expo Go, only use native modules Expo Go
  includes. This app has no text inputs, so KeyboardProvider was removed entirely.
  When debugging an Expo Go launch crash, suspect non-Expo native deps first — the
  Metro/server logs won't show the device red-box error.

## Theme quirk
- `constants/colors.ts` exposes the palette under a single `light` key (always
  dark). `useColors` reads it directly. Adding a `dark` key or expecting scheme
  switching breaks the scaffold's cast — there is intentionally one theme.

## Avatar tab vs Hall of Legends (split)
- **Avatar** and **Hall of Legends** are separate concerns. Avatar = the player's
  chosen being (species + gender), persisted via `useAvatar().update(...)` →
  AsyncStorage `ags-avatar-v1`. The Hall shows GUITARS only — and only the ones
  with a real `.glb` model in the web vault (today just the single mythic
  centrepiece). The everyday Hall view is the guitar PHOTO; a "View in 3D" button
  opens an on-demand interactive 3D viewer (the "premium app" pattern: cheap image
  by default, heavy engine loaded only when asked). Don't put characters back in
  the Hall.

## On-demand 3D guitar viewer (lazy three/R3F)
- The 3D viewer (`components/guitar-model-3d.tsx`, route `app/guitar-3d.tsx`) uses
  three / @react-three/fiber / drei + expo-gl + expo-asset + expo-file-system,
  matching the web versions. The `.glb` is bundled (metro `assetExts` includes
  glb/gltf/bin).
- **Gotcha — do NOT hand a URL to three's GLTF loader on native.** `useGLTF(uri)` /
  `GLTFLoader.load(uri)` fail in Expo Go with "Could not load file:///data/user/…"
  because three's XHR-based fetch can't read the `file://` path expo-asset produces.
  Fix: load the BYTES yourself and `GLTFLoader.parse(buffer, "", …)` (no network):
  `fetch(uri).arrayBuffer()` on web, `new File(uri).arrayBuffer()`
  (expo-file-system v19 File API) on native. Since we now own the parsed scene
  (no useGLTF cache), dispose its geometry/materials/textures on unmount.
- **Gotcha — in Expo Go dev the asset URL is plain `http://` and the Replit proxy
  301-redirects it to https; expo-asset's `downloadAsync` saves the ~245B redirect
  HTML body (`<a href="https://…">`) verbatim instead of following it.** Reading
  that "file" gives HTML, so `GLTFLoader.parse` dies with "JSON Parse error:
  Unexpected character: <" and you silently fall to the photo. Fix: don't trust
  `downloadAsync`/`localUri` for an http asset.uri — force https
  (`asset.uri.replace(/^http:\/\//,"https://")`) and download the bytes yourself
  via `File.downloadFileAsync(httpsUri, dest)` into `Paths.cache`, then
  `dest.arrayBuffer()`. Keep a branch for `file://` (production bundle) that still
  uses downloadAsync. A magic-bytes guard (`buffer` must start with "glTF") makes
  the failure loud on-screen instead of a mystery photo-fallback.
- **Gotcha — Hermes has no global `TextDecoder`; `GLTFLoader.parse` throws on the
  phone and the viewer silently drops to the photo.** `parse` calls
  `new TextDecoder()` to read the .glb's JSON chunk. Web has it; Hermes doesn't.
  Fix: `text-encoding-polyfill` (pure JS, works in Expo Go, no rebuild). Do NOT
  rely on its side-effect import — it binds to `this`, which under Metro is not
  the real global; instead import its `TextDecoder`/`TextEncoder` and assign them
  onto `globalThis` yourself (guarded by `typeof … === "undefined"`). The package
  is untyped, so it needs a local `types/text-encoding-polyfill.d.ts` shim.
- **Gotcha — PBR model needs an environment map or it renders near-black.** The
  model is `base_basic_pbr`; with only ambient+directional lights it looks like it
  "didn't load". Add a `RoomEnvironment` via `PMREMGenerator` → `scene.environment`
  (procedural, no network), exactly like the web renderer.
- **Gotcha — lazy-load the engine or the WHOLE web app white-screens.** expo-router
  EAGERLY evaluates every route module at startup to build the navigator, so a
  static `import GuitarModel3D` in the route pulls three/R3F/expo-gl into boot eval;
  something there throws on web and blanks every screen. Fix: `React.lazy(() =>
  import("@/components/guitar-model-3d"))` + `<Suspense>` in the route so the engine
  only evaluates when the viewer is opened.
- WebGL is feature-detected on web (`isWebGLAvailable`); no WebGL ⇒ centered photo
  fallback. The **screenshot tool's headless browser has no WebGL**, so it always
  shows the photo — you cannot visually verify the actual 3D from a screenshot; it
  only proves the route renders + fallback works. Real browser preview + device do
  have WebGL.
- Resilience: reset uri/ready/failed when `model` changes; download errors and a
  `ModelErrorBoundary` around `<Model>` both flip to the photo fallback (no spinner
  hang). Cloned GLTF scene is NOT disposed (the useGLTF cache owns geometry/mats).
- **R3F JSX type gotcha (Expo / @types/react 19.2):** R3F's own `declare module
  'react'` JSX augmentation does NOT merge into `React.JSX` here, so `<ambientLight>`
  / `<primitive>` etc. error as unknown intrinsics. Fix in `types/three-elements.d.ts`:
  `declare global { namespace React { namespace JSX { interface IntrinsicElements
  extends ThreeElements {} }}}` (augment the GLOBAL React namespace, not module 'react').
- The avatar **bust** crop reuses the full-body legend renders
  (`getLegendPortrait`, 769x1024) by scaling the figure well past the frame and
  top-anchoring inside an overflow-hidden box — there are no separate bust assets.
- `AvatarProvider` must stay mounted in `app/_layout.tsx` (inside ProgressProvider)
  or `useAvatar()` throws. It was missing originally.

## Degree labels
- Degrees (1, b3, 5, b7…) come from `degreeLabel` comparing each note's diatonic
  letter step to the major-scale reference, so accidentals stay correct per key.
- `DegreeStrip` (components/degree-strip.tsx) uses `flex:1` cells (no wrap) so a
  7-note scale always fits on one line; chords spread across the full width.
