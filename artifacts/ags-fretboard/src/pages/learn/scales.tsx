import { useEffect } from "react";
import LessonLayout from "@/components/learn/lesson-layout";
import { markScaleLessonViewed } from "@/lib/beginnerTrail";
import { useUpdateTrail } from "@workspace/api-client-react";

export default function ScalesLesson() {
  const { mutate: persistTrail } = useUpdateTrail();

  useEffect(() => {
    markScaleLessonViewed();
    persistTrail({ data: { scaleLessonViewed: true } });
  }, [persistTrail]);

  return (
    <LessonLayout
      kicker="Training · Scales"
      title="Scale Shapes & Patterns"
      practiceHref="/practice/scales"
      practiceLabel="Drill this now — Scale Practice"
      intro={
        <>
          <p>
            A scale is a set of notes selected from the twelve available pitches. Every melody,
            every solo, and every chord in Western music comes from a scale. Once you know the
            pattern, you can play it in any key anywhere on the neck.
          </p>
          <p>
            This lesson covers the two systems Rob uses to organise scale shapes on the guitar:
            the <strong>CAGED system</strong> (five overlapping shapes that follow the open chords
            you already know) and <strong>3-NPS</strong> (three notes per string — faster runs,
            cleaner symmetry).
          </p>
        </>
      }
    >
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Why scales matter</h2>
        <p className="text-muted-foreground">
          Knowing a scale means knowing which notes sound good together in a key. That knowledge
          lets you improvise, write melodies, and understand why a chord works — instead of
          guessing or memorising licks by rote.
        </p>
        <p className="text-muted-foreground">
          The goal is not to play scales up and down as an exercise. The goal is to know the
          fretboard so well that the right notes are always under your fingers.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">The Major scale formula</h2>
        <p className="text-muted-foreground">
          All scales are defined by the gaps (intervals) between their notes. The Major scale
          uses this pattern of Whole and Half steps:
        </p>
        <div className="rounded-lg border border-border bg-card/60 px-5 py-4 font-mono text-sm text-[#FFD700]">
          W — W — H — W — W — W — H
        </div>
        <p className="text-muted-foreground">
          Starting on C: C &rarr; D &rarr; E &rarr; F &rarr; G &rarr; A &rarr; B &rarr; C.
          That same formula, starting on any root, gives you the Major scale in that key.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">The Minor Pentatonic</h2>
        <p className="text-muted-foreground">
          The Minor Pentatonic is five notes from the Minor scale &mdash; the five that sound
          best for rock, blues, and country. It is the first scale most guitarists learn because
          it is forgiving: every note works over the backing chord.
        </p>
        <div className="rounded-lg border border-border bg-card/60 px-5 py-4 font-mono text-sm text-[#00FFD5]">
          1 &nbsp;— &nbsp;b3 &nbsp;— &nbsp;4 &nbsp;— &nbsp;5 &nbsp;— &nbsp;b7
        </div>
        <p className="text-muted-foreground">
          In A Minor Pentatonic those are: A &nbsp;— &nbsp;C &nbsp;— &nbsp;D &nbsp;— &nbsp;E &nbsp;— &nbsp;G.
          You can add the b5 (the &ldquo;blue note&rdquo;) between the 4 and 5 to get the full
          Blues scale.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Degree numbers</h2>
        <p className="text-muted-foreground">
          Each note in a scale has a number called its <strong>degree</strong>. The root is 1,
          the next note is 2, and so on up to 7. Flats (<strong>b</strong>) lower a degree by a
          half step; sharps (<strong>#</strong>) raise it.
        </p>
        <p className="text-muted-foreground">
          Degree numbers are how Rob labels every note in the scale drills. When you see
          &ldquo;b3&rdquo; on the fretboard, you know it is the minor third — the note that
          makes a chord or scale sound minor.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">CAGED vs 3-NPS</h2>
        <p className="text-muted-foreground">
          <strong>CAGED</strong> organises the fretboard into five positions that connect from
          nut to body. Each position is anchored to a chord shape you already know (C, A, G, E,
          D). Learn all five and you can play a scale anywhere on the neck without shifting
          position.
        </p>
        <p className="text-muted-foreground">
          <strong>3-NPS</strong> (three notes per string) uses a different layout: exactly three
          notes on every string. This makes scale runs more symmetrical and easier to sequence at
          high speed. It also covers more of the neck in a single position.
        </p>
        <p className="text-muted-foreground">
          The scale drills in Daily Practice let you switch between CAGED and 3-NPS so you can
          build fluency in both systems.
        </p>
      </section>
    </LessonLayout>
  );
}
