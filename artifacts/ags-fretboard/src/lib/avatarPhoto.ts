// Photo-real avatar portraits live in src/assets/avatars/ and are matched to a
// being by species + gender + hair colour. Loaded eagerly at build time via
// Vite's import.meta.glob so every photo is hashed and bundled.
//
// Naming:
//   human-like species: avatar_<species>_<gender>_<hairColour>.png
//   hairless species (Grey/alien, reptilian): avatar_<species>_<gender>.png
import {
  type GenderId,
  type HairColourId,
  type SpeciesId,
  isHairless,
} from "@/data/avatarOptions";

const modules = import.meta.glob("../assets/avatars/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const photoByKey: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const file = path.split("/").pop();
  if (!file) continue;
  const key = file.replace(/^avatar_/, "").replace(/\.png$/, "");
  photoByKey[key] = url;
}

export function getAvatarPortrait(
  species: SpeciesId,
  gender: GenderId,
  hairColour: HairColourId,
): string | undefined {
  const key = isHairless(species)
    ? `${species}_${gender}`
    : `${species}_${gender}_${hairColour}`;
  return photoByKey[key];
}
