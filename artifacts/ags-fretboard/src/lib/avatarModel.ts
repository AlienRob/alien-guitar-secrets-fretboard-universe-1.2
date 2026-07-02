// 3D player avatar models live in src/assets/avatars3d/ and are matched to a
// being by species + gender. These are the user-supplied .glb characters
// (meshopt-compressed, WebP textures) shown live in the avatar customiser and
// the vault. Loaded eagerly at build time via Vite's import.meta.glob so each
// model is hashed and emitted as its own asset (loaded on demand at runtime).
//
// Unlike the 2D photos, there is ONE model per species + gender — hair colour
// does not change the 3D character, so it is not part of the key.
//
// Naming: avatar_<species>_<gender>.glb
import { type GenderId, type SpeciesId } from "@/data/avatarOptions";

const modules = import.meta.glob("../assets/avatars3d/*.glb", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const modelByKey: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const file = path.split("/").pop();
  if (!file) continue;
  const key = file.replace(/^avatar_/, "").replace(/\.glb$/, "");
  modelByKey[key] = url;
}

// Returns the .glb url for a species + gender, or undefined when no 3D model is
// supplied (callers fall back to the 2D photo portrait).
export function getAvatarModel(
  species: SpeciesId,
  gender: GenderId,
): string | undefined {
  return modelByKey[`${species}_${gender}`];
}

export function hasAvatarModel(species: SpeciesId, gender: GenderId): boolean {
  return Boolean(getAvatarModel(species, gender));
}
