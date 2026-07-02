// Featured guitars for the mobile Hall of Legends (app/(tabs)/legends.tsx).
//
// For now the Hall only showcases the guitars that exist as real 3D (.glb)
// models in the web app's vault. Today that's the single mythic centrepiece;
// add more entries here as further .glb models are brought across. On the phone
// each guitar is shown via its background-removed photo (assets/images/guitars/)
// rather than a live 3D engine, to keep the app light.
import type { ImageSourcePropType } from "react-native";

export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface FeaturedGuitar {
  id: string;
  name: string;
  rarity: Rarity;
  unlockLevel: number;
  inspiration: string;
  signatureTechnique: string;
  theory: string;
  photo: ImageSourcePropType;
  // Optional bundled .glb model shown in the on-demand 3D viewer
  // (app/guitar-3d.tsx). When absent the viewer is not offered for that guitar.
  model3d?: number;
}

export const RARITY_META: Record<Rarity, { label: string; color: string }> = {
  common: { label: "Common", color: "#9aa7c7" },
  rare: { label: "Rare", color: "#00BFFF" },
  epic: { label: "Epic", color: "#A855F7" },
  legendary: { label: "Legendary", color: "#FFD700" },
  mythic: { label: "Mythic", color: "#FF2D55" },
};

export const FEATURED_GUITARS: FeaturedGuitar[] = [
  {
    id: "ags-masterpiece",
    name: "AGS Galactic Masterpiece",
    rarity: "mythic",
    unlockLevel: 50,
    inspiration: "AGS apex relic — only Galactic Fretboard Masters may wield it.",
    signatureTechnique: "Every technique, mastered.",
    theory: "Total fretboard fluency.",
    photo: require("@/assets/images/guitars/ags-masterpiece.png"),
  },
];
