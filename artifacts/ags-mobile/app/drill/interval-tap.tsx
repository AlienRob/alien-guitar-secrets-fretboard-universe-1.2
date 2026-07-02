/**
 * Interval Tap drill — fretboard interval identification.
 *
 * The root note is lit on the neck. The player taps the ONE specific fret that
 * matches the target interval (the closest playable occurrence). 10 questions,
 * XP via recordDrill("intervals").
 *
 * Fretboard window: a 5-fret spread centred on the root/target pair.
 * Root is constrained to frets 0-7 so the window always fits on screen.
 */
import { AppIcon } from "@/components/app-icon";
import { DrillResult } from "@/components/drill-result";
import { PhotoFretboard as Fretboard, type HighlightCell } from "@/components/photo-fretboard";
import { ScreenBg } from "@/components/screen-bg";
import { XpBar } from "@/components/xp-bar";
import { type DrillOutcome, useProgress } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import {
  INTERVALS,
  NOTES_SHARP,
  STRINGS,
  getNoteName,
  getNoteValue,
  parseNote,
  randomPracticeRoot,
  spellInterval,
} from "@/lib/musicTheory";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// col 0 = low-E = STRINGS[5], col 5 = high-E = STRINGS[0].
function colToStringIdx(col: number): number {
  return STRINGS.length - 1 - col;
}

// Maximum fret searched when picking the target — stay within the photo range.
const SEARCH_FRET_MAX = 14;

/**
 * Pick ONE representative target position for the given pitch class, biased
 * toward the same 5-fret zone as the root so the answer is always clearly
 * reachable within the visible window.
 */
function pickTargetPosition(
  targetPc: number,
  rootString: number,
  rootFret: number,
): { string: number; fret: number } {
  const candidates: Array<{ string: number; fret: number; dist: number }> = [];
  for (let col = 0; col < 6; col++) {
    for (let fret = 0; fret <= SEARCH_FRET_MAX; fret++) {
      // Skip the root cell itself.
      if (col === rootString && fret === rootFret) continue;
      if (getNoteValue(colToStringIdx(col), fret) % 12 !== targetPc) continue;
      // Prefer frets within ±4 of root and nearby strings.
      const fretPenalty = Math.abs(fret - rootFret);
      const stringPenalty = Math.abs(col - rootString) * 2;
      const dist = fretPenalty + stringPenalty;
      candidates.push({ string: col, fret, dist });
    }
  }
  if (candidates.length === 0) {
    return { string: rootString, fret: (rootFret + 5) % 13 };
  }
  candidates.sort((a, b) => a.dist - b.dist);
  // Pick among the top 3 closest to add variety across sessions.
  const pool = candidates.slice(0, Math.min(3, candidates.length));
  return pool[Math.floor(Math.random() * pool.length)];
}

// Askable intervals: skip Unison (0) and Octave (12).
const ASKABLE = Object.keys(INTERVALS).filter((n) => INTERVALS[n] > 0 && INTERVALS[n] < 12);

const ROOT_COLOUR = "#ff3b3b";
const TARGET_COLOUR = "#00ffd5";

interface TapQuestion {
  rootNote: string;
  rootString: number;
  rootFret: number;
  intervalName: string;
  targetNote: string;
  targetString: number;
  targetFret: number;
}

function makeQuestion(): TapQuestion {
  const rootNote = randomPracticeRoot();
  const rootPc = parseNote(rootNote).pitch;
  const intervalName = ASKABLE[Math.floor(Math.random() * ASKABLE.length)];
  const targetNote = spellInterval(rootNote, intervalName);
  const targetPc = parseNote(targetNote).pitch;

  // Prefer strings where the root lands at fret 0-7 so the 5-fret window
  // stays in the photo range. Collect all such strings and pick randomly.
  const goodStrings: number[] = [];
  for (let col = 0; col < 6; col++) {
    const sOpen = STRINGS[colToStringIdx(col)].open;
    const off = ((rootPc - (sOpen % 12)) + 12) % 12;
    if (off <= 7) goodStrings.push(col);
  }
  const rootString = goodStrings.length > 0
    ? goodStrings[Math.floor(Math.random() * goodStrings.length)]
    : Math.floor(Math.random() * 6);

  const stringOpen = STRINGS[colToStringIdx(rootString)].open;
  const rootFret = ((rootPc - (stringOpen % 12)) + 12) % 12;

  const { string: targetString, fret: targetFret } = pickTargetPosition(
    targetPc,
    rootString,
    rootFret,
  );

  return { rootNote, rootString, rootFret, intervalName, targetNote, targetString, targetFret };
}

// ─── Component ────────────────────────────────────────────────────────────────

const TOTAL = 10;

export default function IntervalTapScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordDrill } = useProgress();

  const [questions] = useState<TapQuestion[]>(() =>
    Array.from({ length: TOTAL }, makeQuestion),
  );
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [tapResult, setTapResult] = useState<"correct" | "wrong" | null>(null);
  const [answered, setAnswered] = useState(false);
  const [outcome, setOutcome] = useState<DrillOutcome | null>(null);
  const [tappedPos, setTappedPos] = useState<{ string: number; fret: number } | null>(null);
  const lockRef = useRef(false);
  const correctRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const q = questions[index];

  // ── 5-fret window: starts 1 fret below the lower of root/target ──────────
  const winLo    = Math.max(0, Math.min(q.rootFret, q.targetFret) - 1);
  const winHi    = Math.max(q.rootFret, q.targetFret) + 1;
  const winFrets = Math.max(5, winHi - winLo + 1);

  const rootHighlight: HighlightCell = {
    string: q.rootString,
    fret: q.rootFret,
    colour: ROOT_COLOUR,
    label: q.rootNote,
  };

  // After answering: show where the user tapped (if correct) or the canonical
  // target position (if wrong), labelled with the correctly-spelled note name.
  const answerHighlight: HighlightCell | null = answered
    ? tapResult === "correct" && tappedPos != null
      ? { string: tappedPos.string, fret: tappedPos.fret, colour: TARGET_COLOUR, label: q.targetNote }
      : { string: q.targetString, fret: q.targetFret, colour: TARGET_COLOUR, label: q.targetNote }
    : null;

  const highlights: HighlightCell[] = answered && answerHighlight
    ? [rootHighlight, answerHighlight]
    : [rootHighlight];

  const handleTap = (col: number, fret: number) => {
    if (lockRef.current || answered) return;
    lockRef.current = true;

    // Correct = any fret position whose pitch class matches the target interval.
    const targetPc = parseNote(q.targetNote).pitch;
    const isRight = getNoteValue(colToStringIdx(col), fret) % 12 === targetPc;

    setTappedPos({ string: col, fret });
    setTapResult(isRight ? "correct" : "wrong");
    setAnswered(true);

    if (isRight) {
      setCorrect((c) => {
        correctRef.current = c + 1;
        return c + 1;
      });
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        isRight
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
    }
  };

  const handleNext = async () => {
    setTapResult(null);
    setAnswered(false);
    setTappedPos(null);
    lockRef.current = false;

    if (index === TOTAL - 1) {
      const res = await recordDrill("intervals", correctRef.current, TOTAL);
      if (mountedRef.current) setOutcome(res);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const restart = () => {
    setIndex(0);
    setCorrect(0);
    correctRef.current = 0;
    setTapResult(null);
    setAnswered(false);
    setTappedPos(null);
    setOutcome(null);
    lockRef.current = false;
  };

  if (outcome) {
    return (
      <DrillResult
        meta="Interval Tap"
        correct={correct}
        total={TOTAL}
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
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <AppIcon name="x" size={26} color={colors.mutedForeground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Interval Tap</Text>
            <Text style={[styles.counter, { color: colors.accent }]}>
              {index + 1}/{TOTAL}
            </Text>
          </View>

          <XpBar value={index} max={TOTAL} />

          <View style={styles.promptArea}>
            <Text style={[styles.promptSmall, { color: colors.mutedForeground }]}>
              Tap the
            </Text>
            <Text style={[styles.prompt, { color: colors.foreground }]}>
              {q.intervalName}
            </Text>
            <Text style={[styles.promptOf, { color: colors.mutedForeground }]}>
              of{" "}
              <Text style={{ color: colors.chordTone, fontFamily: "SpaceGrotesk_700Bold" }}>
                {q.rootNote}
              </Text>
              {" "}(red dot)
            </Text>
          </View>
        </View>

        <Fretboard
          pcInfo={{}}
          rootPitch={null}
          useSharps={true}
          startFret={winLo}
          frets={winFrets}
          mode={answered ? "display" : "tap-one"}
          readOnly={answered}
          tapResult={tapResult}
          onTap={handleTap}
          highlightCells={highlights}
        />

        {answered && (
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <View
              style={[
                styles.feedbackBanner,
                {
                  backgroundColor:
                    tapResult === "correct"
                      ? "rgba(0,255,102,0.12)"
                      : "rgba(255,59,48,0.12)",
                  borderColor:
                    tapResult === "correct" ? colors.correct : colors.incorrect,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <AppIcon
                name={tapResult === "correct" ? "check-circle" : "x-circle"}
                size={20}
                color={tapResult === "correct" ? colors.correct : colors.incorrect}
              />
              <Text
                style={[
                  styles.feedbackText,
                  {
                    color:
                      tapResult === "correct" ? colors.correct : colors.incorrect,
                  },
                ]}
              >
                {tapResult === "correct"
                  ? `Correct! ${q.intervalName} of ${q.rootNote} = ${q.targetNote}`
                  : `The ${q.intervalName} of ${q.rootNote} is ${q.targetNote} — shown in teal`}
              </Text>
            </View>

            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.nextBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
                {index === TOTAL - 1 ? "See results" : "Next"}
              </Text>
              <AppIcon name="arrow-right" size={18} color={colors.primaryForeground} />
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
  promptArea: { alignItems: "center", paddingVertical: 18, gap: 4 },
  promptSmall: { fontSize: 14, fontFamily: "Inter_500Medium" },
  prompt: { fontSize: 30, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center" },
  promptOf: { fontSize: 16, fontFamily: "Inter_500Medium" },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  feedbackText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  nextBtnText: { fontSize: 17, fontFamily: "SpaceGrotesk_600SemiBold" },
});
