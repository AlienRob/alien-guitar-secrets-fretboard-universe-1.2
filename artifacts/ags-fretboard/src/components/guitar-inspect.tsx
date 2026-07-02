import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface Props {
  src: string;
  alt: string;
  handed?: "right" | "left";
  className?: string;
}

const MAX_TILT_Y = 20; // left/right turn, in degrees
const MAX_TILT_X = 12; // up/down nod, in degrees
const MIN_SCALE = 1;
const MAX_SCALE = 3;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Photo "inspect" view: drag to tilt the instrument within a limited range and
// zoom in to admire the detail. Deliberately NOT a full 360 turntable — these are
// flat studio photos, so we give a tasteful parallax tilt instead of spinning.
export default function GuitarInspect({ src, alt, handed = "right", className }: Props) {
  const [scale, setScale] = useState(1);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Wheel zoom via a non-passive native listener so we can preventDefault and stop
  // the modal/page behind from scrolling while the user zooms the photo.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onNativeWheel = (e: globalThis.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setScale((s) => clamp(Number((s + delta).toFixed(2)), MIN_SCALE, MAX_SCALE));
    };
    el.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => el.removeEventListener("wheel", onNativeWheel);
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY };
    setDragging(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    drag.current = { px: e.clientX, py: e.clientY };
    if (scale > 1) {
      const range = 140 * (scale - 1);
      setPan((p) => ({
        x: clamp(p.x + dx, -range, range),
        y: clamp(p.y + dy, -range, range),
      }));
    } else {
      setTilt((t) => ({
        y: clamp(t.y + dx * 0.4, -MAX_TILT_Y, MAX_TILT_Y),
        x: clamp(t.x - dy * 0.4, -MAX_TILT_X, MAX_TILT_X),
      }));
    }
  };

  const onPointerUp = () => {
    drag.current = null;
    setDragging(false);
  };

  const zoomBy = (delta: number) =>
    setScale((s) => clamp(Number((s + delta).toFixed(2)), MIN_SCALE, MAX_SCALE));

  const reset = () => {
    setScale(1);
    setTilt({ x: 0, y: 0 });
    setPan({ x: 0, y: 0 });
  };

  const flip = handed === "left" ? -1 : 1;

  return (
    <div className={className} style={{ position: "relative", overflow: "hidden" }}>
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => (scale > 1 ? reset() : setScale(2))}
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: 1000,
          touchAction: "none",
          cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "ew-resize",
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            maxHeight: "100%",
            maxWidth: "100%",
            objectFit: "contain",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale}) rotateX(${tilt.x}deg) rotateY(${tilt.y * flip}deg) scaleX(${flip})`,
            transition: dragging ? "none" : "transform 0.2s ease-out",
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-between px-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Drag to inspect · scroll to zoom
        </span>
        <div className="pointer-events-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => zoomBy(0.25)}
            disabled={scale >= MAX_SCALE}
            aria-label="Zoom in"
            className="rounded-full border border-white/25 bg-black/55 p-1.5 text-foreground backdrop-blur transition-colors hover:border-accent/70 hover:text-accent disabled:opacity-40"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => zoomBy(-0.25)}
            disabled={scale <= MIN_SCALE}
            aria-label="Zoom out"
            className="rounded-full border border-white/25 bg-black/55 p-1.5 text-foreground backdrop-blur transition-colors hover:border-accent/70 hover:text-accent disabled:opacity-40"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Reset view"
            className="rounded-full border border-white/25 bg-black/55 p-1.5 text-foreground backdrop-blur transition-colors hover:border-accent/70 hover:text-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
