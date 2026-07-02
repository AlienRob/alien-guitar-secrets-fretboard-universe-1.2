import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";

const ACCENT  = "#a78bfa";
const GOLD    = "#FFD700";
const TEAL    = "#00FFD5";

interface Step {
  n: number;
  title: string;
  summary: string;
  points?: string[];
  tip?: string;
  challenge?: string;
  tryThis?: string;
}

const STEPS: Step[] = [
  {
    n: 1,
    title: "Consistency is Key",
    summary:
      "Practising scales regularly is the foundation of mastery. Even 10–15 minutes a day can lead to noticeable improvement. Consistency builds muscle memory, strengthens finger independence, and deepens your connection to the fretboard.",
    tip: "Create a daily practice routine and stick to it. A short daily session always beats a long weekly one.",
  },
  {
    n: 2,
    title: "Use a Metronome",
    summary:
      "A metronome is your best friend for building timing and precision. Start at a slow tempo, focusing on clean, even notes. As you gain confidence, increase the speed gradually.",
    challenge:
      "Try playing at extremely slow tempos to refine control, then progressively speed up. Real control at 40 BPM is worth more than sloppiness at 120 BPM.",
  },
  {
    n: 3,
    title: "The Benefit of Free Time (No Metronome)",
    summary:
      "While a metronome is essential, practising without one allows you to explore the musicality of scales. Without the click dictating your rhythm, you can focus on phrasing, flow, and expression.",
    tryThis:
      "Improvise freely using the scale, letting your ear guide you. Notice where phrases want to breathe. This is how scales become music rather than exercises.",
  },
  {
    n: 4,
    title: "Explore Different Positions",
    summary:
      "Don't limit yourself to one scale position. Explore the same scale in multiple positions along the neck to expand your fretboard knowledge and break out of box shapes.",
    points: [
      "Play the scale in open, middle, and high positions.",
      "Connect these positions with smooth transitions — no jumping, no gaps.",
    ],
  },
  {
    n: 5,
    title: "Use Different Scale Patterns",
    summary:
      "One scale can be approached in many ways — three notes per string, CAGED system shapes, or intervallic approaches. Switching patterns improves versatility and challenges your brain.",
    tip: "Combine patterns to traverse the fretboard more dynamically. A scale is a vocabulary; the patterns are different ways to speak it.",
  },
  {
    n: 6,
    title: "Practise in Different Keys",
    summary:
      "It is easy to get stuck in familiar keys. Break out of this rut by practising the scale in every key. This builds adaptability and prepares you for any musical scenario.",
    challenge:
      "Cycle through keys using the circle of fifths. If you can play a scale in all twelve keys fluently, you truly know that scale.",
  },
  {
    n: 7,
    title: "Play with Your Eyes Open — Help Open Your Ears",
    summary:
      "We often rely too much on visual cues. Practising scales while focusing on the sound — not the fretboard — trains your ear to recognise scale tones and builds the ear-to-finger connection.",
    tip: "Hum along as you play to reinforce the connection between your fingers and your ears. If you can sing it, you can play it.",
  },
  {
    n: 8,
    title: "Use Different Sequences and Patterns",
    summary:
      "Scales are more than straight runs. Experimenting with sequences makes practice more engaging and mimics real-world playing — nobody solos by playing every note in order from bottom to top.",
    points: [
      "Thirds: C–E, D–F, E–G (skipping every other note).",
      "Ascend three, descend one: C–D–E, D–C–B, etc.",
      "Ascend using the arpeggios of the chords in the key: Cmaj, Dmin, Emin…",
    ],
  },
  {
    n: 9,
    title: "Add Dynamics and Expression",
    summary:
      "Scales become robotic if played without emotion. Incorporating dynamics (soft to loud) and expressive techniques — slides, bends, vibrato — transforms an exercise into music.",
    points: [
      "Play a phrase straight, with no dynamics or expression.",
      "Then repeat it with bends, slides, or vibrato added to specific notes.",
      "Explore the difference between staccato (short, separated) and legato (smooth, flowing) phrasing.",
    ],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function CalloutBox({
  label,
  color,
  text,
}: {
  label: string;
  color: string;
  text: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.callout, { borderColor: color + "55", backgroundColor: color + "0d" }]}>
      <Text style={[styles.calloutLabel, { color }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.calloutText, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
  );
}

function StepCard({ step }: { step: Step }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={[styles.cardHead, { borderBottomColor: colors.border }]}>
        <View style={[styles.numBadge, { borderColor: ACCENT, backgroundColor: ACCENT + "18" }]}>
          <Text style={[styles.numText, { color: ACCENT }]}>{step.n}</Text>
        </View>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.summary, { color: colors.mutedForeground }]}>{step.summary}</Text>

        {step.points && step.points.length > 0 && (
          <View style={{ gap: 8, marginTop: 10 }}>
            {step.points.map((p, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: TEAL }]} />
                <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        {step.tip && (
          <CalloutBox label="Tip" color={TEAL} text={step.tip} />
        )}
        {step.challenge && (
          <CalloutBox label="Challenge" color={GOLD} text={step.challenge} />
        )}
        {step.tryThis && (
          <CalloutBox label="Try this" color={ACCENT} text={step.tryThis} />
        )}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HowToPracticeScalesLesson() {
  const { markLessonViewed } = useBeginnerTrail();

  useEffect(() => {
    markLessonViewed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LessonLayout
      kicker="Scales · Practice Guide"
      title="How to Practise Scales"
      practiceHref="/drill/scales"
      practiceLabel="Drill this now — Scale Practice"
      intro={[
        "Knowing a scale shape is one thing. Owning it — so it flows freely in any key, any position, at any tempo — is another. These nine strategies, from Rob's own teaching method, will take you from mechanical repetition to genuine fretboard fluency.",
        "Work through one strategy per session before combining them. Each one addresses a different dimension of scale mastery.",
      ]}
    >
      <View style={{ gap: 16 }}>
        {STEPS.map((step) => (
          <StepCard key={step.n} step={step} />
        ))}
      </View>

      <View style={[styles.closing, { borderColor: ACCENT + "55", backgroundColor: ACCENT + "08", borderRadius: 10 }]}>
        <Text style={[styles.closingHeading, { color: ACCENT }]}>The bigger picture</Text>
        <Text style={[styles.closingText, { color: "#a0aec0" }]}>
          Scales are not the destination — they are the map. Every technique, solo, and chord progression you will ever play is drawn from these same notes. The time you invest here pays off in every other area of your playing.
        </Text>
      </View>
    </LessonLayout>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: "hidden" },
  cardHead: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 12, padding: 14, borderBottomWidth: 1,
  },
  numBadge: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  numText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  stepTitle: {
    flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold",
    lineHeight: 22, paddingTop: 4,
  },
  cardBody: { padding: 14, gap: 0 },
  summary: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },

  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },

  callout: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 12, gap: 4 },
  calloutLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  calloutText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

  closing: { borderWidth: 1, padding: 18, gap: 8 },
  closingHeading: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  closingText: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 22 },
});
