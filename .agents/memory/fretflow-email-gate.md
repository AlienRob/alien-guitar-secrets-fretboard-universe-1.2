---
name: FretFlow email gate is a soft lead-capture gate
description: Why the FretFlow free-access gate is client-side only and should stay that way
---

The FretFlow app (artifacts/guitar-practice) gates all content behind an email
submit, unlocked via a localStorage flag after POSTing to the public
`/api/fretflow/leads` endpoint.

**Rule:** This is intentionally a *soft* gate, not a security boundary. Do not
add server-issued tokens/sessions or auth to enforce it.

**Why:** The app is 100% free — there is no paid or sensitive content behind the
gate. The only goal is capturing an email before access. A trivially-bypassable
client gate is the correct, standard pattern for free lead capture; server-side
enforcement would be over-engineering against the user's stated intent.

**How to apply:** If a future review flags the localStorage bypass as a bug,
it's working as designed. Rate-limiting `/fretflow/leads` is a reasonable
optional hardening, but not required.
