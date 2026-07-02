export function midiToFrequency(midi: number, a4 = 440): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

export function getCentsOff(freq: number, targetFreq: number): number {
  return 1200 * Math.log2(freq / targetFreq);
}

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

function parabolicRefine(buffer: Float32Array, tau: number): number {
  const y0 = nsdfAt(buffer, Math.max(2, tau - 1));
  const y1 = nsdfAt(buffer, tau);
  const y2 = nsdfAt(buffer, Math.min(buffer.length - 2, tau + 1));
  const d  = y0 - 2 * y1 + y2;
  if (Math.abs(d) < 1e-12) return tau;
  return tau + 0.5 * (y0 - y2) / d;
}

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
  if (bestTau === -1 || bestVal < 0.15) return null;
  const refinedTau = parabolicRefine(buffer, bestTau);
  return { frequency: sampleRate / refinedTau, clarity: bestVal, tau: refinedTau };
}

export function detectStringCandidates(
  buffer:       Float32Array,
  sampleRate:   number,
  strings:      TunerString[],
  energyIdx:    number | null,
  lastStringIdx: number | null,
): StringCandidate[] {
  const candidates: StringCandidate[] = [];
  for (const str of strings) {
    const result = mpmAroundFrequency(buffer, sampleRate, str.frequency);
    if (!result) continue;
    const cents = getCentsOff(result.frequency, str.frequency);
    if (Math.abs(cents) > 75) continue;
    let conf = result.clarity;
    if (energyIdx !== null && str.idx === energyIdx) conf += 0.08;
    if (lastStringIdx !== null && str.idx === lastStringIdx) conf += 0.04;
    candidates.push({ string: str, frequency: result.frequency, cents, confidence: conf, tau: result.tau });
  }
  return candidates.sort((a, b) => b.confidence - a.confidence);
}

export function detectEnergyString(
  buffer:     Float32Array,
  sampleRate: number,
  strings:    TunerString[],
): number | null {
  let best: { idx: number; energy: number } | null = null;
  for (const str of strings) {
    const targetLag = sampleRate / str.frequency;
    const minLag    = Math.max(2, Math.floor(targetLag * 0.94));
    const maxLag    = Math.min(buffer.length - 2, Math.ceil(targetLag * 1.06));
    let energy = 0;
    for (let tau = minLag; tau <= maxLag; tau++) energy += nsdfAt(buffer, tau);
    if (!best || energy > best.energy) best = { idx: str.idx, energy };
  }
  return best ? best.idx : null;
}
