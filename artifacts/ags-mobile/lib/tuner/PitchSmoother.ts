import { PitchFrame } from "./types";

export class PitchSmoother {
  private frames: PitchFrame[] = [];
  constructor(private maxFrames = 9, private maxJumpCents = 20) {}
  reset() { this.frames = []; }

  push(frame: PitchFrame): PitchFrame {
    const last = this.frames[this.frames.length - 1];
    if (last) {
      const jump = Math.abs(1200 * Math.log2(frame.frequency / last.frequency));
      if (jump > this.maxJumpCents && frame.clarity < last.clarity + 0.08) return this.weightedMedian();
    }
    this.frames.push(frame);
    if (this.frames.length > this.maxFrames) this.frames.shift();
    return this.weightedMedian();
  }

  private weightedMedian(): PitchFrame {
    const sorted = [...this.frames].sort((a, b) => a.frequency - b.frequency);
    const total = sorted.reduce((s, f) => s + f.clarity * f.probability, 0);
    let acc = 0;
    for (const f of sorted) {
      acc += f.clarity * f.probability;
      if (acc >= total / 2) return f;
    }
    return sorted[Math.floor(sorted.length / 2)];
  }

  get stable(): boolean {
    if (this.frames.length < 5) return false;
    const base = this.frames[0].frequency;
    const cents = this.frames.map(f => 1200 * Math.log2(f.frequency / base));
    return Math.max(...cents) - Math.min(...cents) <= 2.2;
  }
}
