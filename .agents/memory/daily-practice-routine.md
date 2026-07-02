---
name: Daily Practice routine
description: Why the timed Daily Practice routine is a soft client-side system, not server-enforced.
---

The Daily Practice routine (3 random scored disciplines, 7 min each / 21 min to
unlock a level-up Challenge + prize) is intentionally a **soft, client-side
motivational layer** stored only in localStorage (`ags.dailyPractice.v1`,
per-calendar-day reset).

**Why:** consistent with the app's existing soft-gate philosophy (see the email
gate). The underlying drills already submit challenges / earn XP through the
normal API; the routine itself is a self-imposed practice timer. The backend
leveling was deliberately NOT rewired to the routine.

**How to apply:**
- Don't add server-side enforcement of the 21-minute timer or "challenge
  completion" detection unless the user explicitly asks. Gaming the timer
  (e.g. multi-tab time inflation — each banner accrues independently) only
  cheats the user themselves; a cross-tab heartbeat lock is over-engineering here.
- The timer only accrues while `document.visibilityState === "visible"`.
- Fretboard Explorer is a **reference tool with no score** — never make it a
  graded discipline. The 5 scored disciplines are notes/intervals/scales/chords/ear.
- "Start the Challenge" links to the Galaxy Map (where leveling/prizes live) and
  marks the round's challenge started; state-level guard requires the routine to
  be genuinely complete before that transition.

## Gear rewards rotate across categories

The drill-completion reward (`awardDrillReward` in `dailyPractice.ts`, shown on
`session-result.tsx`) rotates through **pick → strap → pedal → amp** so every
gear type features as a reward — it is NOT picks-only. Amps are gated by the
player's level (`ampRewardPool(level)`); a category with nothing new to give is
skipped. Picks still get accuracy grading (great=flashy) when the rotation lands
on them.

**Why:** the Vault copy already promised picks/straps/pedals from practice and
amps from levelling, but the old `awardDrillPick` only ever granted picks — so
amps/pedals/straps never appeared as rewards despite being in the catalog.

**How to apply:**
- The rotation index is persisted **globally** (`ags.dailyPractice.rewardRotation.v1`),
  not per-round, on purpose — so the spread of gear carries across rounds/days.
- Reward pools (strap/pedal) are decoupled from each item's own milestone `req`
  (same as picks); only amps respect their level `req`. This matches the Vault's
  "keep practising for picks/straps/pedals; climb levels for amps" wording —
  keep them in sync.
- `RoundState.picksAwarded` keeps its legacy name (avoids a storage migration)
  but now tracks the per-discipline-per-tier gate for ALL gear, not just picks.
