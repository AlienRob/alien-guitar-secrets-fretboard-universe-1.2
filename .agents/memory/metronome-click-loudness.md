---
name: Metronome click loudness
description: Why synthesized WAV clicks sounded quiet and how to fix it
---

The synthesized metronome clicks sounded quiet even at full system volume because:
- Pure sine tones have low perceived loudness vs. their RMS (no percussive attack transient)
- Electronic was coded at 32% amplitude, cosmic at 42% — way below full scale
- Cached WAV files from a previous session kept playing old quiet versions

**Fix applied:**
- Classic: noise-snap transient (`exp(-t*700)`) blended with the tone — the noise burst at the attack gives perceived punch similar to a real click or drum stick
- Woodblock: multiplier 2 → 2.8
- Electronic: multiplier 0.7 → 1.0
- Cosmic: multiplier 0.42 → 0.95
- Non-accent vol floor: 0.62 → 0.75
- Cache filename: `ags-click-v2-` forces regeneration on next app load

**Why:** Short synthesized tones (28–80ms) depend almost entirely on their attack transient for perceived loudness. Mixing in a fast-decaying noise burst (`exp(-t*600..700)`) at ~30–40% of the blend gives the "snap" that makes a click cut through at listening volume.

**Cache busting:** any time the WAV synthesis changes, bump the version in the filename (`ags-click-v3-`, etc.) — otherwise expo-file-system's cache hit prevents regeneration.
