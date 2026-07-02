# PolyTune-Style Stable Guitar Tuner V3

This version fixes the two main faults from V2:

1. D, G and B could show the correct string name but appear badly flat.
2. High E could be detected as Low E because the detector accepted octave/subharmonic repeats.

## What changed

- Replaced the earlier restricted YIN-style detector with an MPM/NSDF-style period detector.
- Removed the Hann window from time-domain pitch analysis because it can bias guitar-string lag estimates.
- Added a shorter-period guard so high E is not mistaken for Low E.
- Reduced the allowed tuning window to ±70 cents for standard open-string mode.
- Rebalanced filtering to keep more upper harmonic detail for D/G/B/high E.

## Run

Open `index.html` from a local server, not directly from the filesystem.

Example:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Notes for production

For a released tuner, add:

- calibration UI: 432 Hz / 440 Hz / custom A4
- selectable tunings
- manual string mode
- polyphonic mode as a separate path from single-string tuning
- user-selectable noise gate for acoustic vs electric input
