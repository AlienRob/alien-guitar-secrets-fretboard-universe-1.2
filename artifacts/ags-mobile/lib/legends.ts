// Data for the Hall of Legends screen (app/(tabs)/legends.tsx).
//
// The Hall honours the six legendary beings of the Alien Guitar Secrets cosmos —
// one per playable species. Each legend shows a cinematic full-body character
// render from assets/images/legends/ (see lib/legendPortraits.ts, keyed by
// species + gender) so the stage feels like a hall of heroes. The titles/blurbs
// and the "Eternal Legends" roll below are fixed AGS lore (designed content, not
// live player data) — they exist to inspire the student, which is the whole
// point of a Hall of Legends.

import type { MaterialCommunityIcons } from "@expo/vector-icons";

import type { GenderId, SpeciesId } from "@/lib/avatarOptions";

export type EmblemName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface SpeciesLegend {
  species: SpeciesId;
  /** Short tag shown under the emblem (matches the avatar species naming). */
  tag: string;
  /** Lore title for the being. */
  title: string;
  /** One-line lore blurb. */
  blurb: string;
  /** Species accent colour (drives the emblem tint + caption accents). */
  color: string;
  /** MaterialCommunityIcons emblem glyph. */
  emblem: EmblemName;
  /** Which portrait to show on the stage. */
  gender: GenderId;
}

// Order mirrors the user's mockup: Human, Grey, Hybrid, Nordic, Pleiadian, Reptilian.
export const SPECIES_LEGENDS: SpeciesLegend[] = [
  {
    species: "human",
    tag: "Human",
    title: "The Lightbringer",
    blurb: "Earthborn and relentless — living proof that anyone can ascend.",
    color: "#ffcf5a",
    emblem: "star",
    gender: "male",
  },
  {
    species: "alien",
    tag: "Grey",
    title: "The Watcher",
    blurb: "Silent observer who has mapped every secret in the fretboard.",
    color: "#cfd6e6",
    emblem: "alien",
    gender: "male",
  },
  {
    species: "hybrid",
    tag: "Hybrid",
    title: "The Bridge",
    blurb: "Two worlds, one voice — born to fuse every style into one.",
    color: "#c85cff",
    emblem: "dna",
    gender: "female",
  },
  {
    species: "nordic",
    tag: "Nordic",
    title: "The Ascendant",
    blurb: "Towering tone carried down from the far blue stars.",
    color: "#34c6e6",
    emblem: "triangle-outline",
    gender: "male",
  },
  {
    species: "pleiadian",
    tag: "Pleiadian",
    title: "The Starseeker",
    blurb: "Channels the seven sisters into pure, weightless melody.",
    color: "#5a8cff",
    emblem: "star-four-points",
    gender: "female",
  },
  {
    species: "reptilian",
    tag: "Reptilian",
    title: "The Primalord",
    blurb: "Ancient, scaled and unshakeable — the keeper of the groove.",
    color: "#36d07a",
    emblem: "eye",
    gender: "male",
  },
];

export interface EternalLegend {
  rank: number;
  name: string;
  species: SpeciesId;
  honour: number;
}

// The eternal roll of honour — canonical AGS legends to aspire to. Fixed lore,
// shown beside the player's own honour. Wire to a real leaderboard once mobile
// gains accounts (a later phase).
export const ETERNAL_LEGENDS: EternalLegend[] = [
  { rank: 1, name: "Lightbringer", species: "human", honour: 25680 },
  { rank: 2, name: "StarSeeker", species: "pleiadian", honour: 22430 },
  { rank: 3, name: "VoidWalker", species: "alien", honour: 18995 },
  { rank: 4, name: "Ironscale", species: "reptilian", honour: 15240 },
  { rank: 5, name: "Skybinder", species: "nordic", honour: 12870 },
];

export function speciesColor(species: SpeciesId): string {
  return SPECIES_LEGENDS.find((l) => l.species === species)?.color ?? "#ffcf5a";
}
