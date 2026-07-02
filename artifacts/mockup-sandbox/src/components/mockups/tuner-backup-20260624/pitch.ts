export function midiToFrequency(midi: number, a4 = 440): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

export function getCentsOff(freq: number, targetFreq: number): number {
  return 1200 * Math.log2(freq / targetFreq);
}

// ── Types ──────────────────────────────────────────────────────────────────────

export type TunerString = {
  idx:       number;
  label:     string;
  midi:      number;
  frequency: number;
};

export type StringCandidate = {
  string:      TunerString;
  frequency:   number;
  cents:       number;
  confidence:  number;
  tau:         number;
};

// ── Core: NSDF (Normalized Square Difference Function) at a single lag ─────────
//
// NSDF(τ) = (2 · Σ x[i]·x[i+τ]) / Σ (x[i]² + x[i+τ]²)
// Value in [-1, 1]; 1 = perfectly periodic with period τ.
// Equivalent to McLeod Pitch Method (MPM) equation 5.

function nsdfAt(buffer: Float32Array, tau: number): number {
  let acf   = 0;
  let denom = 0;
  const limit = buffer.length - tau;
  for (let i = 0; i < limit; i++) {
    const x = buffer[i], y = buffer[i + tau];
    acf   += x * y;
    denom += x * x + y * y;
  }
  return denom > 0 ? (2 * acf) / denom : 0;
}

// Parabolic sub-sample refinement of the best lag τ (McLeod §4.4).
function parabolicRefine(buffer: Float32Array, tau: number): number {
  const y0 = nsdfAt(buffer, Math.max(2, tau - 1));
  const y1 = nsdfAt(buffer, tau);
  const y2 = nsdfAt(buffer, Math.min(buffer.length - 2, tau + 1));
  const d  = y0 - 2 * y1 + y2;
  if (Math.abs(d) < 1e-12) return tau;
  return tau + 0.5 * (y0 - y2) / d;
}

// ── MPM around a target frequency (±windowRatio of the expected lag) ───────────
//
// This is the critical octave-safety mechanism: the search window is so
// narrow (±5.5 % ≈ ±1.9 semitones) that the algorithm physically cannot
// land on an octave harmonic.  Run once per guitar string, not once globally.

function mpmAroundFrequency(
  buffer:          Float32Array,
  sampleRate:      number,
  targetFrequency: number,
  windowRatio  =   0.055,
): { frequency: number; clarity: number; tau: number } | null {
  const targetLag = sampleRate / targetFrequency;
  const minLag    = Math.max(2, Math.floor(targetLag * (1 - windowRatio)));
  const maxLag    = Math.min(buffer.length - 2, Math.ceil(targetLag * (1 + windowRatio)));

  let bestTau = -1;
  let bestVal = -Infinity;
  for (let tau = minLag; tau <= maxLag; tau++) {
    const v = nsdfAt(buffer, tau);
    if (v > bestVal) { bestVal = v; bestTau = tau; }
  }

  if (bestTau < 0 || bestVal < 0.35) return null;

  const refined = parabolicRefine(buffer, bestTau);
  return { frequency: sampleRate / refined, clarity: Math.max(0, Math.min(1, bestVal)), tau: refined };
}

// ── Subharmonic / octave guard ─────────────────────────────────────────────────
//
// If τ/2, τ/3, or τ/4 has nearly as strong an NSDF, the shorter period is the
// true pitch and the current candidate is a subharmonic lock.  Penalise it so
// the shorter-period (higher-frequency) string candidate wins the sort.

function shorterPeriodPenalty(buffer: Float32Array, tau: number, clarity: number): number {
  let penalty = 0;
  for (const div of [2, 3, 4] as const) {
    const sub = Math.round(tau / div);
    if (sub < 2) continue;
    const sc = nsdfAt(buffer, sub);
    if (sc > clarity * 0.86 && sc > 0.45) {
      penalty = Math.max(penalty, 0.38 + (sc - clarity * 0.86));
    }
  }
  return penalty;
}

// ── Goertzel — targeted energy at a single frequency ─────────────────────────
//
// O(N) per frequency, much cheaper than a full FFT.
// Used for the instant visual "which string has most energy" check.

function goertzelPower(buffer: Float32Array, sampleRate: number, frequency: number): number {
  const omega = (2 * Math.PI * frequency) / sampleRate;
  const coeff = 2 * Math.cos(omega);
  let s0 = 0, s1 = 0, s2 = 0;
  for (let i = 0; i < buffer.length; i++) {
    s0 = buffer[i] + coeff * s1 - s2;
    s2 = s1; s1 = s0;
  }
  return s1 * s1 + s2 * s2 - coeff * s1 * s2;
}

// ── Public: fast visual string ID via Goertzel energy ─────────────────────────
//
// Returns the index of the string with the most spectral energy at its
// fundamental + second harmonic.  Fires on every frame for immediate feedback;
// the NSDF candidates provide the accurate committed reading.

export function detectEnergyString(
  buffer:    Float32Array,
  sampleRate: number,
  strings:   TunerString[],
): number | null {
  let bestIdx: number | null = null;
  let bestPower = 0;
  for (const s of strings) {
    const power =
      goertzelPower(buffer, sampleRate, s.frequency) +
      goertzelPower(buffer, sampleRate, s.frequency * 2) * 0.30;
    if (power > bestPower) { bestPower = power; bestIdx = s.idx; }
  }
  return bestIdx;
}

// ── Public: per-string NSDF candidates sorted by confidence ───────────────────
//
// For each string, run mpmAroundFrequency in a ±5.5 % lag window.  Compute a
// confidence score: NSDF clarity (accuracy) + closeness to target (in-tune
// preference) + continuity and energy boosts - octave penalty.
//
// Sorting by confidence means candidates[0] is the best match.

export function detectStringCandidates(
  buffer:          Float32Array,
  sampleRate:      number,
  strings:         TunerString[],
  energyStringIdx: number | null = null,
  lastStringIdx:   number | null = null,
  maxCents       = 70,
): StringCandidate[] {
  const candidates: StringCandidate[] = [];

  for (const s of strings) {
    const mpm = mpmAroundFrequency(buffer, sampleRate, s.frequency);
    if (!mpm) continue;

    const cents      = 1200 * Math.log2(mpm.frequency / s.frequency);
    const closeness  = Math.max(0, 1 - Math.abs(cents) / maxCents);
    const contBoost  = lastStringIdx   === s.idx ? 0.08 : 0;
    const enerBoost  = energyStringIdx === s.idx ? 0.06 : 0;
    const octPenalty = shorterPeriodPenalty(buffer, mpm.tau, mpm.clarity);

    const confidence = Math.max(0,
      mpm.clarity * 0.68 +
      closeness   * 0.26 +
      contBoost + enerBoost - octPenalty,
    );

    candidates.push({ string: s, frequency: mpm.frequency, cents, confidence, tau: mpm.tau });
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates;
}
