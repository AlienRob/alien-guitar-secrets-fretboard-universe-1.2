import { PitchFrame } from "./types";

/** McLeod Pitch Method style detector: stable for guitar/bass/uke. */
export class PitchDetectorMPM {
  constructor(private options = {
    minFrequency: 25,
    maxFrequency: 1300,
    noiseGateRms: 0.01,
    clarityThreshold: 0.86,
  }) {}

  detect(input: Float32Array, sampleRate: number): PitchFrame | null {
    const buffer = removeDcAndWindow(input);
    const rms = getRms(buffer);
    if (rms < this.options.noiseGateRms) return null;

    const minTau = Math.floor(sampleRate / this.options.maxFrequency);
    const maxTau = Math.min(Math.floor(sampleRate / this.options.minFrequency), buffer.length - 2);
    const nsdf = new Float32Array(maxTau + 1);

    for (let tau = 0; tau <= maxTau; tau++) {
      let acf = 0, divisor = 0;
      for (let i = 0; i < buffer.length - tau; i++) {
        const x = buffer[i], y = buffer[i + tau];
        acf += x * y;
        divisor += x * x + y * y;
      }
      nsdf[tau] = divisor > 0 ? (2 * acf) / divisor : 0;
    }

    let bestTau = -1, bestValue = -1;
    for (let tau = minTau + 1; tau < maxTau - 1; tau++) {
      if (nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1] && nsdf[tau] > bestValue) {
        bestValue = nsdf[tau];
        bestTau = tau;
      }
    }

    if (bestTau <= 0 || bestValue < this.options.clarityThreshold) return null;
    const tau = parabolic(nsdf, bestTau);
    const frequency = sampleRate / tau;
    if (!Number.isFinite(frequency) || frequency < this.options.minFrequency || frequency > this.options.maxFrequency) return null;

    return { frequency, clarity: bestValue, rms, probability: Math.min(1, bestValue * Math.min(1, rms / 0.06)) };
  }
}

function removeDcAndWindow(input: Float32Array): Float32Array {
  let mean = 0;
  for (let i = 0; i < input.length; i++) mean += input[i];
  mean /= input.length;
  const out = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (input.length - 1)));
    out[i] = (input[i] - mean) * w;
  }
  return out;
}

function getRms(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

function parabolic(v: Float32Array, i: number): number {
  const x0 = v[i - 1] ?? v[i], x1 = v[i], x2 = v[i + 1] ?? v[i];
  const den = x0 - 2 * x1 + x2;
  return Math.abs(den) < 1e-12 ? i : i + 0.5 * ((x0 - x2) / den);
}
