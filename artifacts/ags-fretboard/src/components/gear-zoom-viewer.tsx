import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

import GearThumb from "@/components/gear-thumb";
import { type GearItem } from "@/data/gear";

interface Props {
  item: GearItem;
  className?: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

interface View {
  scale: number;
  tx: number;
  ty: number;
}

const FIT: View = { scale: 1, tx: 0, ty: 0 };

// An interactive close-up viewer for a piece of gear. Scroll, pinch (two
// fingers), or use the buttons / +- keys to zoom (1x–5x), then drag to pan
// around the artwork. Works for any gear category — pedals are PNG photos, the
// rest are vector SVG, so both stay crisp at any zoom. Double-click toggles
// between fit and a 2.5x close-up centred on the cursor.
//
// The transform uses `transform-origin: center`, so a point's offset from the
// container centre `c` maps to screen offset `tx + scale*c`. Focal-preserving
// zoom solves for the new translate that keeps the point under the cursor fixed:
//   tx' = px - s'*(px - tx)/s   (and likewise for y)
export default function GearZoomViewer({ item, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(FIT);
  const [dragging, setDragging] = useState(false);

  // Active pointers (id → client position), for drag + pinch tracking.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDist = useRef<number | null>(null);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  // Clamp the pan so the artwork can't be dragged completely out of view.
  const clampPan = useCallback((nx: number, ny: number, s: number) => {
    const el = wrapRef.current;
    if (!el) return { x: nx, y: ny };
    const limX = (el.clientWidth * (s - 1)) / 2;
    const limY = (el.clientHeight * (s - 1)) / 2;
    return {
      x: Math.max(-limX, Math.min(limX, nx)),
      y: Math.max(-limY, Math.min(limY, ny)),
    };
  }, []);

  // Core focal-preserving zoom: given the previous view, scale to `s2` while
  // keeping the point at centre-offset (px, py) fixed.
  const zoomView = useCallback(
    (v: View, s2raw: number, px: number, py: number): View => {
      const s2 = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s2raw));
      if (s2 <= 1) return FIT;
      const cx = (px - v.tx) / v.scale;
      const cy = (py - v.ty) / v.scale;
      const next = clampPan(px - s2 * cx, py - s2 * cy, s2);
      return { scale: s2, tx: next.x, ty: next.y };
    },
    [clampPan],
  );

  // Zoom to an absolute scale (buttons / double-click / keyboard).
  const zoomTo = useCallback(
    (nextScale: number, px = 0, py = 0) => {
      setView((v) => zoomView(v, nextScale, px, py));
    },
    [zoomView],
  );

  // Zoom by a multiplicative factor relative to the CURRENT committed scale.
  // Used for wheel/pinch, which can fire many times before React re-renders, so
  // it must read `v.scale` inside the updater rather than a stale render value.
  const zoomBy = useCallback(
    (factor: number, px = 0, py = 0) => {
      setView((v) => zoomView(v, v.scale * factor, px, py));
    },
    [zoomView],
  );

  const reset = useCallback(() => setView(FIT), []);

  // Reset whenever the viewed item changes.
  useEffect(() => {
    reset();
  }, [item.id, reset]);

  // Convert a client point to an offset from the container centre, in px.
  const toCentreOffset = useCallback((clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return { px: 0, py: 0 };
    const rect = el.getBoundingClientRect();
    return {
      px: clientX - rect.left - rect.width / 2,
      py: clientY - rect.top - rect.height / 2,
    };
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const { px, py } = toCentreOffset(e.clientX, e.clientY);
      const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
      zoomBy(factor, px, py);
    },
    [zoomBy, toCentreOffset],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      // Start a pinch: stop any single-pointer drag and seed the distance.
      drag.current = null;
      setDragging(false);
      const [a, b] = [...pointers.current.values()];
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    } else if (pointers.current.size === 1 && view.scale > 1) {
      drag.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
      setDragging(true);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchDist.current != null) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist.current > 0) {
        const factor = dist / pinchDist.current;
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const { px, py } = toCentreOffset(midX, midY);
        zoomBy(factor, px, py);
      }
      pinchDist.current = dist;
      return;
    }

    if (drag.current) {
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      const next = clampPan(drag.current.tx + dx, drag.current.ty + dy, view.scale);
      setView((v) => ({ ...v, tx: next.x, ty: next.y }));
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = null;
    if (pointers.current.size === 0) {
      drag.current = null;
      setDragging(false);
    } else if (pointers.current.size === 1 && view.scale > 1) {
      // One finger lifted from a pinch — resume dragging with the other.
      const [p] = [...pointers.current.values()];
      drag.current = { x: p.x, y: p.y, tx: view.tx, ty: view.ty };
      setDragging(true);
    }
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (view.scale > 1) {
      reset();
      return;
    }
    const { px, py } = toCentreOffset(e.clientX, e.clientY);
    zoomTo(2.5, px, py);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomTo(view.scale * 1.4);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      zoomTo(view.scale / 1.4);
    } else if (e.key === "0") {
      e.preventDefault();
      reset();
    }
  };

  const zoomedIn = view.scale > 1;

  return (
    <div className={className}>
      <div
        ref={wrapRef}
        role="group"
        aria-label={`Close-up of ${item.name}. Scroll or use + and - to zoom, drag to pan.`}
        tabIndex={0}
        className="relative h-full w-full overflow-hidden select-none touch-none outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
        style={{ cursor: zoomedIn ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
      >
        <div
          className="h-full w-full"
          style={{
            transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`,
            transformOrigin: "center center",
            transition: dragging ? "none" : "transform 0.12s ease-out",
          }}
        >
          <GearThumb item={item} className="h-full w-full" />
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => zoomTo(view.scale * 1.4)}
            className="grid h-8 w-8 place-items-center rounded-md border border-white/15 bg-black/50 text-foreground backdrop-blur hover:bg-black/70 disabled:opacity-40"
            disabled={view.scale >= MAX_SCALE}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => zoomTo(view.scale / 1.4)}
            className="grid h-8 w-8 place-items-center rounded-md border border-white/15 bg-black/50 text-foreground backdrop-blur hover:bg-black/70 disabled:opacity-40"
            disabled={!zoomedIn}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={reset}
            className="grid h-8 w-8 place-items-center rounded-md border border-white/15 bg-black/50 text-foreground backdrop-blur hover:bg-black/70 disabled:opacity-40"
            disabled={!zoomedIn}
            aria-label="Reset zoom"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
