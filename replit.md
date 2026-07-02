# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/ags-fretboard run test` — run the AGS Fretboard test suite (Vitest)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Run it locally (off Replit)

The project is a standard pnpm monorepo with no Replit-specific runtime
dependencies in the app code. To run it on your own machine or another host:

1. Install **Node.js 24** and **pnpm** (`npm install -g pnpm`).
2. Install dependencies: `pnpm install`
3. Provide a **PostgreSQL** database and copy `.env.example` to `.env`, filling in
   `DATABASE_URL`. (Replit sets env vars automatically; off-platform you set them.)
4. Push the schema: `pnpm --filter @workspace/db run push`
5. Start the apps. Each service requires `PORT`, and the web apps also require
   `BASE_PATH` (the URL prefix to serve under — use `/` for the domain root):
   - API server: `PORT=5000 pnpm --filter @workspace/api-server run dev`
   - AGS Fretboard: `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/ags-fretboard run dev`

Sign-in and payments off-platform: on Replit, Clerk and Stripe credentials are
supplied automatically, so you don't set them. On another host, create your own
Clerk app and Stripe account and fill the `CLERK_*`, `VITE_CLERK_*`, and
`STRIPE_*` values in `.env` (see `.env.example`). The API server automatically
uses `STRIPE_SECRET_KEY` when Replit's integration isn't present. Note: the AGS
Fretboard web app requires `VITE_CLERK_PUBLISHABLE_KEY` to start — set it (a free
Clerk test key works). Stripe is only exercised when a user upgrades to premium.

Replit-only files (`.local/`, `.replit`, and each artifact's
`.replit-artifact/artifact.toml`) are harmless to keep but are ignored off-platform.
See `.env.example` for the full list of environment variables.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ags-fretboard` — the web app (React + Vite): fretboard explorer,
  lessons, practice drills, guitar art, premium/Clerk/Stripe.
- `artifacts/ags-mobile` — the native phone app (Expo / React Native, slug
  `ags-mobile`, preview `/mobile/`). Phase 1 = practice drills + an interactive
  fretboard explorer, on-device.
  - `app/(tabs)/` — Home, Practice, Fretboard, Progress tab screens (expo-router).
  - `app/(tabs)/explore.tsx` — the interactive fretboard explorer (pick a
    key + scale/chord to light up the neck with degree labels; tap any fret to
    name the note). Renders via `components/fretboard.tsx` (react-native-svg).
  - `app/lesson/intervals.tsx`, `app/lesson/finding-notes.tsx`,
    `app/lesson/chord-construction.tsx` — the three teaching "Lessons" ported
    from the web (`pages/learn/*`). Reached from a "Learn the theory" section on
    Practice. They share `components/lesson-layout.tsx` (back link, header,
    intro, study material, CTA to the matching drill). On the web these are
    Premium-gated; on mobile (free Phase 1) they are open. The intervals lesson
    plays each interval (melodic + harmonic) via `playSequence`; finding-notes
    shows the five octave-formula diagrams (PNGs copied to
    `assets/images/lessons/`); chord-construction renders the triad/seventh
    tables and inversions as text+formula chips (no staff/fret-diagram visuals).
  - `app/drill/[type].tsx` — the multiple-choice drill runner (intervals,
    notes, scales, chords). The end-of-drill recap is the shared
    `components/drill-result.tsx` (also used by Ear Training). When a result
    levels the player up or changes their belt, that recap fires the cinematic
    `components/level-up-celebration.tsx` overlay once (gated on
    `outcome.leveledUp || outcome.beltChanged`, captured at mount): rotating
    rays, flying sparks, a spring-in level badge, a belt chip, a triumphant
    ascending lick (`playLevelUpFanfare` in `lib/audio.ts`) and success haptics.
    It auto-dismisses after ~3.8s or on tap, is built on React Native's
    `Animated` API (no reanimated/worklet setup), and skips the whole burst when
    the OS "reduce motion" setting is on.
  - `app/ear-training.tsx` — the "Ear Training" interval drill: the app plays
    two notes (melodic, or "Together"), and the student names the interval from
    four choices. 10 questions, XP via `recordDrill("ear", …)`. Question data
    comes from `makeEarQuestions()` in `lib/drills.ts`; playback reuses
    `playSequence` from `lib/audio.ts` (works on web preview and on device).
  - `app/note-check.tsx` — the "Note Check" ear trainer: names a note, listens
    via the microphone, and tells the user if they played it right (5-note
    rounds, live tuning meter, XP via `recordDrill("listen", …)`). Capture lives
    in `hooks/useMicPitch.ts`; the pitch maths lives in `lib/pitch.ts`.
  - `lib/musicTheory.ts` — note spelling, scale/chord pools, and the degree
    helpers (`spellScaleWithDegrees`, `spellChordWithDegrees`, `chordSymbol`).
  - `lib/drills.ts` — question generators per drill type (+ `recap` payloads).
  - `lib/progression.ts` — XP, levels, belt ranks.
  - `contexts/progress.tsx` — progress state, persisted on-device via
    AsyncStorage (key `ags-progress-v1`). No backend in Phase 1.
  - `constants/colors.ts` — cosmic dark palette mirrored from the web app.
  - `components/degree-strip.tsx`, `components/reference-card.tsx` — the degree
    reference card and recap strip.
- `artifacts/api-server` — Express API (used by the web app).

## Architecture decisions

- The mobile app (`ags-mobile`) has its **own copy** of the music-theory and
  drill logic (`lib/musicTheory.ts`, `lib/drills.ts`), not a shared workspace
  lib. Expo/Metro resolution and the web app's browser-specific deps made a
  shared lib more trouble than it's worth for Phase 1. Keep the two in sync by
  hand when changing scale/chord pools or note spelling.
- Mobile Phase 1 is **frontend-only**: all state (XP, levels, drill history)
  lives on-device in AsyncStorage. No API calls, no auth. Accounts and sync are
  deferred to a later phase so the app is useful immediately and cheap to run.
- `constants/colors.ts` exposes the cosmic palette under a single `light` key
  (the app is always dark); `useColors` reads it directly. Don't add a `dark`
  key expecting scheme switching — there is intentionally one theme.
- Degree labels are derived from each note's diatonic letter step compared to
  the major-scale reference (`degreeLabel` in `musicTheory.ts`), so spellings
  and accidentals (b3, #4, b7) stay correct per key.
- The Note Check ear trainer detects pitch with a pure autocorrelation engine
  (`lib/pitch.ts`), but live microphone capture is **web-only** on purpose:
  `hooks/useMicPitch.ts` returns `supported: false` on native (iOS/Android show
  an "almost ready" screen). Real-time mic PCM on a phone needs a custom native
  audio module, which forces a dev/EAS build and breaks the Expo Go preview, so
  it's deferred until the user opts in. The screen and `lib/pitch.ts` won't need
  to change when the native capture branch is added.

## Product

Alien Guitar Secrets (AGS) helps guitar students learn the fretboard, scales,
and chords through short practice drills, wrapped in a cosmic space theme.

- **Web app** (AGS Fretboard Universe): interactive fretboard explorer, lessons,
  practice drills, custom guitar art, with free and premium tiers.
- **Mobile app** (Alien Guitar Secrets, Expo): a native phone companion. Phase 1
  delivers the practice experience on-device:
  - Home, Practice, and Progress tabs.
  - Quick drills (intervals, fretboard notes, scale spelling, chord spelling)
    with multiple-choice questions, XP, levels, and belt ranks.
  - A "Degree reference" study card on Practice, and a "What you practiced"
    recap after each scale/chord drill, both showing the degree (1, b3, 5, b7…)
    above every note.
  - A "Note Check" ear trainer: the app names a note, you play it on your
    guitar, and it listens to confirm you got it right (works in the web
    preview now; phones get it once microphone listening is enabled in a build).
  - Progress saved on the phone (no account needed yet).
  - Later phases will add accounts (Clerk), cloud sync, and premium
    (RevenueCat) — not in Phase 1.

## User preferences

- Communicate in plain, non-technical language; the user is non-technical and cost-sensitive. No emojis.
- Guitar practice (intervals, scales, chords) is guitar-oriented: it uses only the
  eleven guitar-friendly keys — C, G, D, A, E, B, F# (sharp) and F, Bb, Eb, Ab
  (flat). Db is excluded entirely (no five-flat keys for beginners). Selection is
  heavily weighted toward the keys students learn first via a per-key weighting in
  `randomPracticeRoot` (`artifacts/ags-fretboard/src/lib/musicTheory.ts`): the five
  open keys appear most, the harder sharp keys and the easiest flat (F) appear
  regularly, and Bb/Eb/Ab appear sparingly — so beginners are challenged, not
  hammered with flats. Keep flats in the mix; do NOT remove them. The fretboard
  explorer key selector (`ROOT_OPTIONS`) offers these same eleven keys. Notes must
  be spelled correctly for their key (sharps in sharp keys, flats in flat keys) —
  never a flat-only chromatic table.
- Scale practice 3-NPS shapes always start on the root as the lowest note
  (root-position pattern, index 0 in `makeQuestion`); CAGED still rotates positions.
- Chord diagrams (`components/chord-diagram.tsx`) can label each string with its
  role (R/3/5/b7…) via `showDegrees` and show the chord name via `name`. Lessons use
  both; the Chord Decoder quiz uses degree labels only (naming would spoil it).

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
