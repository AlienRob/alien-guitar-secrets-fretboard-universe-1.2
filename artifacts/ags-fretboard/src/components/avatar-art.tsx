import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn } from "lucide-react";
import { AvatarConfig, getSkin } from "@/data/avatarOptions";
import { getAvatarPortrait } from "@/lib/avatarPhoto";
import { getAvatarModel } from "@/lib/avatarModel";
import { isWebGLAvailable } from "@/lib/webgl";
import GuitarInspect from "@/components/guitar-inspect";
import Avatar3D from "@/components/avatar-3d";

// Player avatar. Renders the chosen being matching the selected species, gender
// (and hair colour, for the 2D portraits) framed with the player's unlocked aura
// glow. The equipped guitar is shown separately (alongside the avatar) rather
// than baked in, so any being can pair with any of the collected guitars. Drops
// in anywhere a portrait-shaped (≈3:4) slot is provided via `className`.
//
// When a 3D model exists for the species + gender (the uploaded .glb characters)
// and WebGL is available, the avatar is rendered live in 3D. Otherwise it falls
// back to the 2D photo portrait (e.g. headless screenshots with no WebGL).
//
// Pass `enlargeable` to let the player tap the avatar open a detail view and
// inspect it close-up — drag to turn the 3D figure, or drag/zoom the photo.

interface AvatarArtProps {
  config: AvatarConfig;
  className?: string;
  enlargeable?: boolean;
  // When true, the thumbnail is cropped to a head-and-shoulders close-up instead
  // of the full standing figure (the figure is tiny in small slots). The enlarged
  // inspect view still shows the whole figure.
  headshot?: boolean;
}

export default function AvatarArt({ config, className, enlargeable, headshot }: AvatarArtProps) {
  const portrait = getAvatarPortrait(config.species, config.gender, config.hairColour);
  const modelUrl = getAvatarModel(config.species, config.gender);
  const [zoomed, setZoomed] = useState(false);
  // If a 3D model fails to load at runtime, drop to the 2D photo for that model.
  const [model3dFailed, setModel3dFailed] = useState(false);
  useEffect(() => {
    setModel3dFailed(false);
  }, [modelUrl]);
  const use3D = Boolean(modelUrl) && isWebGLAvailable() && !model3dFailed;
  const aura = getSkin(config.skin).aura;

  // Full figure (default) anchors to the bottom; the headshot zooms into the top
  // of the frame where every portrait keeps the face, centred horizontally.
  const fitClass = headshot ? "object-cover" : "object-contain object-bottom";
  const imgStyle = headshot
    ? {
        objectPosition: "50% top",
        transform: "scale(2.8)",
        transformOrigin: "50% 0%",
      }
    : undefined;

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  const hasVisual = use3D || Boolean(portrait);
  const canZoom = Boolean(enlargeable && hasVisual);

  const auraOverlay = aura ? (
    <div
      className="pointer-events-none absolute -inset-2 rounded-2xl"
      style={{
        background: `radial-gradient(ellipse at 50% 45%, ${aura}33, transparent 70%)`,
        boxShadow: `0 0 34px ${aura}66`,
      }}
    />
  ) : null;

  // The thumbnail body — a live 3D figure, the photo, or a "coming soon" slate.
  const thumb = use3D ? (
    <Avatar3D
      url={modelUrl!}
      headshot={headshot}
      onError={() => setModel3dFailed(true)}
      className="relative h-full w-full"
    />
  ) : portrait ? (
    <img
      src={portrait}
      alt={`${config.displayName || "Player"} avatar`}
      className={`relative h-full w-full rounded-xl ${fitClass}`}
      style={imgStyle}
      draggable={false}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <div className="relative flex h-full w-full items-center justify-center rounded-xl border border-primary/30 bg-card/40 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
      Portrait
      <br />
      coming soon
    </div>
  );

  return (
    <div className={`relative ${headshot ? "overflow-hidden rounded-xl" : ""} ${className ?? ""}`}>
      {auraOverlay}
      {canZoom ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setZoomed(true);
          }}
          className="group relative block h-full w-full cursor-zoom-in rounded-xl focus:outline-none"
          aria-label="Enlarge avatar"
        >
          {thumb}
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white opacity-80 backdrop-blur transition-opacity group-hover:opacity-100">
            <ZoomIn className="h-3.5 w-3.5" />
          </span>
        </button>
      ) : (
        thumb
      )}

      {zoomed && hasVisual && createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${config.displayName || "Player"} avatar — enlarged view`}
        >
          <div
            className="relative w-full max-w-md max-h-[92vh] rounded-2xl border border-primary/40 bg-card/80 p-4 backdrop-blur-xl alien-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomed(false)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-card/70 text-foreground transition-colors hover:border-accent hover:text-accent"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div
              className="relative h-[78vh] w-full overflow-hidden rounded-xl bg-gradient-to-b from-primary/10 to-transparent"
              style={aura ? { boxShadow: `inset 0 0 28px ${aura}55` } : undefined}
            >
              {use3D ? (
                <Avatar3D
                  url={modelUrl!}
                  inspect
                  onError={() => setModel3dFailed(true)}
                  className="h-full w-full"
                />
              ) : (
                <GuitarInspect
                  src={portrait!}
                  alt={`${config.displayName || "Player"} avatar`}
                  handed="right"
                  className="h-full w-full"
                />
              )}
            </div>
            {config.displayName && (
              <div className="mt-3 text-center text-lg font-sans font-bold text-foreground">
                {config.displayName}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
