---
name: AGS XP lever
description: Where user XP actually comes from in the AGS guitar app (and what does NOT grant XP)
---

The only thing that adds to `usersTable.xp` is `computeXpForChallenge(correct,total)`
applied in `routes/challenges.ts` when a drill is submitted. Level (and therefore
guitar/amp/belt unlocks) follows from that XP.

Daily quests (`dailyQuestsTable`, QUEST_TEMPLATES) display an `xpReward`, but that
value is **never** credited anywhere — `updateQuestProgress` only tracks
count/completion. There is no "claim quest" endpoint.

**Why:** A user asked to "make daily tasks give much less XP so guitars unlock
slower." The intuitive move (lower quest xpReward) does nothing functional. The
real lever is the per-drill XP. Reducing it slows level-gated unlocks (guitars,
amps, belts) while sessions/streak-gated gear (picks/straps/pedals) still accrues
once per drill regardless of XP.

**How to apply:** To change leveling/guitar pacing, edit `computeXpForChallenge`
in `artifacts/api-server/src/lib/agsGameLogic.ts`. Don't bother tuning quest
xpReward for progression — it's display-only (and reseed won't update existing
DB rows anyway).
