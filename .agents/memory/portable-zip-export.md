---
name: Portable zip export
description: How to build a portable project zip in this environment (no zip CLI, git stash blocked).
---

# Building a portable project export zip

Goal: produce a clean .zip of the tracked project (source + assets + lockfile +
.env.example) that runs off-platform.

**Constraints in this environment:**
- No `zip` / `bsdtar` / `unzip` / `python3` CLI is available.
- `git stash create` and any index-touching git op are BLOCKED for the main agent
  (destructive-git guard), so you can't snapshot uncommitted edits via git.
- Direct `git commit` is also forbidden (checkpoints auto-commit at loop end).

**Working recipe:**
1. `git archive HEAD | tar -x -C export/staging` — extracts only tracked files
   (no node_modules/.local, fast). `tar` IS available.
2. Overlay any uncommitted edits by `cp`-ing the working-tree files into staging.
3. `rm -rf` from staging: `export/`, `exports/` (old nested archives — checkpoints
   auto-commit them and they balloon the zip ~2x), and `.replit` (bakes the user's
   personal `PREMIUM_OWNER_CLERK_IDS` / Clerk owner id; Replit-only, inert
   off-platform). Add `/export/` and `/exports/` to `.gitignore` to stop the bloat.
4. Build the zip in Node (code_execution) with a hand-written ZIP encoder:
   `zlib.deflateRawSync` (method 8, fall back to store when comp >= raw) + a CRC32
   table + local headers + central directory + EOCD. Verify by re-parsing every
   entry and checking CRC32 round-trips.

**Why:** off-platform the app needs its own Clerk + Stripe creds. The API server
Stripe client falls back to `STRIPE_SECRET_KEY` env when the Replit connector env
is absent; the AGS Fretboard web app HARD-REQUIRES `VITE_CLERK_PUBLISHABLE_KEY`
to boot (throws otherwise). Document both in `.env.example` + `replit.md`.
