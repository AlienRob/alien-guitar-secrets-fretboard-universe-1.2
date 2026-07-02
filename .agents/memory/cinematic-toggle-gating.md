---
name: Animation/feature toggle gating
description: Persisted on/off toggles must gate behavior off in-memory state, not by re-reading localStorage.
---

When a feature toggle (e.g. Cinematic Mode) is persisted in localStorage and also
mirrored in React state, gate runtime behavior off the **in-memory state**, not by
calling a `localStorage`-reading helper at decision time.

**Why:** Re-reading storage at trigger time desyncs the visible toggle from actual
behavior in storage-restricted environments (private mode, blocked storage) — the
UI shows ON while the read returns the default. Treat localStorage strictly as
persistence; the React state is the source of truth for the current session.

**How to apply:** Compute a single derived predicate like
`shouldAnimate = toggleState && !prefersReducedMotion()` from component state and
use it everywhere. Load the persisted value once into state on mount; write to
storage on change.
