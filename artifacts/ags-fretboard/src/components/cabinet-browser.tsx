import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, X, Sparkles, Lock } from "lucide-react";
import GuitarThumb from "@/components/guitar-thumb";
import GuitarModel3D from "@/components/guitar-model-3d";
import { GUITARS, RARITY_META } from "@/data/guitars";
import { loadHandedness } from "@/lib/playerCustomization";
import "./cabinet-browser.css";

const base = import.meta.env.BASE_URL;
const CABINET = `${base}assets/frames/cabinet.png`;

interface Props {
  // Open on a specific guitar (by catalog id); defaults to the first.
  initialId?: string;
  // When provided, the browser is an overlay and shows a close button.
  onClose?: () => void;
  // Free-tier teaser banner inviting an upgrade to the full Hall.
  showUpsell?: boolean;
}

// A single ornate display cabinet (the attached frame) reused for every guitar.
// Players walk through the whole collection in close-up — the free-tier window
// into the premium Hall of Legends.
export default function CabinetBrowser({ initialId, onClose, showUpsell }: Props) {
  const startIndex = initialId
    ? GUITARS.findIndex((g) => g.id === initialId)
    : 0;
  const [index, setIndex] = useState(startIndex < 0 ? 0 : startIndex);
  const handed = loadHandedness();
  const closeRef = useRef<HTMLButtonElement>(null);

  // In overlay mode, move focus to the close button so keyboard users land
  // inside the dialog (Escape already closes it via the key handler below).
  useEffect(() => {
    if (onClose) closeRef.current?.focus();
  }, [onClose]);

  const total = GUITARS.length;
  const guitar = GUITARS[index];
  const rarity = RARITY_META[guitar.rarity];

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + total) % total),
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  return (
    <section
      className="cab-stage"
      {...(onClose
        ? { role: "dialog", "aria-modal": true, "aria-label": "Guitar close-up" }
        : {})}
    >
      {onClose && (
        <button
          type="button"
          ref={closeRef}
          className="cab-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X />
        </button>
      )}

      <header className="cab-header">
        <h1>The Collection</h1>
        <p>
          <span className="cab-count">
            {index + 1} / {total}
          </span>
          <span className="cab-rarity" style={{ color: rarity.color }}>
            {rarity.label}
          </span>
        </p>
      </header>

      <div className="cab-frame-wrap">
        <button
          type="button"
          className="cab-nav cab-prev"
          onClick={() => go(-1)}
          aria-label="Previous guitar"
        >
          <ChevronLeft />
        </button>

        <div className="cab-frame">
          <img className="cab-cabinet" src={CABINET} alt="" aria-hidden="true" />
          <div
            className={`cab-guitar${guitar.model3d ? " cab-guitar--3d" : ""}`}
            key={guitar.id}
          >
            {guitar.model3d ? (
              <GuitarModel3D
                guitar={guitar}
                handed={handed}
                className="block h-full w-full"
              />
            ) : (
              <GuitarThumb
                guitar={guitar}
                handed={handed}
                className="block h-auto w-full object-contain"
              />
            )}
          </div>
          <div className="cab-plate" key={`p-${guitar.id}`}>
            <span className="cab-plate-name">{guitar.name}</span>
          </div>
        </div>

        <button
          type="button"
          className="cab-nav cab-next"
          onClick={() => go(1)}
          aria-label="Next guitar"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="cab-meta">
        <span className="cab-inspiration">{guitar.inspiration}</span>
        <span className="cab-unlock">
          <Lock /> Unlocks at level {guitar.unlockLevel}
        </span>
      </div>

      {showUpsell && (
        <div className="cab-upsell">
          <div className="cab-upsell-text">
            <strong>You're browsing the collection.</strong>
            <span>
              Upgrade to Premium to step inside the Hall of Legends and play
              these guitars.
            </span>
          </div>
          <Link href="/pricing" className="cab-upsell-btn">
            <Sparkles /> Upgrade to Premium
          </Link>
        </div>
      )}
    </section>
  );
}
