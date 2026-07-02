---
name: Boss Battles gating & XP
description: How the AGS web Boss Battle hybrid gate works and the trust rules that keep its big XP bonus honest.
---

# Boss Battles (AGS web)

Hybrid gate: levelling up unlocks the boss planet (planet 10 of a system), but the
NEXT solar system stays LOCKED until that boss is defeated. Defeating a boss =
trophy guitar + big XP bonus (→ natural belt promotion) + wormhole + next system.

## Rule: every boss entry point must enforce the SAME gate
**Why:** the galaxy page (`pages/galaxy.tsx`) gates systems via boss-chain +
premium, but `/boss/:system` is directly deep-linkable. A level-only check there
let a high-level player skip the wormhole chain (fight boss N without beating
N-1, or without premium).
**How to apply:** any new boss entry must require, in this order: system 1 boss is
free; systems >1 require premium/full-access AND the previous boss defeated
(`isSystemBossGated`). Then the level gate. Keep `boss-battle.tsx` and
`galaxy.tsx` gating in lockstep.

## Rule: the boss XP bonus is re-checked server-side at the pass threshold
**Why:** the client sends `boss:true` on a win; like all challenge XP it is
client-trusted, but the bonus is large (BOSS_XP_BONUS=400) so a mislabelled
losing run shouldn't mint it. This app is deliberately soft/client-trusted
(no server boss-state), so we don't add server boss tracking — we just gate the
bonus on accuracy.
**How to apply:** `computeBossBonusXp` returns 0 below `BOSS_PASS_PCT` (80%).
Normal `computeXpForChallenge` is untouched (honor the xp-lever rule — boss bonus
is additive only).

## Final-system edge
`previewSystem` must stop at `MAX_BOSS_SYSTEM` once all bosses are beaten,
otherwise the galaxy dangles a bogus locked wormhole past the last world.

## Trophy guitars
Trophy guitars are gated on boss-defeat, not level, via the single helper
`isGuitarUnlocked(guitar, level, bossState)` (used by both vault.tsx and galaxy
previewRewards). Full-access/testers use `allBossesDefeatedState()` so everything
shows; vault separates a real-vs-display boss state so the celebration only fires
on genuine wins.
