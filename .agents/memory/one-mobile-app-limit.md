---
name: One mobile app per Replit project
description: Replit enforces a hard limit of one Expo/mobile artifact per project. createArtifact fails with "Only one mobile app per project is allowed."
---

Only one `expo` artifact can exist per Replit project. Attempting to call `createArtifact({ artifactType: "expo" })` when a mobile app already exists returns an error.

**Why:** Platform enforcement — not a config issue, not fixable with a workaround.

**How to apply:** If the user wants a second mobile app (e.g. a standalone tools app alongside the main AGS app), it must be built in a separate Replit project. Prepare a handoff zip + prompt file so the user can take the assets and code there.
