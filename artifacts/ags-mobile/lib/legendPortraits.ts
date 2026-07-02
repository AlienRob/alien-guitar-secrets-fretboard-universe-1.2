// Full-body "master front" renders for the Hall of Legends stage
// (app/(tabs)/legends.tsx). These are the new cinematic character art, one per
// species + gender, background-removed so each figure stands cleanly on the
// cosmic stage. Keys are `<species>_<gender>` — unlike the practice avatars,
// these do not vary by hair colour. React Native's require() needs literal
// paths, so every render is listed explicitly here.
import type { ImageSourcePropType } from "react-native";

import type { GenderId, SpeciesId } from "@/lib/avatarOptions";

const LEGEND_PORTRAITS: Record<string, ImageSourcePropType> = {
  "alien_female": require("@/assets/images/legends/alien_female.png"),
  "alien_male": require("@/assets/images/legends/alien_male.png"),
  "human_female": require("@/assets/images/legends/human_female.png"),
  "human_male": require("@/assets/images/legends/human_male.png"),
  "hybrid_female": require("@/assets/images/legends/hybrid_female.png"),
  "hybrid_male": require("@/assets/images/legends/hybrid_male.png"),
  "nordic_female": require("@/assets/images/legends/nordic_female.png"),
  "nordic_male": require("@/assets/images/legends/nordic_male.png"),
  "pleiadian_female": require("@/assets/images/legends/pleiadian_female.png"),
  "pleiadian_male": require("@/assets/images/legends/pleiadian_male.png"),
  "reptilian_female": require("@/assets/images/legends/reptilian_female.png"),
  "reptilian_male": require("@/assets/images/legends/reptilian_male.png"),
};

export function getLegendPortrait(
  species: SpeciesId,
  gender: GenderId,
): ImageSourcePropType | undefined {
  return LEGEND_PORTRAITS[`${species}_${gender}`];
}
