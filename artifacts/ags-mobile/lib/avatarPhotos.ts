// AUTO-GENERATED static portrait map. React Native's require() needs literal
// paths, so every photo-real portrait is listed explicitly. Keys match
// <species>_<gender>[_<hairColour>] (see lib/avatarOptions.ts). To regenerate:
// re-run the copy + generation step in the build that created this file.
import type { ImageSourcePropType } from "react-native";

import type { GenderId, HairColourId, SpeciesId } from "@/lib/avatarOptions";
import { isHairless } from "@/lib/avatarOptions";

const PHOTOS: Record<string, ImageSourcePropType> = {
  "alien_female": require("@/assets/images/avatars/avatar_alien_female.png"),
  "alien_male": require("@/assets/images/avatars/avatar_alien_male.png"),
  "human_female_black": require("@/assets/images/avatars/avatar_human_female_black.png"),
  "human_female_blonde": require("@/assets/images/avatars/avatar_human_female_blonde.png"),
  "human_female_blue": require("@/assets/images/avatars/avatar_human_female_blue.png"),
  "human_female_brown": require("@/assets/images/avatars/avatar_human_female_brown.png"),
  "human_female_red": require("@/assets/images/avatars/avatar_human_female_red.png"),
  "human_female_silver": require("@/assets/images/avatars/avatar_human_female_silver.png"),
  "human_female_violet": require("@/assets/images/avatars/avatar_human_female_violet.png"),
  "human_male_black": require("@/assets/images/avatars/avatar_human_male_black.png"),
  "human_male_blonde": require("@/assets/images/avatars/avatar_human_male_blonde.png"),
  "human_male_blue": require("@/assets/images/avatars/avatar_human_male_blue.png"),
  "human_male_brown": require("@/assets/images/avatars/avatar_human_male_brown.png"),
  "human_male_red": require("@/assets/images/avatars/avatar_human_male_red.png"),
  "human_male_silver": require("@/assets/images/avatars/avatar_human_male_silver.png"),
  "human_male_violet": require("@/assets/images/avatars/avatar_human_male_violet.png"),
  "hybrid_female_black": require("@/assets/images/avatars/avatar_hybrid_female_black.png"),
  "hybrid_female_blonde": require("@/assets/images/avatars/avatar_hybrid_female_blonde.png"),
  "hybrid_female_blue": require("@/assets/images/avatars/avatar_hybrid_female_blue.png"),
  "hybrid_female_brown": require("@/assets/images/avatars/avatar_hybrid_female_brown.png"),
  "hybrid_female_red": require("@/assets/images/avatars/avatar_hybrid_female_red.png"),
  "hybrid_female_silver": require("@/assets/images/avatars/avatar_hybrid_female_silver.png"),
  "hybrid_female_violet": require("@/assets/images/avatars/avatar_hybrid_female_violet.png"),
  "hybrid_male_black": require("@/assets/images/avatars/avatar_hybrid_male_black.png"),
  "hybrid_male_blonde": require("@/assets/images/avatars/avatar_hybrid_male_blonde.png"),
  "hybrid_male_blue": require("@/assets/images/avatars/avatar_hybrid_male_blue.png"),
  "hybrid_male_brown": require("@/assets/images/avatars/avatar_hybrid_male_brown.png"),
  "hybrid_male_red": require("@/assets/images/avatars/avatar_hybrid_male_red.png"),
  "hybrid_male_silver": require("@/assets/images/avatars/avatar_hybrid_male_silver.png"),
  "hybrid_male_violet": require("@/assets/images/avatars/avatar_hybrid_male_violet.png"),
  "nordic_female_black": require("@/assets/images/avatars/avatar_nordic_female_black.png"),
  "nordic_female_blonde": require("@/assets/images/avatars/avatar_nordic_female_blonde.png"),
  "nordic_female_blue": require("@/assets/images/avatars/avatar_nordic_female_blue.png"),
  "nordic_female_brown": require("@/assets/images/avatars/avatar_nordic_female_brown.png"),
  "nordic_female_red": require("@/assets/images/avatars/avatar_nordic_female_red.png"),
  "nordic_female_silver": require("@/assets/images/avatars/avatar_nordic_female_silver.png"),
  "nordic_female_violet": require("@/assets/images/avatars/avatar_nordic_female_violet.png"),
  "nordic_male_black": require("@/assets/images/avatars/avatar_nordic_male_black.png"),
  "nordic_male_blonde": require("@/assets/images/avatars/avatar_nordic_male_blonde.png"),
  "nordic_male_blue": require("@/assets/images/avatars/avatar_nordic_male_blue.png"),
  "nordic_male_brown": require("@/assets/images/avatars/avatar_nordic_male_brown.png"),
  "nordic_male_red": require("@/assets/images/avatars/avatar_nordic_male_red.png"),
  "nordic_male_silver": require("@/assets/images/avatars/avatar_nordic_male_silver.png"),
  "nordic_male_violet": require("@/assets/images/avatars/avatar_nordic_male_violet.png"),
  "pleiadian_female_black": require("@/assets/images/avatars/avatar_pleiadian_female_black.png"),
  "pleiadian_female_blonde": require("@/assets/images/avatars/avatar_pleiadian_female_blonde.png"),
  "pleiadian_female_blue": require("@/assets/images/avatars/avatar_pleiadian_female_blue.png"),
  "pleiadian_female_brown": require("@/assets/images/avatars/avatar_pleiadian_female_brown.png"),
  "pleiadian_female_red": require("@/assets/images/avatars/avatar_pleiadian_female_red.png"),
  "pleiadian_female_silver": require("@/assets/images/avatars/avatar_pleiadian_female_silver.png"),
  "pleiadian_female_violet": require("@/assets/images/avatars/avatar_pleiadian_female_violet.png"),
  "pleiadian_male_black": require("@/assets/images/avatars/avatar_pleiadian_male_black.png"),
  "pleiadian_male_blonde": require("@/assets/images/avatars/avatar_pleiadian_male_blonde.png"),
  "pleiadian_male_blue": require("@/assets/images/avatars/avatar_pleiadian_male_blue.png"),
  "pleiadian_male_brown": require("@/assets/images/avatars/avatar_pleiadian_male_brown.png"),
  "pleiadian_male_red": require("@/assets/images/avatars/avatar_pleiadian_male_red.png"),
  "pleiadian_male_silver": require("@/assets/images/avatars/avatar_pleiadian_male_silver.png"),
  "pleiadian_male_violet": require("@/assets/images/avatars/avatar_pleiadian_male_violet.png"),
  "reptilian_female": require("@/assets/images/avatars/avatar_reptilian_female.png"),
  "reptilian_male": require("@/assets/images/avatars/avatar_reptilian_male.png"),
};

export function getAvatarPortrait(
  species: SpeciesId,
  gender: GenderId,
  hairColour: HairColourId,
): ImageSourcePropType | undefined {
  const key = isHairless(species)
    ? `${species}_${gender}`
    : `${species}_${gender}_${hairColour}`;
  return PHOTOS[key];
}
