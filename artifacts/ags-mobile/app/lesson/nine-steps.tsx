import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";

const ACCENT = "#00FFD5";
const GOLD   = "#FFD700";

interface Step {
  n: number;
  title: string;
  summary: string;
  points: string[];
  tip?: string;
}

const STEPS: Step[] = [
  {
    n: 1,
    title: "Goal Setting — Define Your Destination",
    summary:
      "Setting goals is the foundation of effective practice. Without a clear goal, your practice sessions can quickly become aimless. Take a moment before each session to decide what you want to achieve.",
    points: [
      "Break larger goals into smaller chunks. If your goal is to master a new song, focus on one section at a time.",
      "Be specific. Instead of \"get better at scales\", aim for \"play the A minor pentatonic in all five positions at 120 BPM\".",
      "Set short-term and long-term goals. Short-term goals keep you motivated; long-term goals give you something big to strive for.",
    ],
    tip: "Example goal: \"Today I will practice transitioning smoothly between barre chords using the E shape and A shape.\"",
  },
  {
    n: 2,
    title: "Focused Practice — Stay on Track",
    summary:
      "It is easy to drift into playing things you are already comfortable with. If your goal is to improve chord changes, devote the entire session to that. Avoid the temptation to play your favourite licks. This is how you see real progress.",
    points: [
      "Set a timer. Spend 10 minutes on chord transitions, 15 on scales, 20 on a song.",
      "Eliminate distractions. Find a quiet space and turn off notifications.",
    ],
    tip: "The hardest things to practice are usually the areas where you will see the most improvement. Push through the discomfort.",
  },
  {
    n: 3,
    title: "Start Slow — Mastery Begins with Precision",
    summary:
      "One of the biggest mistakes guitarists make is trying to play too fast too soon. Always begin slowly, focusing on accuracy and clarity. Slow practice lets you internalise every note, finger movement, and technique.",
    points: [
      "Builds muscle memory — slow practice establishes correct movements that translate to faster playing.",
      "Improves finger coordination — playing slowly forces you to think about each finger's position.",
      "Prevents sloppiness — mistakes are easier to spot at slower tempos.",
    ],
    tip: "Set your metronome to a comfortable tempo (e.g. 60 BPM). Once you can play cleanly, increase by small increments (5 BPM) until you reach your target speed.",
  },
  {
    n: 4,
    title: "Use a Metronome — Develop Rock-Solid Timing",
    summary:
      "A metronome is an essential tool for every guitarist. It develops a strong sense of timing and rhythm — crucial for playing with other musicians. Embrace it and it will make you a better player.",
    points: [
      "Start at a slow tempo and play through the exercise perfectly in time before speeding up.",
      "Practice different rhythms — quarter notes, eighth notes, triplets, sixteenth notes.",
      "Use mathematical increments — double or halve the rhythm rather than nudging the BPM slightly.",
    ],
    tip: "If you are struggling to keep up with the metronome, slow down. Being in control is more important than playing fast.",
  },
  {
    n: 5,
    title: "Accountability — Hold Yourself to a High Standard",
    summary:
      "Don't practice mindlessly. Correct bad habits as soon as they arise, refine your technique, and push yourself to play cleanly and accurately. Remember: practice doesn't make perfect — it makes permanent.",
    points: [
      "Record yourself. Listen back to identify areas for improvement.",
      "Analyse your technique. Check hand position, pick angle, and posture — are you making unnecessary movements?",
      "Use a practice journal. Document sessions and reflect on what went well and what needs attention.",
    ],
    tip: "The quality of your practice is more important than the quantity. 30 minutes of focused practice beats 2 hours of sloppy playing.",
  },
  {
    n: 6,
    title: "Track Your Progress — Measure Your Growth",
    summary:
      "Keeping a practice log is an excellent way to stay motivated and see progress over time. Write down what you practiced, the starting and finishing tempo, and any breakthroughs you had.",
    points: [
      "Use a spreadsheet or notebook. Document what you practiced, the duration, and tempo progress.",
      "Review regularly. Look back at your log weekly or monthly to evaluate growth.",
      "Set milestones. Celebrate reaching them — mastering a difficult lick or hitting a new BPM target.",
    ],
    tip: "When you feel discouraged, look back at your progress log. You will be reminded of how much you have improved.",
  },
  {
    n: 7,
    title: "Practice Regularly — Consistency is Key",
    summary:
      "Regular, consistent practice is the most effective way to improve. Even 15–20 minutes a day is more beneficial than cramming 2 hours into one session per week. Frequent shorter sessions allow your brain and muscles to reinforce what you have learned.",
    points: [
      "Schedule your practice time. Dedicate specific times each day, just like any other commitment.",
      "Create a practice plan. Vary the focus to include technique, theory, songs, and improvisation.",
      "Stay committed. Avoid skipping sessions — even a few minutes counts.",
    ],
    tip: "Consistency leads to exponential growth. Small daily improvements add up to significant progress.",
  },
  {
    n: 8,
    title: "Visualisation — Master Your Mindset",
    summary:
      "Visualisation is a powerful tool for enhancing your playing. Take a few minutes to sit quietly, close your eyes, and picture yourself playing effortlessly — fingers moving smoothly, every note ringing out clearly.",
    points: [
      "Set a time each day. Practice visualisation before or after your physical session.",
      "Focus on positive outcomes. Visualise overcoming challenges and playing with confidence.",
      "Combine with physical practice. Use visualisation to reinforce what you have practised, then see it translate into your playing.",
    ],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StepCard({ step }: { step: Step }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={[styles.cardHead, { borderBottomColor: colors.border }]}>
        <View style={[styles.numBadge, { borderColor: GOLD, backgroundColor: GOLD + "18" }]}>
          <Text style={[styles.numText, { color: GOLD }]}>{step.n}</Text>
        </View>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.summary, { color: colors.mutedForeground }]}>{step.summary}</Text>
        <View style={{ gap: 8, marginTop: 10 }}>
          {step.points.map((p, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: ACCENT }]} />
              <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{p}</Text>
            </View>
          ))}
        </View>
        {step.tip && (
          <View style={[styles.tipBox, { borderColor: ACCENT + "44", backgroundColor: ACCENT + "08" }]}>
            <Text style={[styles.tipLabel, { color: ACCENT }]}>TIP</Text>
            <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{step.tip}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function NineStepsLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();

  useEffect(() => {
    markLessonViewed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LessonLayout
      kicker="Introduction · Practice"
      title="9 Steps to Great Practice"
      practiceHref="/(tabs)/practice"
      practiceLabel="Go to Practice"
      intro={[
        "Mastering the guitar isn't just about putting in countless hours. It's about practising effectively and intentionally. These eight essential steps will help you create a more structured, efficient, and ultimately rewarding practice routine.",
        "Each step has been refined through years of teaching and playing, helping students achieve real, measurable improvements. If you are ready to break through your current limitations, let's dive in.",
      ]}
    >
      <View style={{ gap: 16 }}>
        {STEPS.map((step) => (
          <StepCard key={step.n} step={step} />
        ))}
      </View>

      <View style={[styles.closing, { borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.closingText, { color: colors.mutedForeground }]}>
          These steps are not a one-time read — they are habits to build over time. Come back to this page whenever you feel your practice has gone stale. Even applying just one of these principles will move the needle.
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
  stepTitle: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold", lineHeight: 22, paddingTop: 4 },
  cardBody: { padding: 14, gap: 0 },
  summary: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },
  tipBox: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 12, gap: 4 },
  tipLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  tipText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  closing: { borderWidth: 1, padding: 18 },
  closingText: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 22, fontStyle: "italic" },
});
