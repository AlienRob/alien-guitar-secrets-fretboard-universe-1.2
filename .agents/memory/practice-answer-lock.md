---
name: Practice page per-question answer lock
description: Why immediate-submit practice pages need a ref guard, not just currentIndex/result checks
---

The immediate-submit practice pages (scales, intervals, chords) advance to the
next question synchronously inside the answer handler, but the FINAL (10th)
question does not advance — it calls `submit.mutate(...)` and only sets `result`
in the async `onSuccess`. During that network window `currentIndex` stays at 9
and `result` is still null, so a guard of only `currentIndex >= 10 || result`
lets extra clicks re-enter the handler: each extra click appends another review
row AND fires another `submit.mutate`.

**Rule:** these pages must lock each question with a synchronous `useRef`
(`answeredRef.current === currentIndex` → bail, else set it). State-based locks
(`selected`, `submit.isPending`) are not reliable for sub-render-tick double
clicks because the state hasn't flushed yet. Reset the ref to -1 on
start/replay.

**Why:** without the lock the end-of-session review list could exceed 10 items
(duplicate last row) and the challenge could be submitted multiple times.

**How to apply:** any new option-button practice page that submits on the last
question (vs. advancing) needs this ref guard. The timeout-based pages
(fretboard, ear-training) are comparatively safe because their 600ms/1100ms
delay before submit keeps the lock state set across the window.
