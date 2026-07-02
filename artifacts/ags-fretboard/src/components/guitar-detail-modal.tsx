import { useState } from "react";
import { Link } from "wouter";
import { X, Lock, Sparkles, Music, Target, BookOpen, Maximize2 } from "lucide-react";
import { Guitar, RARITY_META, isUnlocked } from "@/data/guitars";
import Guitar3DViewer from "@/components/guitar-3d-viewer";
import GuitarModel3D from "@/components/guitar-model-3d";
import GuitarInspect from "@/components/guitar-inspect";
import FullscreenViewer from "@/components/fullscreen-viewer";
import { getGuitarPhoto } from "@/lib/guitarPhoto";
import { loadHandedness } from "@/lib/playerCustomization";

interface Props {
  guitar: Guitar;
  level: number;
  onClose: () => void;
}

export default function GuitarDetailModal({ guitar, level, onClose }: Props) {
  const rarity = RARITY_META[guitar.rarity];
  const unlocked = isUnlocked(guitar, level);
  const photo = getGuitarPhoto(guitar.id);
  const [fullscreen, setFullscreen] = useState(false);

  // The interactive viewer for this guitar — a 3D model if it has one, a photo
  // "inspect" (zoom + tilt) if it has a photo, otherwise the procedural 3D
  // viewer. Rendered both in the modal's small frame and the full-screen overlay.
  const renderViewer = (showHint: boolean) =>
    guitar.model3d ? (
      <>
        <div className="h-full w-full">
          <GuitarModel3D guitar={guitar} handed={loadHandedness()} className="h-full w-full" />
        </div>
        {showHint && (
          <span className="pointer-events-none absolute bottom-2 left-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Drag to rotate
          </span>
        )}
      </>
    ) : photo ? (
      <GuitarInspect
        src={photo}
        alt={guitar.name}
        handed={loadHandedness()}
        className="h-full w-full"
      />
    ) : (
      <>
        <div className="h-full w-full">
          <Guitar3DViewer guitar={guitar} handed={loadHandedness()} className="h-full w-full" />
        </div>
        {showHint && (
          <span className="pointer-events-none absolute bottom-2 left-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Drag to rotate
          </span>
        )}
      </>
    );

  return (
    <>
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border bg-card/80 backdrop-blur-xl p-6"
        style={{ borderColor: rarity.color, boxShadow: `0 0 32px ${rarity.glow}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Photo inspect (zoom + tilt); falls back to the 3D viewer if a guitar
              has no photo yet. */}
          <div
            className="relative shrink-0 self-center w-full sm:w-72 h-80 sm:h-[28rem] rounded-xl bg-gradient-to-b from-white/5 to-transparent overflow-hidden"
            style={{ boxShadow: `inset 0 0 24px ${rarity.glow}` }}
          >
            {renderViewer(true)}
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              aria-label="View full screen"
              className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-md border border-white/15 bg-black/50 text-foreground backdrop-blur transition-colors hover:border-accent/70 hover:text-accent"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div
              className="inline-block text-xs font-mono uppercase tracking-widest px-2 py-0.5 rounded mb-2"
              style={{ color: rarity.color, border: `1px solid ${rarity.color}` }}
            >
              {rarity.label}
            </div>
            <h2 className="text-2xl font-sans font-bold text-foreground">{guitar.name}</h2>
            <p className="text-sm text-muted-foreground mt-1 italic">{guitar.inspiration}</p>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-2">
                {unlocked ? (
                  <Sparkles className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                )}
                <span className={unlocked ? "text-accent" : "text-muted-foreground"}>
                  {unlocked
                    ? "Unlocked — displayed in your vault"
                    : `Locked — reach Level ${guitar.unlockLevel} to unlock`}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Music className="w-4 h-4 mt-0.5 text-secondary shrink-0" />
                <span>
                  <span className="text-muted-foreground">Signature technique: </span>
                  <span className="text-foreground">{guitar.signatureTechnique}</span>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>
                  <span className="text-muted-foreground">Theory focus: </span>
                  <span className="text-foreground">{guitar.theory}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Linked missions */}
        <div className="mt-6 pt-5 border-t border-primary/20">
          <div className="flex items-center gap-2 mb-3 text-sm uppercase tracking-widest text-secondary">
            <Target className="w-4 h-4" /> Unlocks these missions
          </div>
          <div className="flex flex-wrap gap-2">
            {guitar.challenges.map((ch) => (
              <Link key={ch.label + ch.route} href={ch.route}>
                <span className="inline-block cursor-pointer rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-foreground transition-all hover:bg-primary/25 hover:border-primary alien-border">
                  {ch.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>

    {fullscreen && (
      <FullscreenViewer title={guitar.name} onClose={() => setFullscreen(false)}>
        {renderViewer(false)}
      </FullscreenViewer>
    )}
    </>
  );
}
