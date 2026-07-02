import emblem from "./emblem.png";

const STARS = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  const size = 1 + Math.round(r(1) * 2);
  return {
    left: `${(r(2) * 100).toFixed(2)}%`,
    top: `${(r(3) * 100).toFixed(2)}%`,
    size: `${size}px`,
    opacity: 0.25 + r(4) * 0.7,
  };
});

export default function Hero() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#05030f]">
      {/* Galaxy */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="absolute h-[160vmax] w-[160vmax] rounded-full opacity-70"
          style={{
            background:
              "conic-gradient(from 20deg, rgba(106,0,255,0) 0deg, rgba(106,0,255,0.35) 60deg, rgba(0,229,255,0.28) 140deg, rgba(106,0,255,0) 220deg, rgba(168,85,247,0.32) 300deg, rgba(106,0,255,0) 360deg)",
            maskImage:
              "radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0) 70%)",
            WebkitMaskImage:
              "radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0) 70%)",
          }}
        />
        <div
          className="absolute h-[120vmax] w-[120vmax] rounded-full opacity-60"
          style={{
            background:
              "conic-gradient(from 130deg, rgba(0,229,255,0) 0deg, rgba(0,229,255,0.3) 80deg, rgba(106,0,255,0) 180deg, rgba(168,85,247,0.3) 280deg, rgba(0,229,255,0) 360deg)",
            maskImage:
              "radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0) 65%)",
            WebkitMaskImage:
              "radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0) 65%)",
          }}
        />
        {/* Galactic core glow */}
        <div className="absolute h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),rgba(168,85,247,0.5)_30%,rgba(106,0,255,0)_70%)] blur-2xl" />
      </div>

      {/* Starfield */}
      <div className="pointer-events-none absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="relative z-10 flex h-full items-center justify-center px-6">
        <img
          src={emblem}
          alt="Alien Guitar Secrets"
          className="h-[78vh] max-h-[680px] w-auto object-contain drop-shadow-[0_0_55px_rgba(106,0,255,0.6)]"
        />
      </div>
    </div>
  );
}
