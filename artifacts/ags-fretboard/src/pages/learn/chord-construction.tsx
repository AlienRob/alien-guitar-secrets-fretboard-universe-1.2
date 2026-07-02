import { useEffect } from "react";
import LessonLayout from "@/components/learn/lesson-layout";
import narrationUrl from "@/assets/lessons/chord-construction-narration.mp3";
import StaffChord from "@/components/staff-chord";
import ChordDiagram from "@/components/chord-diagram";
import { spellChord, chordFormula, rotateNotes, INVERSION_NAMES } from "@/lib/musicTheory";
import { getChordDiagram } from "@/lib/chordDiagrams";
import { markChordLessonViewed } from "@/lib/beginnerTrail";
import { useUpdateTrail } from "@workspace/api-client-react";

// A small "chip" used to show an interval-number formula such as 1 - b3 - 5.
function FormulaChips({ labels }: { labels: string[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {labels.map((l, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <span className="rounded-md border border-primary/30 bg-card/60 px-2 py-0.5 font-mono text-sm text-[#FFD700]">
            {l}
          </span>
          {i < labels.length - 1 ? (
            <span className="text-muted-foreground">·</span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

interface TriadRow {
  name: string;
  // Chord key understood by spellChord / the diagram database ("Major",
  // "Minor", "dim", "aug") — distinct from the display name above.
  key: string;
  intervals: number[];
  formula: string[];
  recipe: string;
  notes: string[];
  example: string;
  color: string;
}

// The four triad qualities from Lesson 7.1, each shown with its interval-number
// formula and a worked example built from C. Notes are derived from the library
// so spellings (and the stave) stay correct.
const TRIADS: TriadRow[] = [
  {
    name: "Major",
    key: "Major",
    intervals: [0, 4, 7],
    formula: ["1", "3", "5"],
    recipe: "Root, major 3rd, perfect 5th",
    color: "text-[#FFD700]",
  },
  {
    name: "Minor",
    key: "Minor",
    intervals: [0, 3, 7],
    formula: ["1", "\u266D3", "5"],
    recipe: "Root, minor 3rd, perfect 5th",
    color: "text-[#00BFFF]",
  },
  {
    name: "Diminished",
    key: "dim",
    intervals: [0, 3, 6],
    formula: ["1", "\u266D3", "\u266D5"],
    recipe: "Root, minor 3rd, diminished 5th",
    color: "text-[#FF6B9D]",
  },
  {
    name: "Augmented",
    key: "aug",
    intervals: [0, 4, 8],
    formula: ["1", "3", "\u266F5"],
    recipe: "Root, major 3rd, augmented 5th",
    color: "text-[#00FFD5]",
  },
].map((t) => {
  const notes = spellChord("C", t.key, t.intervals);
  return { ...t, notes, example: notes.join(" - ") };
});

// C major triad voiced in each inversion, so the same three notes can be heard
// rearranged. We derive the notes from the library so spellings stay correct.
const C_MAJOR = spellChord("C", "Major", [0, 4, 7]);
const INVERSIONS = INVERSION_NAMES.map((label, i) => ({
  label,
  notes: rotateNotes(C_MAJOR, i),
  bass: i === 0 ? "the root (1)" : i === 1 ? "the 3rd" : "the 5th",
}));

export default function ChordConstructionLesson() {
  const { mutate: persistTrail } = useUpdateTrail();

  useEffect(() => {
    markChordLessonViewed();
    persistTrail({ data: { chordLessonViewed: true } });
  }, [persistTrail]);

  return (
    <LessonLayout
      kicker="Training · Chords"
      title="Chord Construction & Inversions"
      practiceHref="/practice/chords"
      practiceLabel="Drill this now — Chord Decoder"
      narrationSrc={narrationUrl}
      intro={
        <>
          <p>
            Chords are built by stacking intervals on top of a root note. Once
            you can read a chord as a simple <strong>interval-number formula</strong>{" "}
            &mdash; 1 for the root, 3 for the third, 5 for the fifth, and so on
            &mdash; every chord becomes a recipe you can build anywhere on the
            neck, in any key.
          </p>
          <p>
            We start with the <strong>triad</strong>: a three-note chord made of
            a root, a third and a fifth. Then we&rsquo;ll rearrange those notes
            into <strong>inversions</strong> for smoother, more interesting
            voicings.
          </p>
        </>
      }
    >
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The three roles in a triad
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              n: "1",
              title: "Root",
              body: "The base note that names the chord (C in a C chord).",
            },
            {
              n: "3",
              title: "Third",
              body: "Decides major or minor — the chord's mood lives here.",
            },
            {
              n: "5",
              title: "Fifth",
              body: "Adds stability and weight under the chord.",
            },
          ].map((c) => (
            <div
              key={c.n}
              className="rounded-lg border border-primary/20 bg-card/30 p-4"
            >
              <div className="font-mono text-2xl font-bold text-[#FFD700]">
                {c.n}
              </div>
              <div className="mt-1 font-semibold text-white">{c.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The four triad types
        </h2>
        <p className="text-xs text-muted-foreground">
          Each triad changes the quality of the third and/or the fifth. The
          formula tells you exactly which notes to stack.
        </p>

        <div className="overflow-hidden rounded-lg border border-primary/20 bg-card/30">
          <div className="hidden border-b border-white/8 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-[1fr_1.1fr_1.2fr_0.8fr] sm:gap-3">
            <div>Triad</div>
            <div>Formula</div>
            <div>Recipe</div>
            <div className="text-right">Example (C)</div>
          </div>
          <ul className="divide-y divide-white/8">
            {TRIADS.map((t) => (
              <li
                key={t.name}
                className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[1fr_1.1fr_1.2fr_0.8fr] sm:items-center sm:gap-3"
              >
                <div className={`font-semibold ${t.color}`}>{t.name}</div>
                <div>
                  <FormulaChips labels={t.formula} />
                </div>
                <div className="text-sm text-muted-foreground">{t.recipe}</div>
                <div className="font-mono text-sm text-foreground sm:text-right">
                  {t.example}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="pt-1 text-xs text-muted-foreground">
          On the stave and the fretboard (built from C):
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TRIADS.map((t) => {
            const diagram = getChordDiagram("C", t.key);
            return (
              <div
                key={t.name}
                className="flex flex-col items-center gap-2 rounded-lg border border-primary/20 bg-card/30 p-3"
              >
                <div className={`text-sm font-semibold ${t.color}`}>{t.name}</div>
                <StaffChord notes={t.notes} width={150} height={120} />
                {diagram && (
                  <ChordDiagram position={diagram} root="C" name={`C ${t.name}`} showDegrees />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Building a triad on the fretboard
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          Starting from any root, count frets to find each note:
        </p>
        <ul className="space-y-2 text-base leading-relaxed text-muted-foreground">
          <li>
            <strong className="text-white">The third</strong> — up{" "}
            <strong>4 frets</strong> for a major third, or{" "}
            <strong>3 frets</strong> for a minor third.
          </li>
          <li>
            <strong className="text-white">The fifth</strong> — up{" "}
            <strong>7 frets</strong> for a perfect fifth,{" "}
            <strong>6 frets</strong> for a diminished fifth, or{" "}
            <strong>8 frets</strong> for an augmented fifth.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Beyond triads: sevenths &amp; extensions
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          Keep stacking thirds and the formula keeps growing. Add a 7th to a
          triad to make a seventh chord, then 9ths, 11ths and 13ths for richer
          colours:
        </p>
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-primary/20 bg-card/30 p-4 sm:grid-cols-3">
          {[
            { name: "Cmaj7", key: "maj7", intervals: [0, 4, 7, 11] },
            { name: "C7", key: "7", intervals: [0, 4, 7, 10] },
            { name: "C9", key: "9", intervals: [0, 4, 7, 10, 14] },
          ].map((c) => {
            const diagram = getChordDiagram("C", c.key);
            return (
              <div key={c.name} className="flex flex-col items-center gap-2 text-center">
                <span className="font-mono text-sm font-semibold text-accent">
                  {c.name}
                </span>
                <FormulaChips labels={chordFormula(c.intervals)} />
                <StaffChord notes={spellChord("C", c.key, c.intervals)} width={160} height={120} />
                {diagram && <ChordDiagram position={diagram} root="C" name={c.name} showDegrees />}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Inversions
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          An inversion plays the same notes in a different order, so a note other
          than the root sits at the bottom. Same chord, new voicing &mdash; great
          for smooth transitions between chords.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {INVERSIONS.map((inv) => (
            <div
              key={inv.label}
              className="rounded-lg border border-primary/20 bg-card/30 p-4"
            >
              <div className="text-sm font-semibold text-accent">{inv.label}</div>
              <div className="mt-2 font-mono text-lg text-[#FFD700]">
                {inv.notes.join(" - ")}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Lowest note is {inv.bass}.
              </div>
              <div className="mt-3">
                <StaffChord notes={inv.notes} width={150} height={120} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          All three are still a C major chord (C - E - G) &mdash; only the bass
          note has changed.
        </p>
      </section>
    </LessonLayout>
  );
}
