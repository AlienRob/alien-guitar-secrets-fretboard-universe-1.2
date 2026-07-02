export type Instrument = "guitar" | "bass" | "uke";
export type StringTarget = { id: string; label: string; midi: number; frequency: number; };
export type TunerMode = "auto" | "locked";
export type PitchFrame = { frequency: number; clarity: number; rms: number; probability: number; };
export type TunerReading = {
  note: string; target: StringTarget; frequency: number; targetFrequency: number;
  cents: number; inTune: boolean; perfect: boolean; confidence: number; stable: boolean;
};
