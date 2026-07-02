import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameNeck, type GameNeckHighlight } from "@/components/game-neck";
import { useProgress } from "@/contexts/progress";
import { useLandscape } from "@/hooks/useLandscape";
import {
  buildCagedShape, build3npsShape, buildPentBox,
  CAGED_SCALES, NPS_SCALES, CAGED_POSITION_COUNT, PENT_BOX_COUNT,
  getNoteValue, randomPracticeRoot, rootPrefersFlats, type ScaleShape,
} from "@/lib/musicTheory";
import { playNote } from "@/lib/audio";

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

/** Choose which fret window to show based on where the shape lives. */
function neckRange(s: ScaleShape): { startFret: number; frets: number } {
  if (s.maxFret <= 12) return { startFret: 0, frets: 12 };
  const start = Math.max(0, s.minFret - 2);
  const end   = Math.min(24, s.maxFret + 2);
  return { startFret: start, frets: end - start };
}

function randomShape(): ScaleShape {
  const root = randomPracticeRoot();
  const systems: (() => ScaleShape)[] = [
    () => buildCagedShape(root, pick(CAGED_SCALES), Math.floor(Math.random() * CAGED_POSITION_COUNT)),
    () => build3npsShape(root, pick(NPS_SCALES), Math.floor(Math.random() * 7)),
    () => buildPentBox(root, pick(["Major Pentatonic", "Minor Pentatonic"]), Math.floor(Math.random() * PENT_BOX_COUNT)),
  ];
  return pick(systems)();
}

type Phase = "intro" | "playing" | "done";

export default function ShapeSpotterScreen() {
  useLandscape();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordDrill } = useProgress();

  const [phase, setPhase] = useState<Phase>("intro");
  const [shape, setShape] = useState<ScaleShape>(() => randomShape());
  const [found, setFound] = useState<Set<string>>(new Set());
  const [misses, setMisses] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [neckW, setNeckW] = useState(0);
  const [neckH, setNeckH] = useState(0);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startMs = useRef(0);

  function startGame(s: ScaleShape) {
    clearInterval(timerRef.current!);
    setShape(s);
    setFound(new Set());
    setMisses(0);
    setElapsed(0);
    setPhase("playing");
    startMs.current = Date.now();
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startMs.current) / 1000)),
      250,
    );
  }

  useEffect(() => () => clearInterval(timerRef.current!), []);

  async function finishGame(finalFound: Set<string>, finalMisses: number) {
    clearInterval(timerRef.current!);
    const finalElapsed = Math.floor((Date.now() - startMs.current) / 1000);
    setElapsed(finalElapsed);
    setPhase("done");
    const total = shape.notes.length;
    const correct = Math.max(0, total - finalMisses);
    const outcome = await recordDrill("scales", correct, Math.max(total, 1));
    setXpGained(outcome.xpEarned ?? 0);
  }

  function handleTap(col: number, fret: number) {
    if (phase !== "playing") return;
    const stringIdx = 5 - col;
    const key = `${stringIdx}:${fret}`;
    if (found.has(key)) return;

    const isCorrect = shape.notes.some((n) => n.string === stringIdx && n.fret === fret);
    if (isCorrect) {
      playNote(getNoteValue(stringIdx, fret));
      const newFound = new Set([...found, key]);
      setFound(newFound);
      if (newFound.size === shape.notes.length) {
        void finishGame(newFound, misses);
      }
    } else {
      const newMisses = misses + 1;
      setMisses(newMisses);
      flashAnim.setValue(1);
      Animated.timing(flashAnim, { toValue: 0, duration: 380, useNativeDriver: true }).start();
    }
  }

  const highlights: GameNeckHighlight[] = shape.notes
    .filter((n) => found.has(`${n.string}:${n.fret}`))
    .map((n) => ({
      string: 5 - n.string,
      fret: n.fret,
      colour: n.isRoot ? "#FFD700" : "#00FF66",
    }));

  const remaining = shape.notes.length - found.size;
  const score = Math.max(0, 1000 - misses * 100 - elapsed * 5);
  return (
    <View style={[styles.root, {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }]}>
      <Animated.View
        style={[styles.flashOverlay, { backgroundColor: "#FF3B3040", opacity: flashAnim }]}
        pointerEvents="none"
      />

      {/* ── Compact header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← BACK</Text>
        </Pressable>
        <Text style={styles.gameLabel}>SHAPE SPOTTER</Text>

        {phase === "playing" && (
          <>
            <Text style={styles.scaleName} numberOfLines={1}>
              <Text style={{ color: "#FFD700" }}>{shape.root}</Text>
              {" "}{shape.scaleName}
            </Text>
            <Text style={styles.shapeLabel}>{shape.label}</Text>
            <View style={styles.spacer} />
            <View style={styles.remainingBox}>
              <Text style={[styles.remainingNum, { color: remaining === 0 ? "#A8FF3E" : "#fff" }]}>
                {remaining}
              </Text>
              <Text style={styles.remainingLbl}>left</Text>
            </View>
            <Text style={styles.elapsed}>{elapsed}s</Text>
            <Text style={[styles.missCount, { color: misses > 0 ? "#FF3B30" : "#4a5e7a" }]}>
              {misses} {misses === 1 ? "miss" : "misses"}
            </Text>
          </>
        )}
      </View>

      {/* ── Intro ── */}
      {phase === "intro" && (
        <View style={styles.centered}>
          <Text style={styles.introKicker}>TAP EVERY NOTE OF</Text>
          <Text style={styles.introScale}>
            <Text style={{ color: "#FFD700" }}>{shape.root}</Text>
            {" "}{shape.scaleName}
          </Text>
          <Text style={styles.introShape}>{shape.label} · around fret {shape.minFret}</Text>
          <Text style={styles.introBlurb}>
            The neck is blank. Find all the notes from memory.{"\n"}
            Root notes glow gold. Wrong taps count as misses.
          </Text>
          <Pressable onPress={() => startGame(shape)} style={styles.startBtn}>
            <Text style={styles.startBtnTxt}>START</Text>
          </Pressable>
        </View>
      )}

      {/* ── Playing — neck fills remaining space ── */}
      {phase === "playing" && (
        <View
          style={styles.neckArea}
          onLayout={(e) => {
            setNeckW(e.nativeEvent.layout.width);
            setNeckH(e.nativeEvent.layout.height);
          }}
        >
          {neckW > 0 && neckH > 0 && (
            <GameNeck
              width={neckW}
              height={neckH}
              {...neckRange(shape)}
              onTap={handleTap}
              highlightCells={highlights}
            />
          )}
        </View>
      )}

      {/* ── Done ── */}
      {phase === "done" && (
        <View style={styles.centered}>
          <Text style={styles.resultTitle}>{misses === 0 ? "PERFECT!" : "SHAPE FOUND"}</Text>
          <Text style={styles.resultScore}>{score}</Text>
          {xpGained > 0 && <Text style={styles.xpBadge}>+{xpGained} XP</Text>}
          <Text style={styles.resultSub}>
            {shape.root} {shape.scaleName} · {shape.label} · {misses} {misses === 1 ? "miss" : "misses"} · {elapsed}s
          </Text>
          <View style={styles.resultBtns}>
            <Pressable
              onPress={() => { const s = randomShape(); setShape(s); setPhase("intro"); }}
              style={[styles.resultBtn, { backgroundColor: "#FFD700" }]}
            >
              <Text style={[styles.resultBtnTxt, { color: "#050816" }]}>Next Shape</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} style={[styles.resultBtn, styles.resultBtnSecondary]}>
              <Text style={styles.resultBtnTxt}>Back</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050816" },
  flashOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 50 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#0d1525",
  },
  backBtn: { paddingVertical: 4 },
  backTxt: { color: "#4a5e7a", fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1 },
  gameLabel: { color: "#FFD700", fontFamily: "Inter_600SemiBold", fontSize: 9, letterSpacing: 2 },
  scaleName: { color: "#fff", fontFamily: "SpaceGrotesk_700Bold", fontSize: 15 },
  shapeLabel: { color: "#4a5e7a", fontFamily: "Inter_400Regular", fontSize: 12 },
  spacer: { flex: 1 },
  remainingBox: { alignItems: "center", flexDirection: "row", gap: 3 },
  remainingNum: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 22, lineHeight: 24 },
  remainingLbl: { color: "#4a5e7a", fontFamily: "Inter_400Regular", fontSize: 11 },
  elapsed: { color: "#4a5e7a", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  missCount: { fontFamily: "Inter_600SemiBold", fontSize: 13 },

  neckArea: { flex: 1 },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 10 },
  introKicker: { color: "#4a5e7a", fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 2 },
  introScale: { color: "#fff", fontFamily: "SpaceGrotesk_700Bold", fontSize: 30 },
  introShape: { color: "#4a5e7a", fontFamily: "Inter_400Regular", fontSize: 14 },
  introBlurb: { color: "#4a5e7a", fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 18, marginTop: 4 },
  startBtn: { marginTop: 8, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 14, backgroundColor: "#FFD700" },
  startBtnTxt: { color: "#050816", fontFamily: "Inter_700Bold", fontSize: 16, letterSpacing: 1 },

  resultTitle: { color: "#fff", fontFamily: "SpaceGrotesk_700Bold", fontSize: 26 },
  resultScore: { color: "#FFD700", fontFamily: "SpaceGrotesk_700Bold", fontSize: 72, lineHeight: 76 },
  xpBadge: { color: "#A8FF3E", fontFamily: "Inter_700Bold", fontSize: 18 },
  resultSub: { color: "#4a5e7a", fontFamily: "Inter_400Regular", fontSize: 13 },
  resultBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  resultBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  resultBtnSecondary: { backgroundColor: "#0d1525", borderWidth: 1, borderColor: "#1c2747" },
  resultBtnTxt: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14, letterSpacing: 0.5 },
});
