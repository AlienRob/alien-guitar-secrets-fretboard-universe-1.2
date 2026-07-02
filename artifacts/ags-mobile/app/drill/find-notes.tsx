/**
 * Find All Notes drill — fretboard tap-many mode.
 *
 * 5 rounds. Each round names a note; the player taps every instance on the
 * 12-fret neck. Score = correct / total-correct (percentage). XP via
 * recordDrill("notes").
 */
import { AppIcon } from "@/components/app-icon";
import { DrillResult } from "@/components/drill-result";
import { PhotoFretboard as Fretboard, type HighlightCell } from "@/components/photo-fretboard";
import { ScreenBg } from "@/components/screen-bg";
import { XpBar } from "@/components/xp-bar";
import { type DrillOutcome, useProgress } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import { NOTES_FLAT, NOTES_SHARP, STRINGS, getNoteValue } from "@/lib/musicTheory";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_ROUNDS = 5;
const FRET_COUNT = 24;

// Columns: left = low-E (col 0), right = high-E (col 5). STRINGS is high-E-first.
function colToStringIdx(col: number): number {
  return STRINGS.length - 1 - col;
}

const NOTE_POOL = [
  "E", "A", "D", "G", "B",  // open strings — common
  "F", "C",                  // near-open positions
  "F#", "Bb", "Eb",          // more variety
];

function pickNote(): string {
  return NOTE_POOL[Math.floor(Math.random() * NOTE_POOL.length)];
}

function pcForNote(noteName: string): number {
  let idx = NOTES_SHARP.indexOf(noteName);
  if (idx === -1) idx = NOTES_FLAT.indexOf(noteName);
  return idx;
}

function allCorrectPositions(pc: number): Array<{ string: number; fret: number }> {
  const out: Array<{ string: number; fret: number }> = [];
  for (let col = 0; col < 6; col++) {
    for (let fret = 0; fret <= FRET_COUNT; fret++) {
      if (getNoteValue(colToStringIdx(col), fret) % 12 === pc) {
        out.push({ string: col, fret });
      }
    }
  }
  return out;
}

const CORRECT_COLOUR = "#00ffd5";
const MISSED_COLOUR = "#ff9f1c";

// ─── Component ────────────────────────────────────────────────────────────────

export default function FindNotesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordDrill } = useProgress();

  const [round, setRound] = useState(0);
  const [noteName, setNoteName] = useState(() => pickNote());
  const [selection, setSelection] = useState<Array<{ col: number; fret: number }>>([]);
  const [checked, setChecked] = useState(false);
  // HighlightCell uses field "string" (= col). Keep selection in col for Fretboard compat.
  // Cumulative penalized scoring: +1 correct tap, -1 wrong tap, clamped ≥ 0 per round.
  // Stored as cumulative penalized score and cumulative max (total correct positions) so
  // the final XP is proportional to accuracy without inflating from raw cell counts.
  const [cumScore, setCumScore] = useState(0);
  const [cumMax, setCumMax] = useState(0);
  const [outcome, setOutcome] = useState<DrillOutcome | null>(null);
  const mountedRef = useRef(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const pc = useMemo(() => pcForNote(noteName), [noteName]);
  const correctPositions = useMemo(() => allCorrectPositions(pc), [pc]);

  const correctSet = useMemo(
    () => new Set(correctPositions.map((p) => `${p.string}-${p.fret}`)),
    [correctPositions],
  );

  const handleDone = useCallback(() => {
    // Penalized scoring: +1 per correct tap, -1 per wrong tap, clamped ≥ 0.
    const hit  = selection.filter((s) =>  correctSet.has(`${s.col}-${s.fret}`)).length;
    const miss = selection.filter((s) => !correctSet.has(`${s.col}-${s.fret}`)).length;
    const score = Math.max(0, hit - miss);
    const max   = correctPositions.length;
    setCumScore((prev) => prev + score);
    setCumMax((prev)   => prev + max);
    setChecked(true);
  }, [selection, correctSet, correctPositions]);

  const handleNext = useCallback(async () => {
    if (round === TOTAL_ROUNDS - 1) {
      // Normalize to a bounded 0..TOTAL_ROUNDS scale so XP stays proportional
      // to accuracy and doesn't inflate from raw cell counts on a 24-fret neck.
      const accuracy   = cumMax > 0 ? cumScore / cumMax : 0;
      const scaledHit  = Math.round(accuracy * TOTAL_ROUNDS);
      const res = await recordDrill("notes", scaledHit, TOTAL_ROUNDS);
      if (mountedRef.current) setOutcome(res);
    } else {
      setRound((r) => r + 1);
      setNoteName(pickNote());
      setSelection([]);
      setChecked(false);
    }
  }, [round, cumScore, cumMax, recordDrill]);

  // After checking, build highlight cells: green for correct, orange for missed.
  const checkedHighlights: HighlightCell[] = useMemo(() => {
    if (!checked) return [];
    const selSet = new Set(selection.map((s) => `${s.col}-${s.fret}`));
    return correctPositions.map((pos) => ({
      string: pos.string,
      fret: pos.fret,
      colour: selSet.has(`${pos.string}-${pos.fret}`) ? CORRECT_COLOUR : MISSED_COLOUR,
      label: noteName,
    }));
  }, [checked, selection, correctPositions, noteName]);

  const restart = () => {
    setRound(0);
    setNoteName(pickNote());
    setSelection([]);
    setChecked(false);
    setCumScore(0);
    setCumMax(0);
    setOutcome(null);
  };

  if (outcome) {
    // Display the penalized accuracy as a fraction of TOTAL_ROUNDS for the result card.
    const accuracy    = cumMax > 0 ? cumScore / cumMax : 0;
    const scaledScore = Math.round(accuracy * TOTAL_ROUNDS);
    return (
      <DrillResult
        meta="Find All Notes"
        correct={scaledScore}
        total={TOTAL_ROUNDS}
        outcome={outcome}
        recaps={[]}
        onReplay={restart}
        onDone={() => router.back()}
        topPad={topPad}
      />
    );
  }

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <AppIcon name="x" size={26} color={colors.mutedForeground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Find All Notes</Text>
            <Text style={[styles.counter, { color: colors.accent }]}>
              {round + 1}/{TOTAL_ROUNDS}
            </Text>
          </View>

          <XpBar value={round} max={TOTAL_ROUNDS} />

          <View style={styles.promptArea}>
            <Text style={[styles.promptSmall, { color: colors.mutedForeground }]}>
              Find every
            </Text>
            <Text style={[styles.noteDisplay, { color: colors.chordTone }]}>{noteName}</Text>
            <Text style={[styles.promptSmall, { color: colors.mutedForeground }]}>
              on the fretboard
            </Text>
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              {correctPositions.length} positions total — tap them all, then check
            </Text>
          </View>
        </View>

        <Fretboard
          pcInfo={{}}
          rootPitch={null}
          useSharps={noteName.includes("#")}
          frets={FRET_COUNT}
          mode={checked ? "display" : "tap-many"}
          readOnly={checked}
          selection={checked ? [] : selection}
          onSelectionChange={setSelection}
          onSelectionConfirm={handleDone}
          highlightCells={checkedHighlights}
        />

        {/* "Check answers" button — shown while selecting, before checking */}
        {!checked && (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Pressable
              onPress={handleDone}
              style={({ pressed }) => [
                styles.nextBtn,
                { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
                Check my answers
              </Text>
              <AppIcon name="check-circle" size={18} color={colors.primaryForeground} />
            </Pressable>
          </View>
        )}

        {checked && (
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            {(() => {
              const hit  = selection.filter((s) =>  correctSet.has(`${s.col}-${s.fret}`)).length;
              const miss = selection.filter((s) => !correctSet.has(`${s.col}-${s.fret}`)).length;
              const total = correctPositions.length;
              const pct = total === 0 ? 100 : Math.max(0, Math.round(((hit - miss) / total) * 100));
              return (
                <View style={[styles.scoreBanner, {
                  backgroundColor: "rgba(0,255,213,0.08)",
                  borderColor: colors.accent,
                  borderRadius: colors.radius,
                }]}>
                  <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Round score</Text>
                  <Text style={[styles.scorePct, { color: colors.accent }]}>
                    {pct}%
                  </Text>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: CORRECT_COLOUR }]} />
                    <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Found</Text>
                    <View style={[styles.legendDot, { backgroundColor: MISSED_COLOUR, marginLeft: 14 }]} />
                    <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Missed</Text>
                  </View>
                </View>
              );
            })()}

            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.nextBtn,
                { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
                {round === TOTAL_ROUNDS - 1 ? "See results" : "Next note"}
              </Text>
              <AppIcon name="arrow-right" size={18} color={colors.primaryForeground} />
            </Pressable>

            {/* Exit button at the bottom so the user can leave after scrolling down */}
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.exitBtn,
                { borderColor: colors.border, borderRadius: colors.radius, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <AppIcon name="x" size={16} color={colors.mutedForeground} />
              <Text style={[styles.exitBtnText, { color: colors.mutedForeground }]}>Exit drill</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_600SemiBold" },
  counter: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  promptArea: { alignItems: "center", paddingVertical: 8, gap: 2 },
  promptSmall: { fontSize: 13, fontFamily: "Inter_500Medium" },
  noteDisplay: { fontSize: 44, fontFamily: "SpaceGrotesk_700Bold" },
  hintText: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  scoreBanner: {
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    marginBottom: 10,
    gap: 3,
  },
  scoreLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  scorePct: { fontSize: 32, fontFamily: "SpaceGrotesk_700Bold" },
  legendRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12, fontFamily: "Inter_400Regular", marginLeft: 6 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  nextBtnText: { fontSize: 17, fontFamily: "SpaceGrotesk_600SemiBold" },
  exitBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    marginTop: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  exitBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
