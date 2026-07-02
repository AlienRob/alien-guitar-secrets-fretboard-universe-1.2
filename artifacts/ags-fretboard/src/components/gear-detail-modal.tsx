import { useState } from "react";
import { X, Lock, Sparkles, Maximize2 } from "lucide-react";
import { RARITY_META } from "@/data/guitars";
import {
  GEAR_CATEGORIES,
  requirementLabel,
  type GearItem,
} from "@/data/gear";
import GearThumb from "@/components/gear-thumb";
import Pick3DViewer from "@/components/pick-3d-viewer";
import GearZoomViewer from "@/components/gear-zoom-viewer";
import FullscreenViewer from "@/components/fullscreen-viewer";

interface Props {
  item: GearItem;
  unlocked: boolean;
  onClose: () => void;
}

// A friendly sentence describing how a locked item is earned.
function earnSentence(item: GearItem): string {
  switch (item.req.kind) {
    case "level":
      return `Locked — reach Level ${item.req.level} to earn it`;
    case "sessions":
      return `Locked — complete ${item.req.sessions} practice sessions to earn it`;
    case "streak":
      return `Locked — keep a ${item.req.streak}-day practice streak to earn it`;
  }
}

export default function GearDetailModal({ item, unlocked, onClose }: Props) {
  const rarity = RARITY_META[item.rarity];
  const category = GEAR_CATEGORIES.find((c) => c.id === item.category);
  const [fullscreen, setFullscreen] = useState(false);

  // The artwork for this item — a spinning 3D pick, the interactive gear zoom
  // viewer for other unlocked gear, or a static (ghosted) thumbnail when locked.
  // Shared between the modal's frame and the full-screen overlay.
  const renderArt = () =>
    unlocked && item.category === "pick" ? (
      <Pick3DViewer item={item} className="h-full w-full" />
    ) : unlocked ? (
      <GearZoomViewer item={item} className="h-full w-full" />
    ) : (
      <GearThumb item={item} className="h-full w-full" />
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
          {/* Large artwork of the gear item on its own. */}
          <div
            className="relative shrink-0 self-center flex w-full sm:w-72 h-72 sm:h-80 items-center justify-center rounded-xl bg-gradient-to-b from-white/5 to-transparent overflow-hidden"
            style={{ boxShadow: `inset 0 0 24px ${rarity.glow}` }}
          >
            <div
              className={unlocked ? "h-64 w-64" : "h-56 w-56 opacity-30 grayscale"}
              style={unlocked ? { filter: `drop-shadow(0 0 14px ${rarity.glow})` } : undefined}
            >
              {renderArt()}
            </div>
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
            <h2 className="text-2xl font-sans font-bold text-foreground">{item.name}</h2>
            {category && (
              <p className="text-sm text-muted-foreground mt-1 italic">{category.subtitle}</p>
            )}
            <p className="mt-3 text-sm text-foreground">{item.blurb}</p>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-2">
                {unlocked ? (
                  <Sparkles className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                )}
                <span className={unlocked ? "text-accent" : "text-muted-foreground"}>
                  {unlocked
                    ? "Earned — displayed in your gear locker"
                    : earnSentence(item)}
                </span>
              </div>
              {!unlocked && (
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Requirement: {requirementLabel(item.req)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {fullscreen && (
      <FullscreenViewer title={item.name} onClose={() => setFullscreen(false)}>
        {renderArt()}
      </FullscreenViewer>
    )}
    </>
  );
}
