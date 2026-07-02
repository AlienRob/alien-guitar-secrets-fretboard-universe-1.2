/**
 * Chord Shape Build drill — chord-build fretboard mode.
 *
 * 5 questions. Each question names a chord; the player taps the six strings to
 * build the correct voicing. After "Check chord", the correct shape is shown
 * with degree labels. XP via recordDrill("chords").
 *
 * Difficulty selector:
 *  - "Open"  — only the 11 classic open-position shapes (E, A, D, G, C)
 *  - "All"   — adds E-form and A-form barre chords at frets 1-7
 */
import { AppIcon } from "@/components/app-icon";
import { DrillResult } from "@/components/drill-result";
import { PhotoFretboard as Fretboard, type HighlightCell } from "@/components/photo-fretboard";
import { ScreenBg } from "@/components/screen-bg";
import { XpBar } from "@/components/xp-bar";
import { type DrillOutcome, useProgress } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import { CHORDS, STRINGS, getNoteValue, parseNote, spellChordWithDegrees } from "@/lib/musicTheory";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = "open" | "all";

interface BarreInfo {
  fret: number;
  fromCol: number;
  toCol: number;
}

interface ChordVoicing {
  root: string;
  chordName: string;   // key in CHORDS, e.g. "Major", "Minor", "7"
  shapeName: string;   // display, e.g. "open", "E-form", "A-form"
  placement: Array<number | null>;
  isOpen: boolean;
  barre?: BarreInfo;
}

// ─── CAGED voicing generation ─────────────────────────────────────────────────
// placement[col]: col 0 = low-E, col 5 = high-E. null = muted.

// Low-E string open pitch class: 4 (E). A-string: 9. D: 2. G: 7. B: 11. High-E: 4.
const STRING_OPEN_PC = [4, 9, 2, 7, 11, 4]; // col 0..5

/**
 * Return the lowest fret (0-12) on a given col where pitch class = targetPc.
 * Returns null if not reachable in frets 0-12.
 */
function lowestFretForPc(col: number, targetPc: number): number | null {
  const openPc = STRING_OPEN_PC[col];
  const diff = ((targetPc - openPc) + 12) % 12;
  return diff <= 12 ? diff : null;
}

// ── Shape templates ───────────────────────────────────────────────────────────

// E major shape: root on col 0 (low-E)
function eMajorShape(rootFret: number): Array<number | null> {
  return [rootFret, rootFret + 2, rootFret + 2, rootFret + 1, rootFret, rootFret];
}
// E minor shape: root on col 0
function eMinorShape(rootFret: number): Array<number | null> {
  return [rootFret, rootFret + 2, rootFret + 2, rootFret, rootFret, rootFret];
}
// E7 shape: root on col 0
function e7Shape(rootFret: number): Array<number | null> {
  return [rootFret, rootFret + 2, rootFret, rootFret + 1, rootFret, rootFret];
}

// A major shape: root on col 1 (A-string)
function aMajorShape(rootFret: number): Array<number | null> {
  return rootFret === 0
    ? [null, 0, 2, 2, 2, 0]
    : [null, rootFret, rootFret + 2, rootFret + 2, rootFret + 2, rootFret];
}
// A minor shape: root on col 1
function aMinorShape(rootFret: number): Array<number | null> {
  return rootFret === 0
    ? [null, 0, 2, 2, 1, 0]
    : [null, rootFret, rootFret + 2, rootFret + 2, rootFret + 1, rootFret];
}
// A7 shape: root on col 1
function a7Shape(rootFret: number): Array<number | null> {
  return rootFret === 0
    ? [null, 0, 2, 0, 2, 0]
    : [null, rootFret, rootFret + 2, rootFret, rootFret + 2, rootFret];
}

// D major shape (open-position only, root on col 2)
function dMajorShape(): Array<number | null> { return [null, null, 0, 2, 3, 2]; }
function dMinorShape(): Array<number | null> { return [null, null, 0, 2, 3, 1]; }
function d7Shape():     Array<number | null> { return [null, null, 0, 2, 1, 2]; }

// G major shape (open-position, root on col 0 and col 5)
function gMajorShape(): Array<number | null> { return [3, 2, 0, 0, 0, 3]; }

// C major shape (open-position, root on col 1 / A-string fret 3)
function cMajorShape(): Array<number | null> { return [null, 3, 2, 0, 1, 0]; }

/**
 * Generate the full voicing pool.
 *
 * Open shapes: fret 0 E/A forms + D, G, C open positions.
 * Barre shapes: E/A forms at frets 1-7 (the "All" pool extension).
 */
function buildVoicingPool(): ChordVoicing[] {
  const pool: ChordVoicing[] = [];
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const DISPLAY: Record<string, string> = { "A#": "Bb", "D#": "Eb", "G#": "Ab", "C#": "Db" };
  const display = (n: string) => DISPLAY[n] ?? n;

  for (let pc = 0; pc < 12; pc++) {
    const root = display(NOTE_NAMES[pc]);

    // ── E-form shapes (root on low-E, col 0) ──
    const ef = lowestFretForPc(0, pc);
    if (ef !== null && ef <= 7) {
      const isOpen = ef === 0;
      const barre: BarreInfo | undefined = isOpen ? undefined : { fret: ef, fromCol: 0, toCol: 5 };
      pool.push({ root, chordName: "Major", shapeName: isOpen ? "open E" : "E-form barre",  placement: eMajorShape(ef), isOpen, barre });
      pool.push({ root, chordName: "Minor", shapeName: isOpen ? "open Em" : "Em-form barre", placement: eMinorShape(ef), isOpen, barre });
      // E7 barre is complex; include only the open E7
      if (isOpen) {
        pool.push({ root, chordName: "7", shapeName: "open E7", placement: e7Shape(ef), isOpen: true });
      }
    }

    // ── A-form shapes (root on A string, col 1) ──
    const af = lowestFretForPc(1, pc);
    if (af !== null && af <= 7) {
      const isOpen = af === 0;
      const barre: BarreInfo | undefined = isOpen ? undefined : { fret: af, fromCol: 1, toCol: 5 };
      pool.push({ root, chordName: "Major", shapeName: isOpen ? "open A" : "A-form barre",  placement: aMajorShape(af), isOpen, barre });
      pool.push({ root, chordName: "Minor", shapeName: isOpen ? "open Am" : "Am-form barre", placement: aMinorShape(af), isOpen, barre });
      if (isOpen) {
        pool.push({ root, chordName: "7", shapeName: "open A7", placement: a7Shape(af), isOpen: true });
      }
    }
  }

  // ── D, G, C open-position extras ──
  pool.push({ root: "D", chordName: "Major", shapeName: "open D",  placement: dMajorShape(), isOpen: true });
  pool.push({ root: "D", chordName: "Minor", shapeName: "open Dm", placement: dMinorShape(), isOpen: true });
  pool.push({ root: "D", chordName: "7",     shapeName: "open D7", placement: d7Shape(),     isOpen: true });
  pool.push({ root: "G", chordName: "Major", shapeName: "open G",  placement: gMajorShape(), isOpen: true });
  pool.push({ root: "C", chordName: "Major", shapeName: "open C",  placement: cMajorShape(), isOpen: true });

  return pool;
}

const VOICING_POOL = buildVoicingPool();

function pickVoicings(n: number, difficulty: Difficulty): ChordVoicing[] {
  const pool = difficulty === "open"
    ? VOICING_POOL.filter((v) => v.isOpen)
    : [...VOICING_POOL];
  const result: ChordVoicing[] = [];
  const used = new Set<string>();
  for (let i = 0; i < n; i++) {
    let tries = 0;
    let pick: ChordVoicing;
    do {
      pick = pool[Math.floor(Math.random() * pool.length)];
      tries++;
    } while (
      used.has(`${pick.root}-${pick.chordName}`) && tries < 30
    );
    used.add(`${pick.root}-${pick.chordName}`);
    result.push(pick);
  }
  return result;
}

function chordDisplayName(v: ChordVoicing): string {
  if (v.chordName === "Major") return `${v.root} major`;
  if (v.chordName === "Minor") return `${v.root} minor`;
  return `${v.root}${v.chordName}`;
}

function colToStringIdx(col: number): number {
  return STRINGS.length - 1 - col;
}

function getDegreeForPc(pc: number, root: string, chordName: string): string {
  const degrees = spellChordWithDegrees(root, chordName);
  for (const d of degrees) {
    const { pitch } = parseNote(d.note);
    if (pitch === pc) return d.degree;
  }
  return "?";
}

// ─── Visible fret range ───────────────────────────────────────────────────────

function maxFret(placement: Array<number | null>): number {
  return Math.max(0, ...placement.map((f) => f ?? 0));
}

/** Lowest non-null (sounded) fret in the chord voicing. */
function minSoundedFret(placement: Array<number | null>): number {
  const vals = placement.filter((f): f is number => f !== null && f > 0);
  return vals.length > 0 ? Math.min(...vals) : 0;
}

const CORRECT_COLOUR = "#00e666";
const WRONG_COLOUR   = "#ff3b30";
const ANSWER_COLOUR  = "#00ffd5";

// ─── Component ────────────────────────────────────────────────────────────────

const TOTAL = 5;

export default function ChordShapeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordDrill } = useProgress();

  const [difficulty, setDifficulty] = useState<Difficulty>("open");
  const [voicings, setVoicings] = useState<ChordVoicing[]>(() => pickVoicings(TOTAL, "open"));
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const [isRight, setIsRight] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [submittedPlacement, setSubmittedPlacement] = useState<Array<number | null> | null>(null);
  const [outcome, setOutcome] = useState<DrillOutcome | null>(null);
  const mountedRef = useRef(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const v = voicings[index];
  const displayName = chordDisplayName(v);

  // ── 5-fret window positioned at the chord's location ─────────────────────
  // For open chords (lowest sounded fret 0-2) the window starts at fret 0.
  // For barre chords it starts 1 fret below the barre so the barre wire is
  // clearly visible. The window is always at least 5 frets tall.
  const chordMin   = minSoundedFret(v.placement);
  const chordMax   = maxFret(v.placement);
  const chordStart = chordMin <= 2 ? 0 : Math.max(0, chordMin - 1);
  const fretWindow = Math.max(5, chordMax - chordStart + 2);

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    if (d === difficulty) return;
    setDifficulty(d);
    setVoicings(pickVoicings(TOTAL, d));
    setIndex(0);
    setChecked(false);
    setIsRight(false);
    setCorrectCount(0);
    setSubmittedPlacement(null);
    setOutcome(null);
  }, [difficulty]);

  /**
   * After checking:
   * - Correct strings:  CORRECT_COLOUR with degree label
   * - Wrong strings (player placed wrong fret): player's choice in WRONG_COLOUR,
   *   correct fret in ANSWER_COLOUR with degree label
   * - Strings that should be muted but were fretted by player: player's choice in WRONG_COLOUR
   */
  const feedbackHighlights: HighlightCell[] = useMemo(() => {
    if (!checked || !submittedPlacement) return [];
    const cells: HighlightCell[] = [];
    for (let col = 0; col < 6; col++) {
      const expected = v.placement[col];
      const submitted = submittedPlacement[col];
      const isStringRight =
        (expected === null && submitted === null) ||
        (expected !== null && submitted === expected);

      if (isStringRight) {
        if (expected !== null) {
          const pc = getNoteValue(colToStringIdx(col), expected) % 12;
          const degree = getDegreeForPc(pc, v.root, v.chordName);
          cells.push({ string: col, fret: expected, colour: CORRECT_COLOUR, label: degree });
        }
      } else {
        if (submitted !== null) {
          cells.push({ string: col, fret: submitted, colour: WRONG_COLOUR });
        }
        if (expected !== null) {
          const pc = getNoteValue(colToStringIdx(col), expected) % 12;
          const degree = getDegreeForPc(pc, v.root, v.chordName);
          cells.push({ string: col, fret: expected, colour: ANSWER_COLOUR, label: degree });
        }
      }
    }
    return cells;
  }, [checked, submittedPlacement, v]);

  const handleSubmit = useCallback((placement: Array<number | null>) => {
    setSubmittedPlacement(placement);
    const allMatch = v.placement.every((expected, col) => {
      const submitted = placement[col];
      if (expected === null && submitted === null) return true;
      if (expected !== null && submitted === expected) return true;
      return false;
    });
    setIsRight(allMatch);
    if (allMatch) setCorrectCount((c) => c + 1);
    setChecked(true);
  }, [v]);

  const handleNext = useCallback(async () => {
    if (index === TOTAL - 1) {
      const res = await recordDrill("chords", correctCount, TOTAL);
      if (mountedRef.current) setOutcome(res);
    } else {
      setIndex((i) => i + 1);
      setChecked(false);
      setIsRight(false);
      setSubmittedPlacement(null);
    }
  }, [index, correctCount, recordDrill]);

  const restart = () => {
    setVoicings(pickVoicings(TOTAL, difficulty));
    setIndex(0);
    setChecked(false);
    setIsRight(false);
    setCorrectCount(0);
    setSubmittedPlacement(null);
    setOutcome(null);
  };

  if (outcome) {
    return (
      <DrillResult
        meta="Build a Chord Shape"
        correct={correctCount}
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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Build a Chord Shape
            </Text>
            <Text style={[styles.counter, { color: colors.accent }]}>
              {index + 1}/{TOTAL}
            </Text>
          </View>

          {/* ── Difficulty selector ── */}
          <View style={styles.difficultyRow}>
            {(["open", "all"] as Difficulty[]).map((d) => (
              <Pressable
                key={d}
                onPress={() => handleDifficultyChange(d)}
                style={[
                  styles.difficultyBtn,
                  {
                    backgroundColor: difficulty === d ? colors.primary : colors.muted,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Text style={[styles.difficultyBtnText, {
                  color: difficulty === d ? colors.primaryForeground : colors.mutedForeground,
                }]}>
                  {d === "open" ? "Open chords" : "All chords"}
                </Text>
              </Pressable>
            ))}
          </View>

          <XpBar value={index} max={TOTAL} />

          <View style={styles.promptArea}>
            <Text style={[styles.promptSmall, { color: colors.mutedForeground }]}>Build a</Text>
            <Text style={[styles.chordName, { color: colors.foreground }]}>{displayName}</Text>
            <Text style={[styles.shapeBadge, { color: colors.mutedForeground }]}>
              {v.shapeName} position
            </Text>
            {/* Always rendered so the promptArea height stays constant */}
            <Text style={[styles.hint, { color: colors.mutedForeground, opacity: checked ? 0 : 1 }]}>
              Tap each string to set your finger position
            </Text>
          </View>
        </View>

        <Fretboard
          pcInfo={{}}
          rootPitch={null}
          useSharps={!v.root.includes("b") && v.root !== "F"}
          startFret={chordStart}
          frets={fretWindow}
          mode={checked ? "display" : "chord-build"}
          readOnly={checked}
          onChordSubmit={handleSubmit}
          highlightCells={feedbackHighlights}
          barre={checked ? v.barre : undefined}
        />

        {/* Always rendered so no layout shift when result appears */}
        <View
          style={{ paddingHorizontal: 20, marginTop: 12, opacity: checked ? 1 : 0 }}
          pointerEvents={checked ? "auto" : "none"}
        >
            <View style={[styles.feedbackBanner, {
              backgroundColor: isRight
                ? "rgba(0,230,102,0.12)"
                : "rgba(255,59,48,0.12)",
              borderColor: isRight ? colors.correct : colors.incorrect,
              borderRadius: colors.radius,
            }]}>
              <AppIcon
                name={isRight ? "check-circle" : "x-circle"}
                size={20}
                color={isRight ? colors.correct : colors.incorrect}
              />
              <Text style={[styles.feedbackText, {
                color: isRight ? colors.correct : colors.incorrect,
              }]}>
                {isRight
                  ? "Perfect shape!"
                  : `The correct ${displayName} (${v.shapeName}) is shown above with degree labels`}
              </Text>
            </View>

            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.nextBtn,
                { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
                {index === TOTAL - 1 ? "See results" : "Next chord"}
              </Text>
              <AppIcon name="arrow-right" size={18} color={colors.primaryForeground} />
            </Pressable>
        </View>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_600SemiBold" },
  counter: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  difficultyRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  difficultyBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  difficultyBtnText: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  promptArea: { alignItems: "center", paddingVertical: 14, gap: 4 },
  promptSmall: { fontSize: 14, fontFamily: "Inter_500Medium" },
  chordName: { fontSize: 32, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center" },
  shapeBadge: { fontSize: 13, fontFamily: "Inter_400Regular" },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 6, textAlign: "center" },
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
