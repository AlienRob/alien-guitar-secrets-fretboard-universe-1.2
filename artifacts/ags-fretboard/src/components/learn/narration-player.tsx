import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

interface Props {
  src: string;
  label?: string;
}

function fmt(s: number): string {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// A simple, self-contained narration player for a teaching page. Uses a plain
// HTML5 <audio> element (playback is always user-initiated via the button, so
// the autoplay caveats that push the rest of the app to Web Audio don't apply).
export default function NarrationPlayer({ src, label = "Lesson narration" }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    // Keep narration a touch below full volume so it sits evenly with the note
    // playback and sounds rather than being the loudest thing in the app.
    a.volume = 0.8;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
      a.currentTime = 0;
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  // If the audio source changes (component reused across lessons), reset the
  // visible state so we don't briefly show the previous track's progress.
  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => {});
    else a.pause();
  };

  const seekTo = (value: number) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const clamped = Math.min(duration, Math.max(0, value));
    a.currentTime = clamped;
    setCurrent(clamped);
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-primary/30 bg-card/40 p-4 alien-glow">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause narration" : "Play narration"}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-accent/10 text-accent transition-colors hover:bg-accent/20"
      >
        {playing ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 translate-x-0.5" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
          <Volume2 className="h-4 w-4 text-primary" />
          {label}
        </div>
        {/* Progress + seek. The visible bar is decorative; an overlaid native
            range input provides pointer drag plus full keyboard/screen-reader
            support. focus-within draws a ring since the input itself is
            transparent. */}
        <div className="relative h-2 rounded-full focus-within:ring-2 focus-within:ring-accent/60">
          <div className="absolute inset-0 rounded-full bg-white/10" />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width]"
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(current, duration || 0)}
            onChange={(e) => seekTo(Number(e.target.value))}
            aria-label="Seek narration position"
            aria-valuetext={`${fmt(current)} of ${fmt(duration)}`}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}
