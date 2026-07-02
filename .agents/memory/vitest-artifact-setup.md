---
name: Vitest setup in Vite artifacts
description: Why Vite-app artifacts need a standalone vitest.config.ts and jsdom polyfills to run component/page tests.
---

# Running vitest in a Vite web artifact (e.g. ags-fretboard)

**Rule:** Do NOT let vitest reuse the app's `vite.config.ts`. Create a separate
`vitest.config.ts` (use `vitest/config`, the React plugin, the `@` alias, and
`environment: "jsdom"`).

**Why:** The artifact `vite.config.ts` throws at module load unless `PORT` and
`BASE_PATH` env vars are set (it is the dev/build server config). Vitest loads
the nearest vite config by default, so without a standalone config every test
run crashes before a single test executes.

**jsdom polyfills these galaxy components need** (put in a setup file referenced
by `test.setupFiles`):
- `ResizeObserver` stub — SolarSystem measures its stage.
- `window.matchMedia` — `prefersReducedMotion()` reads it; default `matches:false`
  and let individual tests override to flip reduced-motion on.
- `Element.prototype.setPointerCapture` / `releasePointerCapture` — drag handlers.

**How to apply:** When adding tests to any Vite-based artifact here, copy this
pattern. Test deps go in `devDependencies` (static/client artifacts put all deps
there). `.test.tsx` files are still typechecked by `tsc` (tsconfig only excludes
`**/*.test.ts`), so keep mock objects fully typed against the generated API
schemas (e.g. `DashboardSummary` requires every field incl. `questsTotal`).
