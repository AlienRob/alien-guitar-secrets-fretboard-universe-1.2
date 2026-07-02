// Avatar customisation options for the AGS player avatar. Kept as plain data so
// the avatar creator and the photo renderer share a single source of truth.
//
// The avatar is a photo-real portrait chosen by SPECIES + GENDER + HAIR COLOUR.
// Human-like species (human, nordic, pleiadian, hybrid) have a portrait per hair
// colour; hairless species (Grey/alien, reptilian) have a single portrait per
// gender. The matching image lives in src/assets/avatars/ — see lib/avatarPhoto.ts.

export type SpeciesId =
  | "human"
  | "nordic"
  | "pleiadian"
  | "reptilian"
  | "alien"
  | "hybrid";
export type GenderId = "male" | "female";
export type HairColourId =
  | "black"
  | "brown"
  | "blonde"
  | "red"
  | "silver"
  | "blue"
  | "violet";

export interface Option<T extends string> {
  id: T;
  label: string;
}

export const SPECIES: Option<SpeciesId>[] = [
  { id: "human", label: "Human" },
  { id: "nordic", label: "Nordic" },
  { id: "pleiadian", label: "Pleiadian" },
  { id: "reptilian", label: "Reptilian" },
  { id: "alien", label: "Grey" },
  { id: "hybrid", label: "Hybrid" },
];

export const GENDERS: Option<GenderId>[] = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
];

export interface HairColour {
  id: HairColourId;
  label: string;
  color: string; // swatch colour
}

export const HAIR_COLOURS: HairColour[] = [
  { id: "black", label: "Black", color: "#1c1c22" },
  { id: "brown", label: "Brown", color: "#6b4423" },
  { id: "blonde", label: "Blonde", color: "#e6c878" },
  { id: "red", label: "Red", color: "#b5341f" },
  { id: "silver", label: "Silver", color: "#c7ccd6" },
  { id: "blue", label: "Blue", color: "#3b6fe0" },
  { id: "violet", label: "Violet", color: "#8b5cf6" },
];

// Hairless species use a single portrait per gender — the hair-colour picker is
// hidden for them and the value is ignored when resolving their image.
export const HAIRLESS_SPECIES: SpeciesId[] = ["alien", "reptilian"];

export function isHairless(species: SpeciesId): boolean {
  return HAIRLESS_SPECIES.includes(species);
}

// Unlockable cosmetic auras applied around the avatar. Earned by reaching the
// listed level — ties customisation directly to progression.
export interface Skin {
  id: string;
  label: string;
  unlockLevel: number;
  aura: string; // glow colour, "" for none
  description: string;
}

export const SKINS: Skin[] = [
  { id: "none", label: "No Aura", unlockLevel: 0, aura: "", description: "Clean, no aura." },
  { id: "cadet-glow", label: "Cadet Glow", unlockLevel: 3, aura: "#00BFFF", description: "A soft cadet-blue halo." },
  { id: "plasma-field", label: "Plasma Field", unlockLevel: 10, aura: "#FF2D55", description: "Crackling plasma energy." },
  { id: "void-walker", label: "Void Walker", unlockLevel: 18, aura: "#a855f7", description: "Drawn from the void between stars." },
  { id: "starforged", label: "Starforged", unlockLevel: 30, aura: "#FFD700", description: "Forged in a dying sun." },
  { id: "galactic-master", label: "Galactic Master", unlockLevel: 50, aura: "#00FFD5", description: "The aura of a true master." },
];

export interface AvatarConfig {
  displayName: string;
  species: SpeciesId;
  gender: GenderId;
  hairColour: HairColourId;
  guitarId: string; // selected/displayed guitar id ("" = none yet)
  strapId: string; // selected strap gear id ("" = none yet)
  ampId: string; // selected amp gear id ("" = none yet)
  cableId: string; // selected cable gear id ("" = none yet)
  sceneId: string; // selected rig stage/backdrop id
  skin: string; // Skin id (unlock aura)
}

export const DEFAULT_AVATAR: AvatarConfig = {
  displayName: "",
  species: "human",
  gender: "male",
  hairColour: "brown",
  guitarId: "",
  strapId: "",
  ampId: "",
  cableId: "",
  sceneId: "cosmic-hall",
  skin: "none",
};

export function getSkin(id: string): Skin {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}
