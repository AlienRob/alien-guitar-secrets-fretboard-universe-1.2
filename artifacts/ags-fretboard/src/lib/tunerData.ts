export type Instrument = "guitar" | "bass" | "uke";
export type StringNote = { label: string; midi: number };
export type TuningPreset = { label: string; strings: StringNote[] };

const shift = (strings: StringNote[], semitones: number): StringNote[] =>
  strings.map((s) => ({ ...s, midi: s.midi + semitones }));

const guitar6: StringNote[] = [
  { label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "D", midi: 50 },
  { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 },
];
const bass4: StringNote[] = [
  { label: "E", midi: 28 }, { label: "A", midi: 33 }, { label: "D", midi: 38 }, { label: "G", midi: 43 },
];
const uke4: StringNote[] = [
  { label: "G", midi: 67 }, { label: "C", midi: 60 }, { label: "E", midi: 64 }, { label: "A", midi: 69 },
];

export const tunings: Record<Instrument, Record<string, TuningPreset[]>> = {
  guitar: {
    "6": [
      { label: "Standard",    strings: guitar6 },
      { label: "Eb Standard", strings: [{ label:"Eb",midi:39},{label:"Ab",midi:44},{label:"Db",midi:49},{label:"Gb",midi:54},{label:"Bb",midi:58},{label:"Eb",midi:63}] },
      { label: "D Standard",  strings: [{ label:"D",midi:38},{label:"G",midi:43},{label:"C",midi:48},{label:"F",midi:53},{label:"A",midi:57},{label:"D",midi:62}] },
      { label: "Drop D",      strings: [{ label:"D",midi:38},{label:"A",midi:45},{label:"D",midi:50},{label:"G",midi:55},{label:"B",midi:59},{label:"E",midi:64}] },
      { label: "Drop C",      strings: [{ label:"C",midi:36},{label:"G",midi:43},{label:"C",midi:48},{label:"F",midi:53},{label:"A",midi:57},{label:"D",midi:62}] },
      { label: "Open D",      strings: [{ label:"D",midi:38},{label:"A",midi:45},{label:"D",midi:50},{label:"F#",midi:54},{label:"A",midi:57},{label:"D",midi:62}] },
      { label: "Open E",      strings: [{ label:"E",midi:40},{label:"B",midi:47},{label:"E",midi:52},{label:"G#",midi:56},{label:"B",midi:59},{label:"E",midi:64}] },
      { label: "Open G",      strings: [{ label:"D",midi:38},{label:"G",midi:43},{label:"D",midi:50},{label:"G",midi:55},{label:"B",midi:59},{label:"D",midi:62}] },
      { label: "Open A",      strings: [{ label:"E",midi:40},{label:"A",midi:45},{label:"C#",midi:49},{label:"E",midi:52},{label:"A",midi:57},{label:"E",midi:64}] },
      { label: "DADGAD",      strings: [{ label:"D",midi:38},{label:"A",midi:45},{label:"D",midi:50},{label:"G",midi:55},{label:"A",midi:57},{label:"D",midi:62}] },
      { label: "Nashville",   strings: [{ label:"E",midi:52},{label:"A",midi:57},{label:"D",midi:62},{label:"G",midi:67},{label:"B",midi:59},{label:"E",midi:64}] },
    ],
    "7": [
      { label: "Standard", strings: [{label:"B",midi:35},{label:"E",midi:40},{label:"A",midi:45},{label:"D",midi:50},{label:"G",midi:55},{label:"B",midi:59},{label:"E",midi:64}] },
      { label: "Drop A",   strings: [{label:"A",midi:33},{label:"E",midi:40},{label:"A",midi:45},{label:"D",midi:50},{label:"G",midi:55},{label:"B",midi:59},{label:"E",midi:64}] },
    ],
    "8": [
      { label: "Standard", strings: [{label:"F#",midi:30},{label:"B",midi:35},{label:"E",midi:40},{label:"A",midi:45},{label:"D",midi:50},{label:"G",midi:55},{label:"B",midi:59},{label:"E",midi:64}] },
    ],
    "12": [
      { label: "Standard",    strings: guitar6 },
      { label: "Eb Standard", strings: shift(guitar6, -1) },
    ],
  },
  bass: {
    "4": [
      { label: "Standard",      strings: bass4 },
      { label: "Drop D",        strings: [{label:"D",midi:26},{label:"A",midi:33},{label:"D",midi:38},{label:"G",midi:43}] },
      { label: "Semitone Down", strings: shift(bass4, -1) },
    ],
    "5": [
      { label: "Standard", strings: [{label:"B",midi:23},{label:"E",midi:28},{label:"A",midi:33},{label:"D",midi:38},{label:"G",midi:43}] },
    ],
  },
  uke: {
    "4": [
      { label: "Standard (GCEA)", strings: uke4 },
      { label: "Low G",           strings: [{label:"G",midi:55},{label:"C",midi:60},{label:"E",midi:64},{label:"A",midi:69}] },
      { label: "D Tuning",        strings: [{label:"A",midi:69},{label:"D",midi:62},{label:"F#",midi:66},{label:"B",midi:71}] },
    ],
  },
};

export const INST_LABELS: Record<Instrument, string> = {
  guitar: "Guitar",
  bass:   "Bass",
  uke:    "Ukulele",
};

export const STRING_COUNTS: Record<Instrument, string[]> = {
  guitar: ["6", "7", "8", "12"],
  bass:   ["4", "5"],
  uke:    ["4"],
};

export const A4_VALS: number[] = Array.from({ length: 41 }, (_, i) => 430 + i);
