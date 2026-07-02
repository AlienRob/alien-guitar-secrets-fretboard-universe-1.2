import { useEffect, useRef } from "react";

// A calm, cinematic deep-space transition. Instead of an arcade-style warp, this
// is a slow drift through a dark starfield with a soft purple/blue/cyan core
// glow. Movement is gentle, flashing is minimal, and there is no audio — the
// goal is something elegant and mysterious that never startles.

const DURATION = 1600; // ms — slow and unhurried

interface Props {
  active: boolean;
  token: number; // changes on each navigation to restart the effect
  onDone: () => void;
}

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
}

export default function WormholeTransition({ active, token, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const cx = () => w / 2;
    const cy = () => h / 2;

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Sparse starfield — kept low-density to avoid visual noise.
    const STAR_COUNT = 220;
    const maxDepth = w;
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => {
      const z = Math.random() * maxDepth;
      return {
        x: (Math.random() - 0.5) * w,
        y: (Math.random() - 0.5) * h,
        z,
        pz: z,
      };
    });

    const start = performance.now();
    // Gentle ease in and out so nothing pops on screen.
    const envelope = (t: number) => {
      if (t < 0.25) return t / 0.25; // fade in
      if (t > 0.7) return Math.max(0, (1 - t) / 0.3); // fade out
      return 1;
    };

    const tint = ["rgba(150,120,255,", "rgba(90,150,255,", "rgba(70,220,220,"];

    const render = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / DURATION);
      const alpha = envelope(t);

      // Dark, near-black backdrop with a faint vignette of cosmic colour.
      ctx.fillStyle = "rgba(3,4,12,1)";
      ctx.fillRect(0, 0, w, h);

      const coreGlow = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), Math.max(w, h) * 0.6);
      coreGlow.addColorStop(0, `rgba(120,90,255,${0.16 * alpha})`);
      coreGlow.addColorStop(0.4, `rgba(40,80,200,${0.08 * alpha})`);
      coreGlow.addColorStop(1, "rgba(3,4,12,0)");
      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, 0, w, h);

      // Soft pulsing core.
      const pulse = 1 + Math.sin(t * Math.PI) * 0.4;
      const core = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), 90 * pulse);
      core.addColorStop(0, `rgba(180,220,255,${0.22 * alpha})`);
      core.addColorStop(0.5, `rgba(0,255,213,${0.10 * alpha})`);
      core.addColorStop(1, "rgba(3,4,12,0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx(), cy(), 90 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Slow speed — gives a sense of depth without rushing.
      const speed = 4.2;
      ctx.lineCap = "round";

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.pz = s.z;
        s.z -= speed;
        if (s.z < 1) {
          s.z = maxDepth;
          s.pz = maxDepth;
          s.x = (Math.random() - 0.5) * w;
          s.y = (Math.random() - 0.5) * h;
        }

        const sx = cx() + (s.x / s.z) * maxDepth;
        const sy = cy() + (s.y / s.z) * maxDepth;
        const px = cx() + (s.x / s.pz) * maxDepth;
        const py = cy() + (s.y / s.pz) * maxDepth;

        if (sx < 0 || sx > w || sy < 0 || sy > h) continue;

        const depth = 1 - s.z / maxDepth; // 0 far -> 1 near
        const size = depth * 1.8 + 0.2;
        const col = tint[i % tint.length];
        const a = (0.15 + depth * 0.6) * alpha;

        ctx.strokeStyle = `${col}${a})`;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }

      if (elapsed >= DURATION) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        onDoneRef.current();
        return;
      }
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.removeEventListener("resize", handleResize);
    };
  }, [active, token]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
