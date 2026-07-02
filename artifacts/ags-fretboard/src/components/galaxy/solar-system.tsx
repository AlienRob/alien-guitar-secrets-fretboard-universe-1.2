import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, Lock, Skull } from "lucide-react";
import type { PlanetInfo } from "@/lib/galaxyProgression";

interface Props {
  planets: PlanetInfo[];
  focusIndex: number; // 1-based planet currently front-and-centre
  onFocus: (index: number) => void;
  instant?: boolean; // skip smooth transitions (cinematic off / reduced motion)
  preview?: boolean; // viewing a not-yet-unlocked (locked) system
}

interface Size {
  w: number;
  h: number;
}

// A planet's visual palette derived from its position so each world feels
// distinct while staying inside the AGS purple/blue/cyan range. Bosses get an
// ominous crimson-violet treatment.
function planetColors(p: PlanetInfo): { core: string; mid: string; edge: string } {
  if (p.isBoss) {
    return { core: "#ff6b9d", mid: "#b1184e", edge: "#3b0a1f" };
  }
  const hue = 200 + ((p.index * 23) % 90); // 200..290 — blues -> purples
  return {
    core: `hsl(${hue} 95% 78%)`,
    mid: `hsl(${hue} 85% 52%)`,
    edge: `hsl(${hue} 70% 22%)`,
  };
}

const TWO_PI = Math.PI * 2;

export default function SolarSystem({ planets, focusIndex, onFocus, instant, preview }: Props) {
  const N = planets.length;
  const step = TWO_PI / N;

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ w: 800, h: 480 });
  const [rotation, setRotation] = useState(() => -(focusIndex - 1) * step);
  const [dragging, setDragging] = useState(false);

  const dragState = useRef<{ startX: number; startRot: number; moved: boolean } | null>(null);
  const wheelTimer = useRef<number | null>(null);

  // Static starfield — generated once so stars don't jump on every render.
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        delay: Math.random() * 4,
        twinkle: Math.random() > 0.5,
      })),
    [],
  );

  // Measure the stage so orbits scale to the available space.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animate to an externally-requested focus (clicks elsewhere, cinematic jumps),
  // always taking the shortest equivalent path so we never unwind a full turn.
  useEffect(() => {
    setRotation((prev) => {
      const targetBase = -(focusIndex - 1) * step;
      const k = Math.round((prev - targetBase) / TWO_PI);
      return targetBase + k * TWO_PI;
    });
  }, [focusIndex, step]);

  const snap = useCallback(
    (rot: number) => {
      const p = Math.round(-rot / step);
      const idx = (((p % N) + N) % N) + 1;
      setRotation(-p * step);
      onFocus(idx);
    },
    [N, step, onFocus],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragState.current = { startX: e.clientX, startRot: rotation, moved: false };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 3) d.moved = true;
    setRotation(d.startRot + dx * 0.006);
  };

  const endDrag = () => {
    const d = dragState.current;
    if (!d) return;
    dragState.current = null;
    setDragging(false);
    setRotation((r) => {
      snap(r);
      return r;
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    const delta = (e.deltaY || e.deltaX) * 0.0015;
    setRotation((r) => r + delta);
    if (wheelTimer.current) window.clearTimeout(wheelTimer.current);
    wheelTimer.current = window.setTimeout(() => {
      setRotation((r) => {
        snap(r);
        return r;
      });
    }, 160);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onFocus(Math.max(1, focusIndex - 1));
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onFocus(Math.min(N, focusIndex + 1));
    }
  };

  const cx = size.w / 2;
  const cy = size.h * 0.48;
  const rx = size.w * 0.42; // wider — a more elongated ellipse
  const ry = size.h * 0.16; // flatter — orbit lies back into the distance
  // Scale bodies down on narrow screens so planets don't overwhelm the orbit;
  // capped at 1 so desktop keeps its current sizing.
  const stageScale = Math.max(0.5, Math.min(1, size.w / 760));
  const starSize = 70 * stageScale;
  const transition = dragging || instant ? "none" : "transform 0.6s cubic-bezier(0.22,1,0.36,1), opacity 0.6s";

  return (
    <div
      ref={containerRef}
      className="relative h-[420px] w-full touch-none select-none outline-none md:h-[520px]"
      role="listbox"
      aria-label="Solar system planets"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={onWheel}
      onKeyDown={onKeyDown}
    >
      {/* Deep-space nebula backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 48%, rgba(106,0,255,0.22), transparent 72%), radial-gradient(45% 45% at 72% 28%, rgba(0,191,255,0.16), transparent 70%), radial-gradient(40% 50% at 22% 72%, rgba(255,0,160,0.10), transparent 70%), radial-gradient(35% 35% at 85% 80%, rgba(0,255,213,0.08), transparent 70%)",
        }}
      />

      {/* Starfield */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {stars.map((s, i) => (
          <span
            key={i}
            className={`absolute rounded-full bg-white ${s.twinkle ? "animate-pulse" : ""}`}
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Locked-preview watermark for not-yet-unlocked systems */}
      {preview && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[3000] -translate-x-1/2">
          <span className="flex items-center gap-1.5 rounded-full border border-[#FFD700]/40 bg-[#FFD700]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FFD700] backdrop-blur-sm">
            <Lock className="h-3 w-3" /> Locked Sector
          </span>
        </div>
      )}

      {/* Orbit ring */}
      <div
        className="pointer-events-none absolute rounded-[50%] border border-primary/20"
        style={{
          left: cx - rx,
          top: cy - ry,
          width: rx * 2,
          height: ry * 2,
          boxShadow: "0 0 30px rgba(106,0,255,0.15) inset",
        }}
      />

      {/* Central star */}
      <div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: cx,
          top: cy,
          width: starSize,
          height: starSize,
          background: "radial-gradient(circle, #ffffff, #7be0ff 35%, #6a00ff 70%, transparent 72%)",
          boxShadow: "0 0 60px 18px rgba(0,191,255,0.45), 0 0 120px 40px rgba(106,0,255,0.35)",
        }}
      />

      {/* Planets */}
      {planets.map((p, i) => {
        const theta = (i) * step + rotation;
        const depth = Math.cos(theta); // 1 front -> -1 back
        const t = (depth + 1) / 2; // 0..1
        const x = cx + rx * Math.sin(theta);
        const y = cy + ry * depth;
        const baseSize = (p.isBoss ? 96 : 60) * stageScale;
        const scale = 0.4 + t * 0.85; // stronger near/far contrast for depth
        const zIndex = Math.round((depth + 1) * 1000);
        const opacity = p.state === "locked" ? 0.12 + t * 0.4 : 0.35 + t * 0.6;
        const depthBlur = (1 - t) * 1.8; // distant worlds soften into the haze
        const colors = planetColors(p);
        const isFocused = focusIndex === p.index;

        return (
          <button
            key={p.index}
            type="button"
            role="option"
            aria-selected={isFocused}
            aria-label={`${p.label}, level ${p.level}, ${p.state}`}
            onClick={() => {
              if (!dragState.current?.moved) onFocus(p.index);
            }}
            className="absolute flex items-center justify-center rounded-full focus:outline-none"
            style={{
              left: x,
              top: y,
              width: baseSize,
              height: baseSize,
              marginLeft: -baseSize / 2,
              marginTop: -baseSize / 2,
              zIndex,
              opacity,
              transform: `scale(${scale})`,
              transition,
            }}
          >
            {/* Planet body */}
            <span
              className="relative flex h-full w-full items-center justify-center rounded-full"
              style={{
                background: `radial-gradient(circle at 32% 28%, ${colors.core}, ${colors.mid} 55%, ${colors.edge} 100%)`,
                boxShadow:
                  p.state === "current"
                    ? `0 0 26px 6px rgba(106,0,255,0.6), inset 0 0 14px rgba(255,255,255,0.25)`
                    : p.state === "completed"
                      ? `0 0 18px 3px rgba(0,255,213,0.45), inset 0 0 12px rgba(255,255,255,0.18)`
                      : `inset 0 0 12px rgba(0,0,0,0.5)`,
                filter: `${p.state === "locked" ? "grayscale(0.7) brightness(0.8) " : ""}blur(${depthBlur}px)`,
              }}
            >
              {/* Pulse ring on the current planet */}
              {p.state === "current" && !instant && (
                <span className="absolute inset-0 animate-ping rounded-full border-2 border-accent/60" />
              )}
              {isFocused && (
                <span className="absolute -inset-2 rounded-full border border-accent/70" />
              )}

              {/* State badge */}
              {p.state === "completed" && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground shadow">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              {p.state === "locked" && (
                <Lock className="h-4 w-4 text-white/70" />
              )}
              {p.isBoss && p.state !== "locked" && (
                <Skull className="h-5 w-5 text-white drop-shadow" />
              )}
            </span>

            {/* Label under the focused/front planets only, to keep it clean */}
            {t > 0.7 && (
              <span
                className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-center"
                style={{ transform: `translateX(-50%) scale(${1 / scale})` }}
              >
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-white">
                  {p.label}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {p.state === "locked" ? p.requirement : `Level ${p.level}`}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
