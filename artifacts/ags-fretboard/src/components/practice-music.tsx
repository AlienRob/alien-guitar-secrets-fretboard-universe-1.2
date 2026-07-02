import { useEffect, useState } from "react";
import { Music, VolumeX } from "lucide-react";
import {
  startPracticeMusic,
  stopPracticeMusic,
  isPracticeMusicMuted,
  setPracticeMusicMuted,
} from "@/lib/practiceMusic";

// Floating control that plays the cosmic ambient bed while the player practises.
// Mounted only on practice routes; starts the loop on mount and tears it down on
// unmount so music never bleeds into the rest of the app.
export default function PracticeMusic() {
  const [muted, setMuted] = useState(isPracticeMusicMuted());

  useEffect(() => {
    void startPracticeMusic();
    return () => stopPracticeMusic();
  }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setPracticeMusicMuted(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={muted ? "Turn practice music on" : "Turn practice music off"}
      aria-label={muted ? "Turn practice music on" : "Turn practice music off"}
      aria-pressed={!muted}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-card/80 text-accent transition-colors hover:border-accent/60"
    >
      {muted ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Music className="h-4 w-4 animate-pulse" />
      )}
    </button>
  );
}
