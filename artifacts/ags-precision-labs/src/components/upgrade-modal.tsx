import { X, Zap } from "lucide-react";

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
}

const FEATURES = [
  "All instruments — bass, ukulele, 7/8/12-string guitar",
  "All alternate tunings — Drop D, Open G, DADGAD and more",
  "Custom A4 reference pitch (430–470 Hz)",
  "All time signatures — 5/4, 7/8, compound and beyond",
  "Per-beat accents and muting",
  "Subdivisions — 8ths, triplets, 16ths",
  "Metronome colour themes",
];

export function UpgradeModal({ visible, onClose, feature }: UpgradeModalProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(0,0,0,0.82)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(160deg,#1a0a2e 0%,#0d0018 100%)", border: "1px solid rgba(185,66,255,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(185,66,255,0.15)" }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <X size={16} color="#aaa" />
          </button>
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2.5" style={{ background: "rgba(185,66,255,0.18)" }}>
              <Zap size={22} color="#b942ff" fill="#b942ff" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest" style={{ color: "#b942ff" }}>PRECISION LABS PREMIUM</p>
              <p className="text-base font-bold text-white mt-0.5">Unlock everything</p>
            </div>
          </div>
          {feature && (
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span style={{ color: "#e0a0ff" }}>{feature}</span> is a Premium feature.
            </p>
          )}
        </div>

        <div className="px-5 py-4 space-y-2.5">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "rgba(185,66,255,0.22)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#b942ff" }} />
              </div>
              <p className="text-sm leading-snug" style={{ color: "rgba(255,255,255,0.75)" }}>{f}</p>
            </div>
          ))}
        </div>

        <div className="px-5 pb-6">
          <button
            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide text-white"
            style={{ background: "linear-gradient(90deg,#7b2ff7,#b942ff)", boxShadow: "0 4px 20px rgba(185,66,255,0.35)" }}
            onClick={onClose}
          >
            Coming soon — stay tuned
          </button>
          <button
            className="w-full mt-2 py-2 text-sm"
            style={{ color: "rgba(255,255,255,0.38)" }}
            onClick={onClose}
          >
            Continue with free
          </button>
        </div>
      </div>
    </div>
  );
}
