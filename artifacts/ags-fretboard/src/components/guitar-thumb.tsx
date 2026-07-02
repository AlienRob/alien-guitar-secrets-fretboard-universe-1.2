import { useEffect, useState } from "react";
import { Guitar } from "@/data/guitars";
import { Handed } from "@/lib/playerCustomization";
import { renderGuitarThumbnail } from "@/lib/guitarThumbnail";
import { isWebGLAvailable } from "@/lib/webgl";
import { getGuitarPhoto } from "@/lib/guitarPhoto";
import GuitarArt from "@/components/guitar-art";

interface Props {
  guitar: Guitar;
  handed?: Handed;
  className?: string;
}

// Still image of the guitar (used in the vault grid, unlock card and avatar).
// Prefers the photo-real studio image; falls back to the rendered 3D thumbnail,
// then to the flat SVG art when WebGL is unavailable. Left-handed players see the
// photo mirrored so the orientation matches their chosen hand.
export default function GuitarThumb({ guitar, handed = "right", className }: Props) {
  const photo = getGuitarPhoto(guitar.id);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const webgl = isWebGLAvailable();

  useEffect(() => {
    if (photo || !webgl) return;
    let active = true;
    // defer so the grid paints first, then fill in thumbnails
    const id = requestAnimationFrame(() => {
      try {
        const url = renderGuitarThumbnail(guitar, handed);
        if (active) setSrc(url);
      } catch {
        if (active) setFailed(true);
      }
    });
    return () => {
      active = false;
      cancelAnimationFrame(id);
    };
  }, [guitar, handed, webgl, photo]);

  if (photo) {
    return (
      <img
        src={photo}
        alt={guitar.name}
        className={className}
        draggable={false}
        loading="lazy"
        decoding="async"
        style={handed === "left" ? { transform: "scaleX(-1)" } : undefined}
      />
    );
  }

  if (!webgl || failed) {
    return (
      <GuitarArt
        shape={guitar.shape}
        finish={guitar.finish}
        body={guitar.body}
        accent={guitar.accent}
        handed={handed}
        pickups={guitar.pickups}
        pickguard={guitar.pickguard}
        controls={guitar.controls}
        maple={guitar.maple}
        strings={guitar.strings}
        className={className}
      />
    );
  }
  if (!src) {
    return <div className={className} aria-hidden="true" />;
  }
  return <img src={src} alt={guitar.name} className={className} draggable={false} />;
}
