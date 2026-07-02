import { useEffect, useState } from "react";
import { Play, Music2 } from "lucide-react";
import { INTERVALS } from "@/lib/musicTheory";
import { playInterval } from "@/lib/audio";
import LessonLayout from "@/components/learn/lesson-layout";
import narrationUrl from "@/assets/lessons/intervals-narration.mp3";
import { markIntervalsViewed } from "@/lib/beginnerTrail";
import { useUpdateTrail } from "@workspace/api-client-react";

// We demonstrate every interval from a common root so the ear can compare them
// directly. C4 (middle C) is MIDI 60 and sits comfortably in the sample range.
const ROOT_MIDI = 60;

interface Row {
  name: keyof typeof INTERVALS;
  quality: string;
  character: string;
  hook: string;
}

// Character and "memory hook" songs are classic ear-training references that
// pair with Rob's "Demystifying Musical Intervals" lesson.
const ROWS: Row[] = [
  { name: "Minor 2nd", quality: "Minor", character: "Tense, unsettling", hook: "Jaws theme" },
  { name: "Major 2nd", quality: "Major", character: "Bright, stepping", hook: "Happy Birthday (first two notes)" },
  { name: "Minor 3rd", quality: "Minor", character: "Sad, soulful", hook: "Smoke on the Water" },
  { name: "Major 3rd", quality: "Major", character: "Happy, warm", hook: "When the Saints Go Marching In" },
  { name: "Perfect 4th", quality: "Perfect", character: "Strong, stable", hook: "Here Comes the Bride" },
  { name: "Tritone", quality: "Augmented / diminished", character: "Restless, edgy", hook: "The Simpsons theme" },
  { name: "Perfect 5th", quality: "Perfect", character: "Open, powerful (the power chord)", hook: "Twinkle Twinkle Little Star" },
  { name: "Minor 6th", quality: "Minor", character: "Bittersweet, longing", hook: "The Entertainer" },
  { name: "Major 6th", quality: "Major", character: "Sweet, lifting", hook: "My Bonnie Lies Over the Ocean" },
  { name: "Minor 7th", quality: "Minor", character: "Bluesy, tense", hook: "Star Trek (original theme)" },
  { name: "Major 7th", quality: "Major", character: "Dreamy, yearning", hook: "Take On Me (chorus leap)" },
  { name: "Octave", quality: "Perfect", character: "The same note, higher — full and resolved", hook: "Somewhere Over the Rainbow" },
];

const QUALITY_COLOR: Record<string, string> = {
  Perfect: "text-[#00FFD5]",
  Major: "text-[#FFD700]",
  Minor: "text-[#00BFFF]",
  "Augmented / diminished": "text-[#FF6B9D]",
};

export default function IntervalsLesson() {
  const { mutate: persistTrail } = useUpdateTrail();

  useEffect(() => {
    markIntervalsViewed();
    persistTrail({ data: { intervalsViewed: true } });
  }, [persistTrail]);

  // Tracks which row is currently sounding so we can show a subtle active state.
  const [playing, setPlaying] = useState<string | null>(null);

  const play = async (name: keyof typeof INTERVALS, harmonic: boolean) => {
    const key = `${name}-${harmonic ? "h" : "m"}`;
    setPlaying(key);
    try {
      await playInterval(ROOT_MIDI, INTERVALS[name], harmonic);
    } finally {
      setPlaying((p) => (p === key ? null : p));
    }
  };

  return (
    <LessonLayout
      kicker="Training · Intervals"
      title="Demystifying Musical Intervals"
      practiceHref="/practice/intervals"
      practiceLabel="Drill this now — Interval Training"
      narrationSrc={narrationUrl}
      intro={
        <>
          <p>
            An interval is simply the distance between two notes — and intervals
            are the building blocks of every chord, scale and melody you'll ever
            play. Master them and the whole fretboard begins to make sense.
          </p>
          <p>
            We measure that distance in <strong>semitones</strong> — one fret on
            the guitar equals one semitone (a half step). Twelve semitones make
            an <strong>octave</strong>, where the note repeats higher up.
          </p>
          <p>
            Each interval also has a <strong>name</strong> based on how many
            letter names it spans, and a <strong>quality</strong> — perfect,
            major or minor. Perfect intervals (the unison, 4th, 5th and octave)
            sound stable and open. Major intervals are always one semitone wider
            than their minor counterparts. Most importantly, each interval has
            its own colour and feeling — tap the buttons below to train your ear
            to recognise them.
          </p>
        </>
      }
    >
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Interval reference table
        </h2>
        <p className="text-xs text-muted-foreground">
          Every example plays from the same starting note so you can compare them.
          &ldquo;Hear it&rdquo; plays the two notes one after another (melodic);
          &ldquo;Together&rdquo; plays them at the same time (harmonic).
        </p>

        <div className="overflow-hidden rounded-lg border border-primary/20 bg-card/30">
          {/* Header row (hidden on small screens, where cards stack) */}
          <div className="hidden border-b border-white/8 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-[1.4fr_0.6fr_1.4fr_auto] sm:gap-3">
            <div>Interval</div>
            <div className="text-center">Semitones</div>
            <div>Sound &amp; memory hook</div>
            <div className="text-right">Listen</div>
          </div>

          <ul className="divide-y divide-white/8">
            {ROWS.map((row) => {
              const melodicActive = playing === `${row.name}-m`;
              const harmonicActive = playing === `${row.name}-h`;
              return (
                <li
                  key={row.name}
                  className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[1.4fr_0.6fr_1.4fr_auto] sm:items-center sm:gap-3"
                >
                  <div>
                    <div className="font-semibold text-white">{row.name}</div>
                    <div
                      className={`text-[11px] font-medium uppercase tracking-wide ${
                        QUALITY_COLOR[row.quality] ?? "text-muted-foreground"
                      }`}
                    >
                      {row.quality}
                    </div>
                  </div>

                  <div className="font-mono text-sm text-muted-foreground sm:text-center">
                    <span className="sm:hidden">Semitones: </span>
                    {INTERVALS[row.name]}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <span className="text-foreground">{row.character}.</span>{" "}
                    <span className="italic">{row.hook}</span>
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => play(row.name, false)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        melodicActive
                          ? "border-accent bg-accent/20 text-accent"
                          : "border-primary/30 bg-card/50 text-foreground hover:border-primary hover:bg-primary/10"
                      }`}
                    >
                      <Play className="h-3.5 w-3.5" /> Hear it
                    </button>
                    <button
                      type="button"
                      onClick={() => play(row.name, true)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        harmonicActive
                          ? "border-accent bg-accent/20 text-accent"
                          : "border-primary/30 bg-card/50 text-foreground hover:border-primary hover:bg-primary/10"
                      }`}
                    >
                      <Music2 className="h-3.5 w-3.5" /> Together
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </LessonLayout>
  );
}
