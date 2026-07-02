---
name: Hall of Legends / cabinet browser
description: How /hall is gated (premium vs free cabinet) and the cabinet plate/guitar geometry quirks.
---

# /hall gating

`/hall` is a public route. Premium = the cosmic vortex room (`HallOfLegendsLive`);
free / anonymous = `CabinetBrowser` (walk every guitar in close-up) as an upgrade
teaser. The premium hall also opens `CabinetBrowser` as a fixed overlay via a
"Closer look" button.

**Why the gating branches on Clerk's `<Show>` first, not `usePremium`:**
`usePremium` reads the auth-only profile-summary query. For signed-out users that
query 401s and react-query retries, so a naive `if (isLoading) spinner` hangs the
page on a spinner for several seconds. Fix: branch `<Show when="signed-out">` →
cabinet immediately; `<Show when="signed-in">` → a child that calls `usePremium`.
That way the profile query never fires (and never blocks) for anon visitors.

# Premium vortex hall (HallOfLegendsLive)

- "Put away" sends the guitar to its OWN numbered hanger on the wall. Each guitar
  owns a permanent number = its 1-based index in `GUITARS` (31 total; Franknbolt /
  `frankenstrat` = 18). On put-away the centre guitar flies up + shrinks to
  `WALL_SLOTS[index]` (a tunable {x,y,h} % grid laid across the left/right walls,
  centre kept clear for the arch) and a small gold "No." hanger tag fades in; the
  big centre plaque hides. On "Use" it flies back to centre, powered effects on.
- Animation = transitioning the guitar-stage's `left/top/height` (NOT transform),
  so it travels and scales toward the slot; reduced-motion drops that transition.
  The flight is BIDIRECTIONAL (niche->dais on feature, dais->niche on put-away).
  **To make the inbound (niche->dais) trip visible you must render the guitar AT
  the niche first, then flip to dais coords on the NEXT frame (double-rAF).** If
  you set dais coords in the same render the guitar just appears on the dais with
  no flight. The `is-flying` class must also kill the portal `ags-arrive` keyframe
  or it scales-from-nothing on top of the flight. Put-away clears the dais on the
  stage's `transitionend` (gated to propertyName top/left + `returning`) with a
  ~1100ms timeout fallback; cancel that timer on re-feature and unmount.
- The centre nameplate is `.ags-plaque` — a brass museum plaque (name + rarity +
  "No. X of TOTAL") that stands on the dais under the guitar, shown only while
  in use (`featured && !returning`). It REPLACED an older corner chip
  (`.ags-ui-panel`); don't reintroduce the corner chip.
- "Put away" must NOT hide the guitar — it stays visible (now hung small on its
  wall hanger; still reachable via "Closer look"). The "powered" effects run only
  while in use (glow halo, rising particles, the guitar's turntable spin) — gate
  each on `.ags-stage.is-equipped`. EXCEPTION: the vortex spins continuously (NOT
  gated) — user wants it alive at all times. The guitar-stage stays `opacity:1`
  always; the centre name plaque hides only while stored.
- Wall-slot coordinates were measured by overlaying a % grid on the scene PNG
  (PIL) and compositing the guitar onto candidate niches to eyeball-verify before
  shipping. Real niche tiers sit at y≈22 (upper) and y≈46 (lower); the ledge
  between them is ~y37 (a guitar there looks "not in a cabinet"). The wall has
  ~20 clean recesses total (5 cols x 2 tiers x 2 walls) — FEWER than the 31
  guitars, so guitars SHARE niches by `index % NICHES.length`; only one is shown
  stored at a time so they never collide on screen. Outer columns sit nearer the
  camera (larger h). `CURATED_SLOTS` (keyed by guitar id) pins specific guitars
  (e.g. frankenstrat -> approved lower-left niche).
- The live Hall flips through the WHOLE catalog (prev/next arrows + Left/Right
  keys, gated off while the close-up overlay is open). The hero on the dais is
  rendered by `GuitarThumb` (NOT a hardcoded PNG) so every guitar shows its own
  art and the dais matches the close-up exactly. All 31 guitars have a bundled
  photo in `src/assets/guitars/<id>.png` (uniform 896x1280, ~0.33 aspect), so
  height-based niche sizing is consistent across them.
- The equip toggle reads "Put away" (in use) / "Use {guitar.name}" (resting),
  and lives at the very bottom (~1.5%) with the name plaque lifted to ~17% so the
  button never overlaps the name. Keep that vertical separation if you re-tune.

# Cabinet geometry (cabinet.png = 948x1659 portrait)

The frame box uses `aspect-ratio: 948 / 1659`. Inside it, by % of the frame:
- Gold alien-head hanger cradle (where the headstock shoulder rests) sits at
  ~32% of frame height, centered.
- Guitar: size it by WIDTH, not height. Height-driven `object-contain`
  letterboxes the (portrait, aspect ~0.7) photo and makes it look tiny. Use
  `.cab-guitar { width:60%; top:24%; left:50%; transform:translateX(-50%) }`
  with no fixed height, and the img `className="block h-auto w-full"`. The guitar
  PNGs are 896x1280 with ~3.5% transparent pad above the headstock and ~93%
  content height (aspect ~0.32, centered), so width 60% / top 24% lands the
  headstock shoulders in the cradle with the body inside the niche. Tune `top` to
  raise/lower; tune `width` to scale.
- Engraved gold name panel: centered, ~`x 50%`, ~`y 88.6%`, ~28% wide, ~8% tall.
  Text must be DARK (near-black `#110b02`) with a light highlight text-shadow to
  read as engraving on the medium-gold panel, centered, wrapped to TWO lines
  (`-webkit-line-clamp: 2`, `word-break: break-word`) inside ~26% width so long
  names don't overflow the plate. A single-line, full-width, or pale-text plate
  is illegible — the user rejected all three.
- To vertically center the plate text on the panel it uses
  `transform: translate(-50%,-50%)`; give it its OWN fade keyframe ending at that
  transform — sharing the guitar's `translateX(-50%)`-only keyframe drops the Y
  centering at animation end.
