---
name: Embedded-iframe auth (Clerk cookie blocked)
description: Why all API calls 401 inside the Replit canvas iframe, and the Bearer-token bridge fix.
---

# Symptom

Inside the Replit canvas preview (the app embedded as an iframe shape), the user
appears signed in (Clerk UI shows logged-in) but **every** API request returns
401 — profile/summary, quests, redeem-code, etc. The same build works fine in a
normal top-level browser tab. A "premium access code is invalid" report was
actually this: redeem failed with 401 and the UI shows a generic "code invalid"
for any error.

# Cause

The web app authenticates via the Clerk **session cookie**, sent automatically
on same-origin `/api` requests. Browsers treat an embedded iframe as a
third-party context and block that cookie, so the server's `getAuth` sees no
session → 401 on everything.

# Fix

The generated API client (`@workspace/api-client-react`) already exposes
`setAuthTokenGetter`. Register it with Clerk's `clerk.session?.getToken()` so each
request carries `Authorization: Bearer <token>`, which `@clerk/express` verifies
regardless of cookies. Done via an `AuthTokenBridge` component mounted inside
`ClerkProvider`/`QueryClientProvider` in the web app's `App.tsx`.

**Why:** Bearer auth is cookie-independent, so it survives the iframe block.
Harmless in a normal tab (cookie still works; header just also present).

**How to apply:** If a Clerk-authenticated web artifact shows blanket 401s only
when embedded (canvas/iframe) but works in a real tab, add/keep the token-getter
bridge. The custom-fetch comment says "never use in web apps" — that assumes
cookies flow, which is false inside an iframe.
