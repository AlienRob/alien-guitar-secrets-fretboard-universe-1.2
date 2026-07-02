import { useEffect, useRef, useState } from "react";

const TOTAL = 48;
const FPS   = 24;
const BASE  = "/__mockup/bag-frames";

function pad(n: number) { return String(n).padStart(4, "0"); }

export function BagAnimation() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const imgsRef     = useRef<(HTMLImageElement | null)[]>(Array(TOTAL).fill(null));
  const loadedRef   = useRef<boolean[]>(Array(TOTAL).fill(false));
  const [frame,     setFrame]     = useState(0);
  const [playing,   setPlaying]   = useState(false);
  const [firstReady, setFirstReady] = useState(false);
  const rafRef      = useRef<number | null>(null);
  const startRef    = useRef<number>(0);
  const frameRef    = useRef(0); // shadow for rAF closure

  // Load all frames; mark frame 0 ready as soon as it arrives
  useEffect(() => {
    for (let i = 0; i < TOTAL; i++) {
      const img = new Image();
      img.src = `${BASE}/frame_${pad(i)}.png`;
      const idx = i;
      img.onload = () => {
        imgsRef.current[idx] = img;
        loadedRef.current[idx] = true;
        if (idx === 0) setFirstReady(true);
      };
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // Paint current frame to canvas
  useEffect(() => {
    if (!firstReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imgsRef.current[frame];
    if (img && loadedRef.current[frame]) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }, [frame, firstReady]);

  function play() {
    if (playing) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    frameRef.current = 0;
    setFrame(0);
    setPlaying(true);
    startRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const target = Math.min(Math.floor((elapsed / 1000) * FPS), TOTAL - 1);

      // Advance frame if loaded, otherwise hold
      if (loadedRef.current[target]) {
        frameRef.current = target;
        setFrame(target);
      }

      if (target < TOTAL - 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function reset() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    frameRef.current = 0;
    setFrame(0);
  }

  const loadedCount = loadedRef.current.filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#08050f] select-none">
      <div style={{ width: 300, height: 374, position: "relative" }}>
        {firstReady ? (
          <canvas
            ref={canvasRef}
            width={1122}
            height={1402}
            style={{ width: 300, height: 374, display: "block" }}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-purple-400 text-sm">
            Loading…
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={play}
          disabled={!firstReady || playing}
          className="px-6 py-2 rounded-full bg-purple-700 text-white font-semibold disabled:opacity-40 hover:bg-purple-600 transition"
        >
          {playing ? "Playing…" : "Play"}
        </button>
        <button
          onClick={reset}
          disabled={!firstReady}
          className="px-6 py-2 rounded-full bg-purple-900 text-purple-200 font-semibold disabled:opacity-40 hover:bg-purple-800 transition"
        >
          Reset
        </button>
      </div>

      <div className="mt-2 text-purple-500 text-xs">
        {firstReady
          ? `Frame ${frame + 1}/${TOTAL} · ${loadedCount}/${TOTAL} buffered`
          : "Fetching frames…"}
      </div>
    </div>
  );
}
