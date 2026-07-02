import { useRef, useState, useCallback, useEffect } from "react";

const VIEWS = [
  { src: "/__mockup/images/wah-front-cut.png", label: "Front" },
  { src: "/__mockup/images/wah-hero-cut.png", label: "Angle" },
  { src: "/__mockup/images/wah-side-cut.png", label: "Side" },
];

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export function SpinViewer() {
  const [view, setView] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const stage = useRef<HTMLDivElement>(null);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = stage.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py * 8, y: px * 11 });
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    setZoom((z) => clamp(z - e.deltaY * 0.0015, 0.7, 2.4));
  }, []);

  // idle breathing float
  const [float, setFloat] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      setFloat(Math.sin(t / 1400) * 6);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center select-none"
      style={{
        background: "radial-gradient(circle at 50% 35%, #1a1640 0%, #0d0a26 45%, #050416 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#e7e4ff",
        touchAction: "none",
      }}
    >
      <p style={{ letterSpacing: "0.25em", fontSize: 11, textTransform: "uppercase", color: "#8b86c9", marginBottom: 6 }}>
        Product views
      </p>
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 18 }}>AGS Cosmic Wah</h2>

      <div
        ref={stage}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        onWheel={onWheel}
        style={{ position: "relative", width: 340, height: 380, perspective: "1100px" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `translateY(${float}px) scale(${zoom}) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: "transform 0.2s ease-out",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 30,
              width: 220,
              height: 38,
              transform: "translateX(-50%)",
              background: "radial-gradient(ellipse, rgba(124,108,255,0.45) 0%, rgba(124,108,255,0) 70%)",
              filter: "blur(4px)",
            }}
          />
          {VIEWS.map((v, i) => (
            <img
              key={v.label}
              src={v.src}
              alt={v.label}
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                opacity: i === view ? 1 : 0,
                transition: "opacity 0.18s ease-out",
                filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.6))",
                pointerEvents: "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* view selector — tap to snap */}
      <div style={{ display: "flex", gap: 8, marginTop: 10, background: "rgba(255,255,255,0.05)", padding: 5, borderRadius: 12 }}>
        {VIEWS.map((v, i) => (
          <button
            key={v.label}
            onClick={() => setView(i)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: i === view ? "#0d0a26" : "#b7b1e8",
              background: i === view ? "#c9c2ff" : "transparent",
              transition: "all 0.15s ease-out",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "#7b76b0", marginTop: 20, textAlign: "center" }}>
        Tap a view to switch · scroll to zoom
      </p>
    </div>
  );
}
