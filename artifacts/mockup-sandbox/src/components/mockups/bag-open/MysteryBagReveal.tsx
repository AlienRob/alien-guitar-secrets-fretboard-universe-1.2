import { useEffect, useRef, useState } from "react";

const BASE  = "/__mockup/animations/mystery-bag-reveal";
const TOTAL = 96;
const FPS   = 24;
const W     = 512;
const H     = 768;

function pad(n: number) { return String(n).padStart(4, "0"); }

export interface MysteryBagRevealProps {
  playing: boolean;
  onComplete?: () => void;
  className?: string;
}

// Bloom overlay intensity per frame (0–1)
// Peaks at burst, then STAYS HIGH through the ray frames so they dissolve
// under the glow rather than re-appearing, and only fades once the card is clear.
function bloomAt(f: number): number {
  if (f < 12)  return 0;
  if (f <= 35) return (f - 12) / 23 * 0.55;         // ramp up: 0 → 0.55
  if (f <= 50) return 0.55 + (f - 35) / 15 * 0.45;  // burst: 0.55 → 1.0
  if (f <= 65) return 1.0  - (f - 50) / 15 * 0.2;   // hold strong: 1.0 → 0.8 (rays dissolve under glow)
  if (f <= 87) return 0.8  - (f - 65) / 22 * 0.8;   // slow fade: 0.8 → 0 (card fully revealed)
  return 0;
}

export function MysteryBagReveal({ playing, onComplete, className = "" }: MysteryBagRevealProps) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const imgsRef       = useRef<(HTMLImageElement | null)[]>(Array(TOTAL).fill(null));
  const loadedRef     = useRef<boolean[]>(Array(TOTAL).fill(false));
  const loadCountRef  = useRef(0);
  const hasStarted    = useRef(false);
  const rafRef        = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  const [loadedCount, setLoadedCount] = useState(0);
  const [allLoaded,   setAllLoaded]   = useState(false);
  const [bloom,       setBloom]       = useState(0);   // drives the DOM overlay

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ── Preload frames ──────────────────────────────────────────────────────
  useEffect(() => {
    for (let i = 0; i < TOTAL; i++) {
      const img = new Image();
      const idx = i;
      img.onload = () => {
        imgsRef.current[idx]   = img;
        loadedRef.current[idx] = true;
        loadCountRef.current  += 1;
        setLoadedCount(c => c + 1);
        if (loadCountRef.current >= TOTAL) setAllLoaded(true);
      };
      img.onerror = () => {
        loadCountRef.current += 1;
        setLoadedCount(c => c + 1);
        if (loadCountRef.current >= TOTAL) setAllLoaded(true);
      };
      img.src = `${BASE}/frame_${pad(i)}.png`;
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Draw exactly one frame — single drawImage, nothing else ────────────
  function drawFrame(frameIdx: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imgsRef.current[frameIdx];
    if (!img || !loadedRef.current[frameIdx]) return;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
  }

  // ── Show frame 0 once loaded ────────────────────────────────────────────
  useEffect(() => {
    if (allLoaded && !playing && !hasStarted.current) drawFrame(0);
  }, [allLoaded]);

  // ── Playback ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !allLoaded || hasStarted.current) return;
    hasStarted.current = true;

    let frameIdx  = 0;
    let startTime: number | null = null;

    drawFrame(0);

    function tick(now: number) {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const target  = Math.min(Math.floor((elapsed / 1000) * FPS), TOTAL - 1);

      if (target !== frameIdx) {
        frameIdx = target;
        try { drawFrame(frameIdx); } catch (_) {}
        // Bloom update via React state (batched, non-blocking)
        setBloom(bloomAt(frameIdx));
      }

      if (frameIdx < TOTAL - 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onCompleteRef.current?.();
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, allLoaded]);

  const pct = Math.round((loadedCount / TOTAL) * 100);

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", aspectRatio: "1 / 1.5", background: "transparent" }}
    >
      {/* Canvas: one drawImage per tick, nothing else */}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          imageRendering: "auto",
          // CSS brightness handled by the compositor — zero CPU cost
          filter: "brightness(1.35) saturate(1.25)",
        }}
      />

      {/* Bloom overlay — pure CSS radial gradient, GPU composited */}
      {bloom > 0 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            mixBlendMode: "screen",
            // Wide warm halo
            background: `radial-gradient(
              ellipse 90% 70% at 50% 30%,
              rgba(255,255,200,${bloom.toFixed(3)}) 0%,
              rgba(255,220,100,${(bloom * 0.7).toFixed(3)}) 25%,
              rgba(200,100,255,${(bloom * 0.35).toFixed(3)}) 55%,
              transparent 80%
            )`,
          }}
        />
      )}

      {/* Tight white-hot core at peak brightness */}
      {bloom > 0.4 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            mixBlendMode: "screen",
            background: `radial-gradient(
              ellipse 40% 28% at 50% 30%,
              rgba(255,255,255,${((bloom - 0.4) * 1.6).toFixed(3)}) 0%,
              rgba(255,255,220,${((bloom - 0.4) * 0.7).toFixed(3)}) 40%,
              transparent 100%
            )`,
          }}
        />
      )}

      {/* Loading bar */}
      {!allLoaded && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 10, background: "rgba(5,2,12,0.8)",
        }}>
          <div style={{ width: "60%", height: 4, borderRadius: 2, background: "#2d1b4e", overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              background: "linear-gradient(90deg, #7c3aed, #f59e0b)",
              transition: "width 0.15s ease",
            }} />
          </div>
          <span style={{ color: "#a78bfa", fontSize: 12 }}>{pct}%</span>
        </div>
      )}
    </div>
  );
}
