---
name: WebGL grid = one shared canvas
description: Rendering many 3D items at once must use a single Canvas/WebGL context, not one per item; headless screenshot browsers have no WebGL.
---

When showing many 3D objects at once (e.g. a grid of spinning picks/guitars), use
ONE `<Canvas>` (one WebGL context) and lay the objects out as meshes inside it,
spinning each via `useFrame` on a per-item group ref. Do NOT render one
`<Canvas>` per item.

**Why:** Browsers cap simultaneous live WebGL contexts (~8–16). A grid of 12
per-item canvases overflows the limit and the renderer throws
"Error creating WebGL context", blanking the whole page (and tripping the Vite
runtime-error overlay). The real app's pick-3d-viewer renders ONE pick in a
modal, so it never hit this — the multi-item preview did.

**How to apply:** For multi-item 3D galleries, share the loaded geometry +
textures, render N meshes positioned in a grid inside a single Canvas, and label
each with drei `<Html>`. Use `OrbitControls` for the whole tray; per-item
turntable spin via `useFrame`.

**Screenshot caveat:** the `screenshot` tool's headless browser has NO WebGL —
it always shows "Error creating WebGL context" for any react-three-fiber page,
even correct single-context code. Do not treat that screenshot error as a real
bug. Verify instead via: clean dev-server logs (no import errors), preview route
+ asset 200s, and a passing typecheck; trust the user's real browser (canvas
iframe) to render it.

**Mockup-sandbox 3D deps:** the sandbox ships no three stack. To preview r3f
there you must add `three`, `@react-three/fiber`, `@react-three/drei` AND
`@types/three` to `artifacts/mockup-sandbox/package.json`, `pnpm install`, then
restart the sandbox workflow. Assets go in `public/` and load by URL
(`/__mockup/models/...`, `/__mockup/images/...`), not `@/assets` imports.
