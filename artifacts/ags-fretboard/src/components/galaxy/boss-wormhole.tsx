import { prefersReducedMotion } from "@/lib/cinematicMode";

// A decorative wormhole: concentric rings rushing inward with a bright core.
// Pure CSS so it needs no extra deps; collapses to a calm static glow when the
// OS "reduce motion" setting is on. Shown on the boss victory screen as the
// gateway to the next solar system.
export default function BossWormhole({ size = 200 }: { size?: number }) {
  const reduced = prefersReducedMotion();
  const rings = [0, 1, 2, 3, 4];

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.9) 0%, rgba(99,102,241,0.5) 35%, rgba(0,0,0,0) 70%)",
          filter: "blur(2px)",
        }}
      />
      {rings.map((i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            inset: `${i * (size / 12)}px`,
            borderColor:
              i % 2 === 0 ? "rgba(0,255,213,0.55)" : "rgba(168,85,247,0.55)",
            borderWidth: 2,
            animation: reduced
              ? undefined
              : `boss-wormhole-spin ${4 + i}s linear infinite${
                  i % 2 === 0 ? "" : " reverse"
                }`,
            boxShadow: "0 0 12px rgba(99,102,241,0.4)",
          }}
        />
      ))}
      <div
        className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{
          boxShadow:
            "0 0 30px 12px rgba(0,255,213,0.8), 0 0 60px 24px rgba(168,85,247,0.6)",
          animation: reduced ? undefined : "boss-wormhole-pulse 1.6s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes boss-wormhole-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes boss-wormhole-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
