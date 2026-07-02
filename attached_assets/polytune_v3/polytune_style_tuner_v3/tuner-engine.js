class StableGuitarTuner {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 44100;
    this.attackRejectMs = options.attackRejectMs ?? 90;
    this.analysisWindowMs = options.analysisWindowMs ?? 360;
    this.minRms = options.minRms ?? 0.0045;
    this.minConfidence = options.minConfidence ?? 0.48;
    this.centerLockCents = options.centerLockCents ?? 2;
    this.displaySmoothing = options.displaySmoothing ?? 0.20;
    this.maxAcceptedCents = options.maxAcceptedCents ?? 70;
    this.calibrationA4 = options.calibrationA4 ?? 440;
    this.history = [];
    this.attackStart = 0;
    this.wasLoud = false;
    this.smoothedCents = 0;
    this.lastStringId = null;

    this.baseStrings = [
      { id: 'E2', label: 'Low E', note: 'E2', midi: 40 },
      { id: 'A2', label: 'A', note: 'A2', midi: 45 },
      { id: 'D3', label: 'D', note: 'D3', midi: 50 },
      { id: 'G3', label: 'G', note: 'G3', midi: 55 },
      { id: 'B3', label: 'B', note: 'B3', midi: 59 },
      { id: 'E4', label: 'High E', note: 'E4', midi: 64 }
    ];
    this.updateStringFrequencies();
  }

  updateStringFrequencies() {
    this.strings = this.baseStrings.map(s => ({
      ...s,
      frequency: this.calibrationA4 * Math.pow(2, (s.midi - 69) / 12)
    }));
  }

  process(inputBuffer, sampleRate, nowMs = performance.now()) {
    this.sampleRate = sampleRate;
    const buffer = this.preprocess(inputBuffer);
    const rms = this.getRms(buffer);
    const isLoud = rms > this.minRms;

    if (isLoud && !this.wasLoud) this.attackStart = nowMs;
    this.wasLoud = isLoud;

    if (!isLoud) {
      this.history = [];
      this.lastStringId = null;
      this.smoothedCents *= 0.85;
      return { active: false, confidence: 0, rms };
    }

    const visualString = this.detectStringBySpectralEnergy(buffer, sampleRate);

    if (nowMs - this.attackStart < this.attackRejectMs) {
      return { active: true, settling: true, rms, visualStringId: visualString?.id || this.lastStringId };
    }

    const candidates = this.detectStringCandidates(buffer, sampleRate, visualString?.id);
    const best = candidates[0];

    if (!best || best.confidence < this.minConfidence || Math.abs(best.cents) > this.maxAcceptedCents) {
      return {
        active: true,
        stable: false,
        confidence: best?.confidence || 0,
        rms,
        debug: best,
        visualStringId: visualString?.id || this.lastStringId
      };
    }

    const reading = { ...best, time: nowMs };
    this.history.push(reading);
    this.history = this.history.filter(r => nowMs - r.time <= this.analysisWindowMs);

    const stable = this.getStableReading();
    if (!stable) {
      return { active: true, stable: false, confidence: best.confidence, rms, visualStringId: best.string.id };
    }

    const targetCents = Math.abs(stable.cents) <= this.centerLockCents ? 0 : stable.cents;
    this.smoothedCents += (targetCents - this.smoothedCents) * this.displaySmoothing;
    this.lastStringId = stable.string.id;

    return {
      active: true,
      stable: true,
      stringId: stable.string.id,
      stringLabel: stable.string.label,
      targetNote: stable.string.note,
      targetFrequency: stable.string.frequency,
      frequency: stable.frequency,
      noteName: stable.string.note,
      cents: Math.round(stable.cents),
      displayCents: this.smoothedCents,
      confidence: stable.confidence,
      rms
    };
  }

  preprocess(buffer) {
    // DC removal only. A Hann window is good for FFT, but it can bias time-domain
    // period detection flat on the middle guitar strings.
    const out = new Float32Array(buffer.length);
    let mean = 0;
    for (let i = 0; i < buffer.length; i++) mean += buffer[i];
    mean /= buffer.length;
    for (let i = 0; i < buffer.length; i++) out[i] = buffer[i] - mean;
    return out;
  }

  getRms(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
    return Math.sqrt(sum / buffer.length);
  }

  detectStringCandidates(buffer, sampleRate, energyStringId = null) {
    const candidates = [];
    for (const string of this.strings) {
      const mpm = this.mpmAroundFrequency(buffer, sampleRate, string.frequency, 0.055);
      if (!mpm) continue;

      const cents = 1200 * Math.log2(mpm.frequency / string.frequency);
      const closeness = Math.max(0, 1 - Math.abs(cents) / this.maxAcceptedCents);
      const continuityBoost = this.lastStringId === string.id ? 0.08 : 0;
      const energyBoost = energyStringId === string.id ? 0.06 : 0;
      const octavePenalty = this.shorterPeriodPenalty(buffer, sampleRate, mpm.tau, mpm.clarity);

      const confidence = Math.max(0,
        (mpm.clarity * 0.68) +
        (closeness * 0.26) +
        continuityBoost +
        energyBoost -
        octavePenalty
      );

      candidates.push({
        string,
        frequency: mpm.frequency,
        cents,
        confidence,
        probability: mpm.clarity,
        octavePenalty
      });
    }

    // Important: if two candidates are both strong, prefer the shorter real period
    // rather than a subharmonic. This stops high E being called low E.
    candidates.sort((a, b) => b.confidence - a.confidence);
    return candidates;
  }

  mpmAroundFrequency(buffer, sampleRate, targetFrequency, windowRatio = 0.055) {
    const targetLag = sampleRate / targetFrequency;
    const minLag = Math.max(2, Math.floor(targetLag * (1 - windowRatio)));
    const maxLag = Math.min(buffer.length - 2, Math.ceil(targetLag * (1 + windowRatio)));

    let bestTau = -1;
    let bestVal = -Infinity;

    for (let tau = minLag; tau <= maxLag; tau++) {
      const nsdf = this.nsdfAt(buffer, tau);
      if (nsdf > bestVal) {
        bestVal = nsdf;
        bestTau = tau;
      }
    }

    if (bestTau < 0 || bestVal < 0.35) return null;

    const refinedTau = this.parabolicNsdf(buffer, bestTau);
    const frequency = sampleRate / refinedTau;
    const clarity = Math.max(0, Math.min(1, bestVal));
    return { frequency, clarity, tau: refinedTau };
  }

  nsdfAt(buffer, tau) {
    let acf = 0;
    let divisor = 0;
    const limit = buffer.length - tau;
    for (let i = 0; i < limit; i++) {
      const x = buffer[i];
      const y = buffer[i + tau];
      acf += x * y;
      divisor += x * x + y * y;
    }
    return divisor > 0 ? (2 * acf) / divisor : 0;
  }

  parabolicNsdf(buffer, tau) {
    const y0 = this.nsdfAt(buffer, Math.max(2, tau - 1));
    const y1 = this.nsdfAt(buffer, tau);
    const y2 = this.nsdfAt(buffer, Math.min(buffer.length - 2, tau + 1));
    const denom = y0 - 2 * y1 + y2;
    if (Math.abs(denom) < 1e-12) return tau;
    return tau + 0.5 * (y0 - y2) / denom;
  }

  shorterPeriodPenalty(buffer, sampleRate, tau, clarity) {
    // Reject octave/subharmonic locks: a high E has strong correlation at Low E's lag too.
    // If tau/2, tau/3 or tau/4 is almost as clear, the shorter lag is the real pitch.
    let penalty = 0;
    for (const div of [2, 3, 4]) {
      const subTau = Math.round(tau / div);
      if (subTau < 2) continue;
      const subClarity = this.nsdfAt(buffer, subTau);
      if (subClarity > clarity * 0.86 && subClarity > 0.45) {
        penalty = Math.max(penalty, 0.38 + (subClarity - clarity * 0.86));
      }
    }
    return penalty;
  }

  detectStringBySpectralEnergy(buffer, sampleRate) {
    let best = null;
    for (const string of this.strings) {
      const fundamental = this.goertzelPower(buffer, sampleRate, string.frequency);
      const harmonic2 = this.goertzelPower(buffer, sampleRate, string.frequency * 2) * 0.30;
      const power = fundamental + harmonic2;
      if (!best || power > best.power) best = { ...string, power };
    }
    return best;
  }

  goertzelPower(buffer, sampleRate, frequency) {
    const omega = 2 * Math.PI * frequency / sampleRate;
    const coeff = 2 * Math.cos(omega);
    let s0 = 0, s1 = 0, s2 = 0;
    for (let i = 0; i < buffer.length; i++) {
      s0 = buffer[i] + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    return s1 * s1 + s2 * s2 - coeff * s1 * s2;
  }

  getStableReading() {
    if (this.history.length < 4) return null;
    const latestStringId = this.history[this.history.length - 1].string.id;
    const sameString = this.history.filter(r => r.string.id === latestStringId);
    if (sameString.length < 4) return null;

    const centsValues = sameString.map(r => r.cents).sort((a, b) => a - b);
    const low = centsValues[Math.floor(centsValues.length * 0.20)];
    const high = centsValues[Math.floor(centsValues.length * 0.80)];
    if (high - low > 9) return null;

    const medianCents = centsValues[Math.floor(centsValues.length / 2)];
    const string = sameString[sameString.length - 1].string;
    const frequency = string.frequency * Math.pow(2, medianCents / 1200);
    const confidence = sameString.reduce((s, r) => s + r.confidence, 0) / sameString.length;
    return { string, cents: medianCents, frequency, confidence };
  }
}
