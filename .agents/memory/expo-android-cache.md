---
name: Expo Android stale cache fix
description: When Android in Expo Go shows "1 module" bundle instead of the full app, Metro's cache is stale — fix with --clear flag.
---

## Rule
Add `--clear` to `expo start` in the dev script to prevent Android serving a stale 1-module bundle.

**Why:** Metro caches bundles per platform. When the Android cache goes stale it serves just the entry-point (1 module) and the app crashes immediately on Android while iOS still works fine. The `--clear` flag wipes the cache on every server restart.

**How to apply:** The flag is already in `artifacts/ags-mobile/package.json` dev script. If Android starts crashing after a code change, restart the expo workflow — the cache clears automatically on each start now.
