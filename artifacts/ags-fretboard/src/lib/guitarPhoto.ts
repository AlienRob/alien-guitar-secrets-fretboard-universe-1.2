// Photo-real guitar images live in src/assets/guitars/<id>.png and are matched to
// a guitar by its id. Loaded eagerly at build time via Vite's import.meta.glob so
// every photo is hashed and bundled. Guitars without a photo fall back to the
// generated SVG/3D art.
const modules = import.meta.glob("../assets/guitars/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const photoById: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const file = path.split("/").pop();
  if (!file) continue;
  const id = file.replace(/\.png$/, "");
  photoById[id] = url;
}

export function getGuitarPhoto(id: string): string | undefined {
  return photoById[id];
}
