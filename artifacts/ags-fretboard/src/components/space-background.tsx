import { useEffect, useRef } from "react";

// Animated cosmic backdrop: parallax layers of twinkling stars drifting slowly
// downward, with comets streaking across at random intervals. Rendered to a
// single fixed canvas behind all app content. Honors prefers-reduced-motion by
// painting one static frame instead of animating.

interface Star {
  x: number;
  y: number;
  z: number; // depth 0..1 — drives size, speed and brightness
  r: number;
  tw: number; // twinkle speed
  phase: number;
}

interface Comet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  life: number;
  maxLife: number;
}

export default function SpaceBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let comets: Comet[] = [];
    let raf = 0;
    let last = performance.now();
    let nextComet = 1800;

    const mkStar = (): Star => {
      const z = Math.random();
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        z,
        r: z * 1.5 + 0.3,
        tw: 0.6 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
      };
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round((w * h) / 9000);
      const count = Math.min(Math.max(target, 60), 220);
      stars = Array.from({ length: count }, mkStar);
    };

    const spawnComet = () => {
      const fromLeft = Math.random() < 0.5;
      const speed = 0.34 + Math.random() * 0.26; // px per ms
      const angle = 0.18 + Math.random() * 0.22; // gentle downward slope
      const dir = fromLeft ? 1 : -1;
      comets.push({
        x: fromLeft ? -60 : w + 60,
        y: Math.random() * h * 0.55,
        vx: dir * speed * Math.cos(angle),
        vy: speed * Math.sin(angle),
        len: 110 + Math.random() * 140,
        life: 0,
        maxLife: 3800,
      });
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);

      // stars
      for (const s of stars) {
        if (!reduce) {
          s.y += (0.004 + s.z * 0.013) * dt;
          if (s.y > h + 2) {
            s.y = -2;
            s.x = Math.random() * w;
          }
          s.phase += s.tw * dt * 0.001;
        }
        const tw = reduce ? 0.85 : 0.5 + 0.5 * Math.sin(s.phase);
        ctx.globalAlpha = 0.2 + tw * 0.8 * (0.4 + s.z * 0.6);
        ctx.fillStyle = s.z > 0.82 ? "#b7ecff" : "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (reduce) return;

      // comets
      nextComet -= dt;
      if (nextComet <= 0) {
        spawnComet();
        nextComet = 3500 + Math.random() * 6000;
      }
      for (const c of comets) {
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.life += dt;
      }
      comets = comets.filter(
        (c) => c.life < c.maxLife && c.x > -240 && c.x < w + 240 && c.y < h + 240,
      );
      for (const c of comets) {
        const sp = Math.hypot(c.vx, c.vy) || 1;
        const ux = c.vx / sp;
        const uy = c.vy / sp;
        const tailX = c.x - ux * c.len;
        const tailY = c.y - uy * c.len;
        const fade = 1 - c.life / c.maxLife;
        const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,255,255,${0.95 * fade})`);
        grad.addColorStop(0.25, `rgba(150,230,255,${0.5 * fade})`);
        grad.addColorStop(1, "rgba(120,0,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${0.95 * fade})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      draw(dt);
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduce) {
      draw(0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: 0 }}
    />
  );
}
