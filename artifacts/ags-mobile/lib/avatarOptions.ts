export type SpeciesId =
  | "human"
  | "nordic"
  | "pleiadian"
  | "reptilian"
  | "alien"
  | "hybrid";
export type GenderId = "male" | "female";
export type HairColourId =
  | "black" | "brown" | "blonde" | "red" | "silver" | "blue" | "violet";

export interface Option<T extends string> {
  id: T;
  label: string;
}

export const GENDERS: Option<GenderId>[] = [
  { id: "male",   label: "Male"   },
  { id: "female", label: "Female" },
];

export const HAIRLESS_SPECIES: SpeciesId[] = ["alien", "reptilian"];
export function isHairless(species: SpeciesId): boolean {
  return HAIRLESS_SPECIES.includes(species);
}

export interface AvatarConfig {
  displayName: string;
  gender: GenderId;
  hairId: string;
  outfitId: string;
  bootsId: string;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  displayName: "",
  gender:   "male",
  hairId:   "hair_1",
  outfitId: "outfit_1",
  bootsId:  "boots_1",
};
