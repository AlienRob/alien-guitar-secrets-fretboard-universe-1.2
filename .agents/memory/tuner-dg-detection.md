---
name: Tuner D/G string detection
description: Why D3 and G3 strings fail in the native WebView tuner and how to fix it.
---

## The problem

D3 (147 Hz) and G3 (196 Hz) are mid-range guitar strings with naturally strong 2nd harmonics. The WebView tuner's `shorterPeriodPenalty` checks whether a sub-period (tau÷2, ÷3, ÷4) has NSDF strength above a threshold — if so, it assumes the detector may have latched onto the wrong (longer) period and applies a confidence penalty.

The old thresholds (`sc > clarity * 0.86 && sc > 0.45`, penalty base `0.38`) are too aggressive. For D3/G3, real 2nd harmonics routinely clear the 0.86 bar, causing confidence to drop below 0.48, so `getStable` never accumulates 4 readings and the tuner shows "settling" indefinitely.

D3's 3rd harmonic ≈ 440 Hz (A4). G3's 3rd harmonic ≈ 588 Hz. Neither matches an open guitar string, but `pickBestTarget` (web hook) was matching them via ÷2 to B3 or E4 at ~200¢ — showing wrong readings in the web preview.

## The fix (WebView — native path)

`shorterPeriodPenalty` in `webviewHtml.ts`:
- Threshold: `clarity * 0.86` → `clarity * 0.93`
- Minimum sc: `0.45` → `0.52`
- Base penalty: `0.38` → `0.20`

Confidence threshold: `0.48` → `0.42`

## The fix (web hook path)

`pickBestTarget` in `useTunerPitch.ts`: add `freq/3` as a candidate with a +100¢ penalty. This beats the erroneous ÷2 match (200¢) and correctly routes 440 Hz → D3 and 588 Hz → G3.

**Why:**
Guitar wound strings (E2, A2, D3, G3) always have strong harmonics — that is normal physics, not a detection error. The penalty was designed for cases where the detector found a sub-harmonic of the string you're NOT playing, but fired too readily on the string you ARE playing.
