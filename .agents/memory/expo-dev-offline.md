---
name: Expo dev workflow hangs on login prompt
description: The ags-mobile Expo dev server can block forever on an interactive Expo-account login prompt; fix is EXPO_OFFLINE=1, not CI=1.
---

The `artifacts/ags-mobile` dev workflow (`expo start`) can intermittently hang
on an interactive prompt ("It is recommended to log in with your Expo account
before proceeding… Log in / Proceed anonymously"). A background workflow has no
TTY to answer it, so Metro never finishes serving and the preview just spins.
It often bundles fine on first start and only hits the prompt after a restart.

**Fix:** prefix the `dev` script with `EXPO_OFFLINE=1`. Offline mode skips all
Expo account/network checks while keeping Metro + live reload working, and the
proxy preview still loads.

**Why not CI=1:** `CI=1` makes it WORSE — expo then hard-errors
("Input is required, but 'npx expo' is in non-interactive mode") instead of
auto-proceeding, AND it disables watch mode / live reload. Avoid it.

**How to apply:** edit the `dev` script in `artifacts/ags-mobile/package.json`
(not artifact.toml/.replit — the workflow just runs `pnpm run dev`), then restart
the workflow. Note: offline mode logs "no cached development certificate found,
unable to sign manifest" — that only affects Expo Go device tunnels, not the
in-Replit web preview. Real-phone Expo Go (QR) needs the online sign-in path.
