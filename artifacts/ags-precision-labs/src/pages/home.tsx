import { useLocation } from "wouter";

const BG = "linear-gradient(160deg,#0a001a 0%,#020006 60%,#060010 100%)";
const PURPLE = "#b942ff";
const DIM = "rgba(255,255,255,0.45)";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10" style={{ background: BG }}>
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-xs font-bold tracking-[0.25em]" style={{ color: PURPLE }}>
            ALIEN GUITAR SECRETS
          </p>
          <h1 className="text-3xl font-black tracking-tight text-white">
            PRECISION LABS
          </h1>
          <p className="text-sm mt-1" style={{ color: DIM }}>
            Tuner &amp; Metronome for guitar players
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => navigate("/tuner")}
            className="w-full rounded-2xl p-6 flex flex-col items-start gap-3 text-left transition-transform active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#1a0a2e,#0d0018)", border: "1px solid rgba(185,66,255,0.25)" }}
          >
            <div className="rounded-xl p-3" style={{ background: "rgba(185,66,255,0.15)" }}>
              <TunerIcon />
            </div>
            <div>
              <p className="text-lg font-bold text-white tracking-wide">TUNER</p>
              <p className="text-sm mt-0.5" style={{ color: DIM }}>
                Chromatic guitar tuner with mic detection
              </p>
            </div>
            <ChevronRight />
          </button>

          <button
            onClick={() => navigate("/metronome")}
            className="w-full rounded-2xl p-6 flex flex-col items-start gap-3 text-left transition-transform active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#001a1a,#00060d)", border: "1px solid rgba(0,210,210,0.2)" }}
          >
            <div className="rounded-xl p-3" style={{ background: "rgba(0,210,210,0.1)" }}>
              <MetronomeIcon />
            </div>
            <div>
              <p className="text-lg font-bold text-white tracking-wide">METRONOME</p>
              <p className="text-sm mt-0.5" style={{ color: DIM }}>
                Precision click with tap tempo &amp; accents
              </p>
            </div>
            <ChevronRight />
          </button>
        </div>

        <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
          Free tier · Premium coming soon
        </p>
      </div>
    </div>
  );
}

function TunerIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="10" stroke="#b942ff" strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="13" cy="13" r="6"  stroke="#b942ff" strokeWidth="1.5" />
      <line x1="13" y1="7" x2="13" y2="13" stroke="#b942ff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="13" cy="13" r="1.5" fill="#b942ff" />
    </svg>
  );
}

function MetronomeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <polygon points="13,3 21,23 5,23" stroke="#00d2d2" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <line x1="13" y1="14" x2="18" y2="8" stroke="#00d2d2" strokeWidth="2" strokeLinecap="round" />
      <circle cx="13" cy="14" r="1.5" fill="#00d2d2" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="absolute right-5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: "static", transform: "none" }}>
      <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
