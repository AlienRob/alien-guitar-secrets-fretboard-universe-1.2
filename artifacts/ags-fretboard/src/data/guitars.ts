// Static catalog for the AGS Galactic Display Vault.
//
// Guitars are unlocked purely from the player's level (see `unlockLevel`), so
// no extra storage is needed — completing levels/planets raises the level and
// fills the cabinet. Famous instruments use "inspired by" naming only; no
// trademarked names or logos are used.

export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export type GuitarShape =
  | "strat"
  | "lespaul"
  | "flyingv"
  | "superstrat"
  | "majesty"
  | "explorer"
  | "iceman"
  | "axebass";

export type GuitarFinish =
  | "solid"
  | "sunburst"
  | "relic"
  | "stripes"
  | "bullseye"
  | "polkadot"
  | "floral"
  | "chrome"
  | "mirror"
  | "alien";

export type Wing =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "legends"
  | "masters";

export interface ChallengeLink {
  label: string;
  route: string;
}

// Pickup layouts: 3 single-coils; humbucker-single-humbucker; dual humbuckers;
// a single bridge humbucker (e.g. the EVH-style Frankenstrat); or a neck
// single-coil + bridge humbucker (e.g. the Satriani-style sustainer + bridge).
export type PickupConfig = "sss" | "hsh" | "hh" | "h" | "sh" | "hhh";

export interface Guitar {
  id: string;
  name: string;
  rarity: Rarity;
  wing: Wing;
  unlockLevel: number;
  shape: GuitarShape;
  finish: GuitarFinish;
  body: string; // primary body colour
  accent: string; // secondary / hardware colour
  inspiration: string; // "inspired by" artist + instrument
  signatureTechnique: string;
  challenges: ChallengeLink[];
  theory: string; // related scale/chord/interval focus
  // Optional hardware overrides for accurate signature recreations. When omitted
  // the renderer falls back to sensible defaults derived from the body shape.
  pickups?: PickupConfig;
  pickguard?: boolean;
  controls?: number; // number of control knobs
  maple?: boolean; // light maple fretboard instead of dark rosewood
  strings?: number; // string count (defaults to 6; basses use 4)
  // Optional key into the bundled .glb models (see guitar-model-3d.tsx). When
  // set, the Hall centrepiece renders this real 3D model instead of the
  // procedural/photo thumbnail.
  model3d?: string;
}

export interface RarityMeta {
  label: string;
  color: string; // hex for text/border
  glow: string; // rgba for box-shadow
}

export const RARITY_META: Record<Rarity, RarityMeta> = {
  common: { label: "Common", color: "#9aa7c7", glow: "rgba(154,167,199,0.5)" },
  rare: { label: "Rare", color: "#00BFFF", glow: "rgba(0,191,255,0.6)" },
  epic: { label: "Epic", color: "#A855F7", glow: "rgba(168,85,247,0.7)" },
  legendary: { label: "Legendary", color: "#FFD700", glow: "rgba(255,215,0,0.7)" },
  mythic: { label: "Mythic", color: "#FF2D55", glow: "rgba(255,45,85,0.75)" },
};

export interface WingMeta {
  id: Wing;
  title: string;
  subtitle: string;
}

export const WINGS: WingMeta[] = [
  { id: "beginner", title: "Beginner Wing", subtitle: "First steps into the galaxy" },
  { id: "intermediate", title: "Intermediate Wing", subtitle: "Charting new systems" },
  { id: "advanced", title: "Advanced Wing", subtitle: "Deep space mastery" },
  { id: "legends", title: "Hall of Legends", subtitle: "Instruments of the immortals" },
  { id: "masters", title: "AGS Hall of Masters", subtitle: "Beyond the known universe" },
];

const c = (label: string, route: string): ChallengeLink => ({ label, route });

export const GUITARS: Guitar[] = [
  // --- Beginner Wing ---------------------------------------------------------
  {
    id: "nebula-starter",
    name: "Nebula Starter",
    rarity: "common",
    wing: "beginner",
    unlockLevel: 1,
    shape: "strat",
    finish: "solid",
    body: "#3b82f6",
    accent: "#e5e7eb",
    inspiration: "AGS original — the cadet's first axe",
    signatureTechnique: "Single-note picking",
    challenges: [c("Note Finding", "/practice/fretboard")],
    theory: "Open string names across the neck",
  },
  {
    id: "comet-cruiser",
    name: "Comet Cruiser",
    rarity: "common",
    wing: "beginner",
    unlockLevel: 2,
    shape: "superstrat",
    finish: "solid",
    body: "#06b6d4",
    accent: "#0f172a",
    inspiration: "AGS original — built for the long haul",
    signatureTechnique: "Alternate picking",
    challenges: [c("Note Finding", "/practice/fretboard"), c("Intervals", "/practice/intervals")],
    theory: "Perfect 4th & 5th intervals",
  },
  {
    id: "asteroid-axe",
    name: "Asteroid Axe",
    rarity: "rare",
    wing: "beginner",
    unlockLevel: 3,
    shape: "lespaul",
    finish: "solid",
    body: "#b45309",
    accent: "#fbbf24",
    inspiration: "AGS original — forged from space rock",
    signatureTechnique: "Power chords",
    challenges: [c("Chord Recognition", "/practice/chords")],
    theory: "Major & minor triads",
  },
  {
    id: "lunar-lancer",
    name: "Lunar Lancer",
    rarity: "rare",
    wing: "beginner",
    unlockLevel: 4,
    shape: "flyingv",
    finish: "solid",
    body: "#e2e8f0",
    accent: "#64748b",
    inspiration: "AGS original — sleek lunar alloy",
    signatureTechnique: "Hammer-ons & pull-offs",
    challenges: [c("Scale Recognition", "/practice/scales")],
    theory: "Major scale shapes",
  },
  {
    id: "solar-spark",
    name: "Solar Spark",
    rarity: "rare",
    wing: "beginner",
    unlockLevel: 5,
    shape: "strat",
    finish: "sunburst",
    body: "#f59e0b",
    accent: "#7c2d12",
    inspiration: "AGS original — charged by a dying star",
    signatureTechnique: "String bending",
    challenges: [c("Ear Training", "/practice/ear-training")],
    theory: "Interval recognition by ear",
  },

  // --- Intermediate Wing -----------------------------------------------------
  {
    id: "plasma-drifter",
    name: "Plasma Drifter",
    rarity: "epic",
    wing: "intermediate",
    unlockLevel: 6,
    shape: "superstrat",
    finish: "solid",
    body: "#7c3aed",
    accent: "#22d3ee",
    inspiration: "AGS original — rides plasma currents",
    signatureTechnique: "Legato runs",
    challenges: [c("Scale Recognition", "/practice/scales"), c("Intervals", "/practice/intervals")],
    theory: "Pentatonic scale fluency",
  },
  {
    id: "quasar-quake",
    name: "Quasar Quake",
    rarity: "epic",
    wing: "intermediate",
    unlockLevel: 8,
    shape: "explorer",
    finish: "solid",
    body: "#111827",
    accent: "#f43f5e",
    inspiration: "AGS original — felt across galaxies",
    signatureTechnique: "Palm muting & chugging",
    challenges: [c("Chord Recognition", "/practice/chords")],
    theory: "Power chord & riff construction",
  },
  {
    id: "pulsar-prime",
    name: "Pulsar Prime",
    rarity: "epic",
    wing: "intermediate",
    unlockLevel: 10,
    shape: "lespaul",
    finish: "sunburst",
    body: "#9a3412",
    accent: "#fde68a",
    inspiration: "AGS original — pulses with rhythm",
    signatureTechnique: "Vibrato control",
    challenges: [c("Ear Training", "/practice/ear-training"), c("Scales", "/practice/scales")],
    theory: "Modes of the major scale",
  },
  {
    id: "meteor-mauler",
    name: "Meteor Mauler",
    rarity: "epic",
    wing: "intermediate",
    unlockLevel: 12,
    shape: "flyingv",
    finish: "solid",
    body: "#dc2626",
    accent: "#0f172a",
    inspiration: "AGS original — impact guaranteed",
    signatureTechnique: "Aggressive downpicking",
    challenges: [c("Note Finding", "/practice/fretboard")],
    theory: "Fast position shifting",
  },

  // --- Advanced Wing ---------------------------------------------------------
  {
    id: "vortex-vanguard",
    name: "Vortex Vanguard",
    rarity: "epic",
    wing: "advanced",
    unlockLevel: 14,
    shape: "superstrat",
    finish: "chrome",
    body: "#94a3b8",
    accent: "#22d3ee",
    inspiration: "AGS original — leads the charge",
    signatureTechnique: "Sweep picking",
    challenges: [c("Scales", "/practice/scales"), c("Chords", "/practice/chords")],
    theory: "Arpeggio shapes across the neck",
  },
  {
    id: "singularity-shredder",
    name: "Singularity Shredder",
    rarity: "epic",
    wing: "advanced",
    unlockLevel: 17,
    shape: "superstrat",
    finish: "solid",
    body: "#1e1b4b",
    accent: "#a855f7",
    inspiration: "AGS original — bends spacetime",
    signatureTechnique: "Two-hand tapping",
    challenges: [c("Intervals", "/practice/intervals")],
    theory: "Wide-interval tapping patterns",
  },
  {
    id: "eventide-eclipse",
    name: "Eventide Eclipse",
    rarity: "epic",
    wing: "advanced",
    unlockLevel: 20,
    shape: "explorer",
    finish: "relic",
    body: "#0b1020",
    accent: "#fbbf24",
    inspiration: "AGS original — born at the event horizon",
    signatureTechnique: "Hybrid picking",
    challenges: [c("Ear Training", "/practice/ear-training"), c("Scales", "/practice/scales")],
    theory: "Harmonic & melodic minor colours",
  },

  // --- Hall of Legends -------------------------------------------------------
  {
    id: "woodstock-white",
    name: "Woodstock White Bolt",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 21,
    shape: "strat",
    finish: "solid",
    body: "#f8fafc",
    accent: "#d4d4d8",
    inspiration: "Inspired by Jimi Hendrix's Woodstock Strat",
    signatureTechnique: "Thumb-over chords & blues phrasing",
    challenges: [
      c("Minor Pentatonic Challenge", "/practice/scales"),
      c("Blues Phrasing Quest", "/practice/ear-training"),
      c("Chord Embellishment Mission", "/practice/chords"),
    ],
    theory: "Minor pentatonic + chord embellishments",
  },
  {
    id: "texas-number-one",
    name: "Texas Flood No.1",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 23,
    shape: "strat",
    finish: "relic",
    body: "#7c2d12",
    accent: "#1c1917",
    inspiration: "Inspired by Stevie Ray Vaughan's Number One",
    signatureTechnique: "Heavy strings, raking & aggressive vibrato",
    challenges: [
      c("Blues Box Challenge", "/practice/scales"),
      c("Shuffle Phrasing Quest", "/practice/ear-training"),
    ],
    theory: "Blues scale & expressive bending",
  },
  {
    id: "black-strat",
    name: "Comfortably Black",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 25,
    shape: "strat",
    finish: "solid",
    body: "#0a0a0a",
    accent: "#1f2937",
    inspiration: "Inspired by David Gilmour's Black Strat",
    signatureTechnique: "Soaring bends & melodic phrasing",
    challenges: [
      c("Melodic Bending Challenge", "/practice/ear-training"),
      c("Scale Phrasing Mission", "/practice/scales"),
    ],
    theory: "Blues + minor scale lyrical phrasing",
  },
  {
    id: "appetite-paul",
    name: "Appetite Goldtop",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 27,
    shape: "lespaul",
    finish: "sunburst",
    body: "#92400e",
    accent: "#fcd34d",
    inspiration: "Inspired by Slash's Appetite Les Paul",
    signatureTechnique: "Bluesy bends & pentatonic riffing",
    challenges: [
      c("Pentatonic Riff Challenge", "/practice/scales"),
      c("Chord Riff Mission", "/practice/chords"),
    ],
    theory: "Pentatonic riffs over chord changes",
  },
  {
    id: "number-one-lp",
    name: "Stairway No.1",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 29,
    shape: "lespaul",
    finish: "sunburst",
    body: "#a16207",
    accent: "#fde68a",
    inspiration: "Inspired by Jimmy Page's Number One Les Paul",
    signatureTechnique: "Riff-driven composition & bends",
    challenges: [
      c("Riff Builder Challenge", "/practice/chords"),
      c("Scale Mission", "/practice/scales"),
    ],
    theory: "Modal riffs & chord movement",
  },
  {
    id: "frankenstrat",
    name: "Frankenbolt",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 31,
    shape: "strat",
    finish: "stripes",
    body: "#dc2626",
    accent: "#ffffff",
    inspiration: "Inspired by Eddie Van Halen's Frankenstrat",
    signatureTechnique: "Two-hand tapping & dive bombs",
    pickups: "h",
    pickguard: false,
    controls: 1,
    maple: true,
    challenges: [
      c("Tapping Challenge", "/practice/intervals"),
      c("Speed Burst Mission", "/practice/fretboard"),
      c("Tremolo Dive-Bomb Quest", "/practice/ear-training"),
    ],
    theory: "Tapping arpeggios & whammy control",
  },
  {
    id: "polka-v",
    name: "Polka Nova V",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 33,
    shape: "flyingv",
    finish: "polkadot",
    body: "#0a0a0a",
    accent: "#ffffff",
    inspiration: "Inspired by Randy Rhoads' Polka Dot V",
    signatureTechnique: "Classical-influenced shredding",
    challenges: [
      c("Classical Run Challenge", "/practice/scales"),
      c("Arpeggio Mission", "/practice/chords"),
    ],
    theory: "Harmonic minor & diminished arpeggios",
  },
  {
    id: "jem-floral",
    name: "Lydian JEM-Star",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 35,
    shape: "superstrat",
    finish: "floral",
    body: "#15803d",
    accent: "#f0abfc",
    inspiration: "Inspired by Steve Vai's JEM",
    signatureTechnique: "Legato, whammy & exotic modes",
    challenges: [
      c("Legato Challenge", "/practice/scales"),
      c("Lydian Mode Mission", "/practice/scales"),
      c("Whammy Bar Mission", "/practice/ear-training"),
    ],
    theory: "Lydian mode & legato fluency",
  },
  {
    id: "js-chrome",
    name: "Surfing Chrome",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 37,
    shape: "superstrat",
    finish: "chrome",
    body: "#cbd5e1",
    accent: "#38bdf8",
    inspiration: "Inspired by Joe Satriani's JS",
    signatureTechnique: "Legato, tapping & pitch axis modes",
    pickups: "sh",
    challenges: [
      c("Legato Challenge", "/practice/scales"),
      c("Modal Mission", "/practice/scales"),
    ],
    theory: "Pitch-axis modal soloing",
  },
  {
    id: "majesty",
    name: "Majesty Starcrown",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 39,
    shape: "majesty",
    finish: "solid",
    body: "#1e3a8a",
    accent: "#67e8f9",
    inspiration: "Inspired by John Petrucci's Majesty",
    signatureTechnique: "Precision alternate picking & odd meters",
    challenges: [
      c("Alternate Picking Challenge", "/practice/fretboard"),
      c("Odd-Meter Mission", "/practice/intervals"),
    ],
    theory: "Symmetrical scales & precise sequencing",
  },
  {
    id: "n4-natural",
    name: "Extreme N-Nova",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 41,
    shape: "superstrat",
    finish: "relic",
    body: "#a8763e",
    accent: "#3f2d1a",
    inspiration: "Inspired by Nuno Bettencourt's N4",
    signatureTechnique: "Funk rhythm & fluid lead",
    challenges: [
      c("Funk Rhythm Challenge", "/practice/chords"),
      c("Lead Phrasing Mission", "/practice/scales"),
    ],
    theory: "Funk chord voicings & pentatonic leads",
  },
  {
    id: "bullseye-lp",
    name: "Bullseye Berserker",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 43,
    shape: "lespaul",
    finish: "bullseye",
    body: "#000000",
    accent: "#fde047",
    inspiration: "Inspired by Zakk Wylde's Bullseye Les Paul",
    signatureTechnique: "Pinch harmonics & blistering pentatonics",
    challenges: [
      c("Pinch Harmonic Challenge", "/practice/ear-training"),
      c("Pentatonic Speed Mission", "/practice/scales"),
    ],
    theory: "Pentatonic speed & squealing harmonics",
  },

  {
    id: "yngwie-cream",
    name: "Vanilla Fury",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 44,
    shape: "strat",
    finish: "solid",
    body: "#efe7cf",
    accent: "#d6c79a",
    inspiration: "Inspired by Yngwie Malmsteen's cream scalloped Strat",
    signatureTechnique: "Neoclassical sweeps & scalloped-neck shredding",
    pickups: "sss",
    maple: true,
    challenges: [
      c("Harmonic Minor Challenge", "/practice/scales"),
      c("Arpeggio Sweep Mission", "/practice/chords"),
    ],
    theory: "Harmonic minor & diminished arpeggios",
  },
  {
    id: "greeny-burst",
    name: "Greenstone Burst",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 45,
    shape: "lespaul",
    finish: "sunburst",
    body: "#a36a2a",
    accent: "#e9c46a",
    inspiration: "Inspired by Gary Moore's 'Greeny' Les Paul",
    signatureTechnique: "Vocal bends & singing sustained vibrato",
    challenges: [
      c("Expressive Bending Challenge", "/practice/ear-training"),
      c("Blues Phrasing Mission", "/practice/scales"),
    ],
    theory: "Minor & blues scale lyrical phrasing",
  },
  {
    id: "at-burst",
    name: "Melodic Maple Burst",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 46,
    shape: "superstrat",
    finish: "sunburst",
    body: "#7c2d12",
    accent: "#fbbf24",
    inspiration: "Inspired by Andy Timmons' AT signature superstrat",
    signatureTechnique: "Melodic phrasing & hybrid picking",
    pickups: "hh",
    challenges: [
      c("Melodic Phrasing Challenge", "/practice/scales"),
      c("Hybrid Picking Mission", "/practice/fretboard"),
    ],
    theory: "Major scale melody & expressive bends",
  },
  {
    id: "spaceman-lp",
    name: "Spaceman Smokestack",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 47,
    shape: "lespaul",
    finish: "sunburst",
    body: "#7f1d1d",
    accent: "#f3c969",
    inspiration: "Inspired by Ace Frehley's triple-pickup Les Paul (KISS)",
    signatureTechnique: "Bluesy bends & rock-anthem soloing",
    pickups: "hhh",
    controls: 3,
    challenges: [
      c("Pentatonic Anthem Challenge", "/practice/scales"),
      c("Chord Riff Mission", "/practice/chords"),
    ],
    theory: "Pentatonic riffs & rock anthem phrasing",
  },
  {
    id: "starchild-iceman",
    name: "Starchild Mirror",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 48,
    shape: "iceman",
    finish: "mirror",
    body: "#cbd5e1",
    accent: "#e2e8f0",
    inspiration: "Inspired by Paul Stanley's cracked-mirror Iceman (KISS)",
    signatureTechnique: "Driving power chords & showman rhythm",
    pickups: "hh",
    challenges: [
      c("Power Chord Challenge", "/practice/chords"),
      c("Rhythm Drive Mission", "/practice/fretboard"),
    ],
    theory: "Power chords & rhythmic drive",
  },
  {
    id: "demon-axe",
    name: "Demon Axe Bass",
    rarity: "legendary",
    wing: "legends",
    unlockLevel: 49,
    shape: "axebass",
    finish: "solid",
    body: "#0a0a0a",
    accent: "#cbd5e1",
    inspiration: "Inspired by Gene Simmons' Axe bass (KISS)",
    signatureTechnique: "Thunderous low-end groove & root-driven lines",
    pickups: "hh",
    controls: 2,
    strings: 4,
    challenges: [
      c("Root-Note Groove Challenge", "/practice/fretboard"),
      c("Interval Bass Mission", "/practice/intervals"),
    ],
    theory: "Root movement & bass-line intervals",
  },

  // --- AGS Hall of Masters ---------------------------------------------------
  {
    id: "ags-masterpiece",
    name: "AGS Galactic Masterpiece",
    rarity: "mythic",
    wing: "masters",
    unlockLevel: 50,
    shape: "superstrat",
    finish: "alien",
    body: "#6A00FF",
    accent: "#00FFD5",
    inspiration: "AGS apex relic — only Galactic Fretboard Masters may wield it",
    signatureTechnique: "Every technique, mastered",
    challenges: [
      c("Master Gauntlet", "/practice/fretboard"),
      c("Ear Mastery", "/practice/ear-training"),
      c("Scale Mastery", "/practice/scales"),
    ],
    theory: "Total fretboard fluency",
    model3d: "mythic-prime",
  },
];

export function isUnlocked(g: Guitar, level: number): boolean {
  return level >= g.unlockLevel;
}

export function guitarsByWing(wing: Wing): Guitar[] {
  return GUITARS.filter((g) => g.wing === wing).sort((a, b) => a.unlockLevel - b.unlockLevel);
}
