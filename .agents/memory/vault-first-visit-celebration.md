---
name: Vault first-visit celebration
description: Why "new unlock" detection in ags-fretboard vault uses an explicit initialized flag instead of an empty seen-set.
---

The AGS Display Vault celebrates guitars newly unlocked since the player last opened it. Unlocks are derived from player level; the vault stores a "seen" snapshot in localStorage.

**Rule:** Suppress the first-visit celebration using a dedicated `initialized` flag, never by checking whether the seen-set is empty.

**Why:** A player who first opens the vault at level 0 legitimately has an empty seen-set. If empty-set is treated as "first visit," then later when they reach level 1 the set still loads empty, the code re-treats it as a first visit, records the unlock, and never celebrates it — the first real unlock is silently swallowed.

**How to apply:** On first visit (`!isSeenInitialized()`) just snapshot current unlocks and set the init flag. On subsequent visits, diff current unlocks against the stored seen-set to find fresh ones. Same pattern applies to any "show what changed since last visit" feature backed by a stored snapshot.
