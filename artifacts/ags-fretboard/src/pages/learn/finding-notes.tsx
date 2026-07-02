import { useEffect } from "react";
import LessonLayout from "@/components/learn/lesson-layout";
import narrationUrl from "@/assets/lessons/finding-notes-narration.mp3";
import { markFindingNotesViewed } from "@/lib/beginnerTrail";
import { useUpdateTrail } from "@workspace/api-client-react";
import formula1 from "@/assets/lessons/finding-notes-formula-1.png";
import formula2 from "@/assets/lessons/finding-notes-formula-2.png";
import formula3 from "@/assets/lessons/finding-notes-formula-3.png";
import formula4 from "@/assets/lessons/finding-notes-formula-4.png";
import formula5 from "@/assets/lessons/finding-notes-formula-5.png";

interface Formula {
  n: number;
  title: string;
  rule: string;
  strings: string;
  diagram: string;
  alt: string;
  body: React.ReactNode;
}

// Rob's "Five Step Formula to Mastering the Fretboard". Each formula maps an
// octave of the same note to a new location, and the diagrams below are taken
// straight from Rob's Lesson 1.1 ("Finding Octaves on the Fretboard").
const FORMULAS: Formula[] = [
  {
    n: 1,
    title: "Octaves on the same string",
    rule: "Up or down 12 frets",
    strings: "Every string",
    diagram: formula1,
    alt: "First Formula diagram: every E note repeats 12 frets along the same string.",
    body: (
      <>
        The first formula has just one step, and it works on every string. The
        same note repeats exactly <strong>twelve frets</strong> higher (or lower)
        on the same string — that's one octave. If you're on the open 6th-string
        E, the next E is at the 12th fret of that same string. This works
        anywhere because the chromatic scale spaces every fret evenly.
      </>
    ),
  },
  {
    n: 2,
    title: "One string across",
    rule: "Up 7 frets, across 1 string",
    strings: "6th, 5th, 4th & 2nd strings",
    diagram: formula2,
    alt: "Second Formula diagram: up seven frets and across one string.",
    body: (
      <>
        To jump to the next string, move <strong>up seven frets and across one
        string</strong>. From the 1st-fret E on the 6th string, go to the 7th
        fret of the 5th string — same note, one octave up. This formula works
        from the <strong>6th, 5th, 4th and 2nd</strong> strings. It does not work
        from the 3rd or 1st strings, because of how the guitar is tuned (that's
        what the next formula fixes).
      </>
    ),
  },
  {
    n: 3,
    title: "Crossing off the 3rd string",
    rule: "Up 8 frets, across 1 string",
    strings: "3rd string only",
    diagram: formula3,
    alt: "Third Formula diagram: up eight frets and across one string from the 3rd string.",
    body: (
      <>
        Here's the one anomaly. The 2nd (B) string is tuned a major third above
        the 3rd (G) string instead of a fourth, so every note shifts up one fret.
        That means from the 3rd string you move <strong>up eight frets and across
        one string</strong>. From the 9th-fret E on the 3rd string, the octave is
        at the 17th fret of the 2nd string. Once you're on the 2nd string you're
        back in step with the second formula.
      </>
    ),
  },
  {
    n: 4,
    title: "Two strings across",
    rule: "Up 2 frets, across 2 strings",
    strings: "6th & 5th strings",
    diagram: formula4,
    alt: "Fourth Formula diagram: up two frets and across two strings.",
    body: (
      <>
        The fourth and fifth formulas jump two strings at once, which drops the
        octave neatly under your hand — perfect for seeing the root inside a chord
        shape. From the 6th and 5th strings, move <strong>up two frets and across
        two strings</strong>. The open 6th-string E becomes the E at the 2nd fret
        of the 4th string.
      </>
    ),
  },
  {
    n: 5,
    title: "Two strings across the 3rd",
    rule: "Up 3 frets, across 2 strings",
    strings: "4th & 3rd strings",
    diagram: formula5,
    alt: "Fifth Formula diagram: up three frets and across two strings, crossing the 3rd string.",
    body: (
      <>
        The final formula crosses that 3rd-string gap again, so it needs one
        extra fret: <strong>up three frets and across two strings</strong>. From
        the 2nd-fret E on the 4th string you land on the 5th-fret E of the 2nd
        string. And that's it — five formulas that locate any note's octave
        anywhere on the neck.
      </>
    ),
  },
];

export default function FindingNotesLesson() {
  const { mutate: persistTrail } = useUpdateTrail();

  useEffect(() => {
    markFindingNotesViewed();
    persistTrail({ data: { findingNotesViewed: true } });
  }, [persistTrail]);

  return (
    <LessonLayout
      kicker="Training · Fretboard"
      title="Finding the Notes: The Five Formulas"
      practiceHref="/practice/fretboard"
      practiceLabel="Drill this now — Note Finding"
      narrationSrc={narrationUrl}
      intro={
        <>
          <p>
            Knowing where every note lives on the neck is the foundation of real
            fretboard freedom. Most guitarists guess — but you don't have to.
            Rob's system breaks the whole fretboard down into{" "}
            <strong>five simple octave formulas</strong>. Memorise these and you
            can find any note, anywhere, without the guesswork.
          </p>
          <p>
            The idea is octaves: the same note repeats in many places across the
            strings. Each formula is a little "shape" that takes you from a note
            to its next octave. Two facts make them tick — every fret is one{" "}
            <strong>semitone</strong>, and the guitar is tuned in fourths{" "}
            <em>except</em> the 2nd (B) string, which sits a major third above the
            3rd (G) string. That single quirk is why a couple of the formulas need
            an extra fret.
          </p>
        </>
      }
    >
      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            The five formulas
          </h2>
          <p className="text-xs text-muted-foreground">
            Each diagram traces the octaves of the same note (here, E) across the
            whole neck. Work through them one at a time on your own guitar.
          </p>
        </div>

        <div className="space-y-5">
          {FORMULAS.map((f) => (
            <article
              key={f.n}
              className="overflow-hidden rounded-lg border border-primary/20 bg-card/30"
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-white/8 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-accent/10 font-mono text-sm font-bold text-accent">
                  {f.n}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white">{f.title}</h3>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {f.strings}
                  </div>
                </div>
                <span className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs font-medium text-[#00FFD5]">
                  {f.rule}
                </span>
              </div>

              <div className="space-y-3 p-4">
                <div className="rounded-md bg-white p-2 shadow-inner">
                  <img
                    src={f.diagram}
                    alt={f.alt}
                    loading="lazy"
                    className="mx-auto w-full max-w-2xl"
                  />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-lg border border-white/8 bg-card/30 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Quick recap
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="font-mono text-[#00FFD5]">1.</span> Same string —
              up or down 12 frets.
            </li>
            <li>
              <span className="font-mono text-[#00FFD5]">2.</span> Strings 6, 5, 4
              &amp; 2 — up 7 frets, across 1 string.
            </li>
            <li>
              <span className="font-mono text-[#00FFD5]">3.</span> From the 3rd
              string — up 8 frets, across 1 string.
            </li>
            <li>
              <span className="font-mono text-[#00FFD5]">4.</span> Strings 6 &amp;
              5 — up 2 frets, across 2 strings.
            </li>
            <li>
              <span className="font-mono text-[#00FFD5]">5.</span> Strings 4 &amp;
              3 — up 3 frets, across 2 strings.
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Spend five minutes at the start of each practice session finding one
            note's octaves all over the neck. Pick a different note each day, and
            within a few weeks the whole fretboard lights up. Diagrams ©{" "}
            Alien Guitar Secrets.
          </p>
        </div>
      </section>
    </LessonLayout>
  );
}
