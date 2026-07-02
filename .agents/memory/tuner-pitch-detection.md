---
name: Guitar tuner pitch detection
description: How the AGS tuner detects pitch reliably across all 6 guitar strings without octave errors.
---

## The rule

Use a **hybrid two-layer approach**: FFT for octave identification, autocorrelation for precision.

**Why:** `corr(2T) ≈ corr(T)` for any periodic signal. Any approach that checks `corr(2×bestLag)` will always find high correlation there and will over-shift (D4→D3→D2). Do not use iterative lag-doubling as a harmonic correction strategy.

**How to apply:**

1. `findFundamental(freqData, sampleRate, fftSize)` — reads `getFloatFrequencyData()` bins. Bins are independent, so a sub-harmonic check (half-bin within 10 dB of peak bin) correctly identifies when the detected peak is a harmonic and shifts down. Works because FFT bins don't have the corr(2T) problem.

2. `autoCorrelate(buffer, sampleRate, min, max)` — called with `minFrequency = candidateFreq / 1.26` and `maxFrequency = candidateFreq * 1.26` (±4 semitones). This constrains the search so it cannot wander to the wrong octave. Gives sub-cent precision.

3. In `tick()`:
   - MIDI for the stability gate = `Math.round(69 + 12 * log2(candidateFreq / a4))` (from FFT — octave-safe)
   - Frequency for cents display = `pitch.frequency` (from constrained autocorr — precise)
   - `closestString` called on `medianFreq` (autocorr result, already constrained to right octave)

4. `fftBufRef` allocated once in `start()` alongside `bufferRef`: `new Float32Array(analyser.frequencyBinCount)`

**Files:** `pitch.ts` (findFundamental + autoCorrelate), `Tuner.tsx` (tick, start, fftBufRef)
