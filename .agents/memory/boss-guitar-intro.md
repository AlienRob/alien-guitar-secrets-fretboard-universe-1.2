---
name: Boss guitar intro cinematic
description: Synthesized guitar lick + portrait cinematic that plays when entering a boss battle.
---

## What was built
- `lib/audio.ts` — 10 boss lick definitions (BOSS_LICK_DEFS) + `renderLick()` DSP function + `playBossLick(bossId)` / `getBossLickDuration(bossId)` public API.
- `components/boss-guitar-intro.tsx` — Full-screen cinematic overlay: action sprite fills screen width via the sprite-sheet `Image` approach (same math as galaxy.tsx), accent color radial glow, boss name/specialty, auto-dismiss after lick + 1.25 s buffer.
- `app/boss/battle/[id].tsx` — Added `"solo"` as the first phase; `"solo"` renders `BossGuitarIntro` which calls `onDone()` → `"intro"` (existing BattleIntro) → `"battle"`.

## Lick DSP notes
- `renderLick(def)` is a generalized version of `renderExcellentLick()`: per-note freq, dur, bendSt, vibrato, gap params; same harmonic stack (1+0.55+0.30+0.18+0.10), tanh soft-clip, normalize to peak 0.90.
- Native caching: `_bossLickSounds` Map (any type — Sound.replayAsync returns Promise<AVPlaybackStatus> not void, needs loose type).
- Lick plays 350 ms after mount so the portrait slide-in animation is visible first.

## Boss lick styles (confirmed by user)
- Nena: even pentatonic 16ths, no bends
- Sandy: E-major arpeggio sweep up/down
- Hemi: slow A blues, big bends, wide vibrato
- LCS: Texas shuffle triplet groove
- Arygmor: fast bluesy fire, SRV-style, screaming bends (NOT slow)
- Ingvar: Edim7 triplet arpeggio ascending → Em7 sweep up/down → resolve (neo-classical Yngwie style)
- Hansy: 9-note lyrical melodic arc, flowing, singing (NOT sparse)
- Shreddy: chromatic blaze E4→A5, whammy tumble descent, heavy drive
- Mo: smooth descending legato G5→A3
- Vairon: two-handed tapping wide octave/7th leaps, extra harmonics

**Why:** User confirmed Arygmor = fast+aggressive (not slow) and Hansy = lyrical/melodic (not sparse) in session.
