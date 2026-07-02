/**
 * CoinFlyOverlay — renders gold coin images that arc from a source position
 * to a target position, then fade out. Rendered into document.body via a
 * React portal so it sits above all other content.
 */
import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

const STYLE_ID = "ags-coin-fly-kf";
const KEYFRAME = `@keyframes ags-coin-fly {
  0%   { opacity: 1; transform: translate(0,0) scale(1); }
  65%  { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--dx),var(--dy)) scale(0.22); }
}`;

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = KEYFRAME;
  document.head.appendChild(el);
}

export interface CoinFlyProps {
  fromX:   number;
  fromY:   number;
  toX:     number;
  toY:     number;
  count?:  number;
  onDone:  () => void;
}

export function CoinFlyOverlay({
  fromX,
  fromY,
  toX,
  toY,
  count = 8,
  onDone,
}: CoinFlyProps) {
  const particles = useMemo(() => {
    const n = Math.min(count, 10);
    return Array.from({ length: n }, (_, i) => ({
      id:    i,
      x:     fromX + (Math.random() - 0.5) * 180,
      y:     fromY + (Math.random() - 0.5) * 90,
      delay: i * 68,
      size:  28 + Math.random() * 18,
    }));
  // stable on mount — recomputing would re-randomise positions mid-flight
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    injectStyle();
    const t = setTimeout(onDone, (count - 1) * 68 + 970);
    return () => clearTimeout(t);
  }, [count, onDone]);

  return createPortal(
    <>
      {particles.map((p) => (
        <img
          key={p.id}
          src={`${import.meta.env.BASE_URL}gear/coin-single.png`}
          alt=""
          style={{
            position:      "fixed",
            left:          p.x - p.size / 2,
            top:           p.y - p.size / 2,
            width:         p.size,
            height:        p.size,
            pointerEvents: "none",
            zIndex:        9999,
            "--dx":        `${toX - p.x}px`,
            "--dy":        `${toY - p.y}px`,
            animation:     `ags-coin-fly 0.88s cubic-bezier(.2,.8,.3,1) ${p.delay}ms both`,
          } as React.CSSProperties}
        />
      ))}
    </>,
    document.body,
  );
}
