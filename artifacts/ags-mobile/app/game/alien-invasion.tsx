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
  buildPentBox, PENT_BOX_COUNT,
  randomPracticeRoot, rootPrefersFlats, type ScaleShape,
  getNoteValue,
} from "@/lib/musicTheory";
import { playNote } from "@/lib/audio";

/** Choose which fret window to show based on where the shape lives. */
function neckRange(s: ScaleShape): { startFret: number; frets: number } {
  if (s.maxFret <= 12) return { startFret: 0, frets: 12 };
  const start = Math.max(0, s.minFret - 2);
  const end   = Math.min(24, s.maxFret + 2);
  return { startFret: start, frets: end - start };
}

const NOTE_LIFETIME_MS = 2200;
const SPAWN_INTERVAL_MS = 700;
const CHAIN_COLORS = ["#4a5568", "#FFB800", "#00FFD5", "#FF2DCF"];
const INVASION_COLOR = "#FF6B35";

const DEGREE_COLORS: Record<number, string> = {
  0: "#FF3B30", 2: "#FF9500", 3: "#FF9500", 4: "#FFCC00",
  5: "#34C759", 7: "#00FFD5", 9: "#5E5CE6", 10: "#FF2DCF", 11: "#FF2DCF",
};

interface ActiveNote {
  id: string;
  string: number;
  fret: number;
  interval: number;
  expiresAt: number;
}

function randomPentShape(): ScaleShape {
  const root = randomPracticeRoot();
  return buildPentBox(root, ["Major Pentatonic", "Minor Pentatonic"][Math.floor(Math.random() * 2)], Math.floor(Math.random() * PENT_BOX_COUNT));
}

type Phase = "intro" | "playing" | "done";

export default function AlienInvasionScreen() {
  useLandscape();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordDrill } = useProgress();

  const [phase, setPhase] = useState<Phase>("intro");
  const [shape, setShape] = useState<ScaleShape>(() => randomPentShape());
  const [activeNotes, setActiveNotes] = useState<ActiveNote[]>([]);
  const [chain, setChain] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [xpGained, setXpGained] = useState(0);
  const [neckW, setNeckW] = useState(0);
  const [neckH, setNeckH] = useState(0);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const flashColorRef = useRef<string>("#00FF6640");
  const gameRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameEndedRef = useRef(false);
  const poolRef = useRef<Array<{ string: number; fret: number; interval: number }>>([]);
  const idxRef = useRef(0);
  const chainRef = useRef(0);
  const scoreRef = useRef(0);
  const [tick, setTick] = useState(0);

  function clearIntervals() {
    [gameRef, spawnRef, tickRef].forEach((r) => { if (r.current) clearInterval(r.current); });
  }

  useEffect(() => () => clearIntervals(), []);

  useEffect(() => {
    if (phase !== "playing") return;
    clearIntervals();

    gameRef.current = setInterval(() => {
      // State-updater must be pure — don't call endGame here
      setTimeLeft((t) => (t <= 1 ? (clearInterval(gameRef.current!), 0) : t - 1));
    }, 1000);

    tickRef.current = setInterval(() => setTick((n) => n + 1), 200);

    spawnRef.current = setInterval(() => {
      const pool = poolRef.current;
      if (!pool.length) return;
      const src = pool[idxRef.current++ % pool.length];
      setActiveNotes((prev) => {
        const now = Date.now();
        const live = prev.filter((n) => n.expiresAt > now);
        if (live.some((n) => n.string === src.string && n.fret === src.fret)) return live;
        if (live.length >= 4) return live;
        return [...live, { id: `${now}-${src.string}-${src.fret}`, ...src, expiresAt: now + NOTE_LIFETIME_MS }];
      });
    }, SPAWN_INTERVAL_MS);

    return clearIntervals;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, shape]);

  // End the game when the timer hits zero — must live outside the state updater
  useEffect(() => {
    if (phase === "playing" && timeLeft === 0 && !gameEndedRef.current) {
      gameEndedRef.current = true;
      void endGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  useEffect(() => {
    const now = Date.now();
    setActiveNotes((prev) => prev.filter((n) => n.expiresAt > now));
  }, [tick]);

  function flash(color: string) {
    flashColorRef.current = color;
    flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 380, useNativeDriver: true }).start();
  }

  function startGame(s: ScaleShape) {
    clearIntervals();
    gameEndedRef.current = false;
    const shuffled = [...s.notes].sort(() => Math.random() - 0.5);
    poolRef.current = shuffled;
    idxRef.current = 0;
    chainRef.current = 0;
    scoreRef.current = 0;
    setShape(s);
    setActiveNotes([]);
    setChain(0);
    setScore(0);
    setTimeLeft(60);
    setPhase("playing");
  }

  async function endGame() {
    clearIntervals();
    setPhase("done");
    const finalScore = scoreRef.current;
    const approxCorrect = Math.round(finalScore / 10);
    const outcome = await recordDrill("notes", approxCorrect, Math.max(approxCorrect + chainRef.current, 1));
    setXpGained(outcome.xpEarned ?? 0);
  }

  function handleTap(col: number, fret: number) {
    if (phase !== "playing") return;
    const stringIdx = 5 - col;
    const idx = activeNotes.findIndex((n) => n.string === stringIdx && n.fret === fret);
    if (idx >= 0) {
      playNote(getNoteValue(stringIdx, fret));
      setActiveNotes((prev) => prev.filter((_, i) => i !== idx));
      const newChain = Math.min(chainRef.current + 1, 3);
      chainRef.current = newChain;
      setChain(newChain);
      const mult = [1, 2, 3, 5][newChain];
      const pts = 10 * mult;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      flash("#00FF6640");
    } else {
      chainRef.current = 0;
      setChain(0);
      flash("#FF3B3040");
    }
  }

  const now = Date.now();
  const highlights: GameNeckHighlight[] = activeNotes
    .filter((n) => n.expiresAt > now)
    .map((n) => ({
      string: 5 - n.string,
      fret: n.fret,
      colour: DEGREE_COLORS[n.interval] ?? INVASION_COLOR,
    }));

  return (
    <View style={[styles.root, {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }]}>
      <Animated.View
        style={[styles.flashOverlay, { backgroundColor: flashColorRef.current, opacity: flashAnim }]}
        pointerEvents="none"
      />

      {/* ── Compact header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← BACK</Text>
        </Pressable>
        <Text style={styles.gameLabel}>ALIEN INVASION</Text>

        {phase === "playing" && (
          <>
            <Text style={styles.shapeLabel} numberOfLines={1}>
              <Text style={{ color: "#FFD700" }}>{shape.root}</Text>
              {" "}{shape.scaleName}
            </Text>
            <View style={styles.chainRow}>
              {CHAIN_COLORS.map((c, i) => (
                <View
                  key={i}
                  style={[styles.chainPip, {
                    backgroundColor: i <= chain ? `${c}22` : "transparent",
                    borderColor: i <= chain ? c : "#1c2747",
                    transform: [{ scale: i === chain ? 1.1 : 1 }],
                  }]}
                >
                  <Text style={[styles.chainPipTxt, { color: i <= chain ? c : "#1c2747" }]}>
                    {["×1", "×2", "×3", "×5"][i]}
                  </Text>
                </View>
              ))}
              {chain >= 3 && <Text style={styles.cosmicTxt}>COSMIC!</Text>}
            </View>
            <View style={styles.spacer} />
            <Text style={[styles.timer, { color: timeLeft <= 10 ? "#FF3B30" : "#fff" }]}>{timeLeft}s</Text>
            <Text style={styles.scoreTxt}>{score}</Text>
          </>
        )}
      </View>

      {/* ── Intro ── */}
      {phase === "intro" && (
        <View style={styles.centered}>
          <Text style={styles.introKicker}>ALIEN INVASION</Text>
          <Text style={styles.introShape}>
            <Text style={{ color: "#FFD700" }}>{shape.root}</Text>
            {" "}{shape.scaleName}
          </Text>
          <Text style={styles.introBlurb}>
            Notes invade the pentatonic shape and vanish after 2.2 seconds.{"\n"}
            Tap each glowing note before it disappears.{"\n"}
            Build your chain for up to ×5 score. Miss and the chain resets.
          </Text>
          <Pressable onPress={() => startGame(shape)} style={styles.startBtn}>
            <Text style={styles.startBtnTxt}>LAUNCH INVASION</Text>
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
              alienMode
            />
          )}
        </View>
      )}

      {/* ── Done ── */}
      {phase === "done" && (
        <View style={styles.centered}>
          <Text style={styles.resultTitle}>INVASION OVER</Text>
          <Text style={styles.resultScore}>{score}</Text>
          {xpGained > 0 && <Text style={styles.xpBadge}>+{xpGained} XP</Text>}
          <Text style={styles.resultSub}>{shape.root} {shape.scaleName} · {shape.label}</Text>
          <View style={styles.resultBtns}>
            <Pressable onPress={() => startGame(randomPentShape())} style={[styles.resultBtn, { backgroundColor: INVASION_COLOR }]}>
              <Text style={[styles.resultBtnTxt, { color: "#fff" }]}>Play Again</Text>
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
  gameLabel: { color: INVASION_COLOR, fontFamily: "Inter_600SemiBold", fontSize: 9, letterSpacing: 2 },
  shapeLabel: { color: "#fff", fontFamily: "SpaceGrotesk_700Bold", fontSize: 15 },
  chainRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  chainPip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  chainPipTxt: { fontFamily: "Inter_700Bold", fontSize: 10 },
  cosmicTxt: { color: "#FF2DCF", fontFamily: "Inter_700Bold", fontSize: 11, marginLeft: 2 },
  spacer: { flex: 1 },
  timer: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 22, minWidth: 44, textAlign: "right" },
  scoreTxt: { color: "#fff", fontFamily: "SpaceGrotesk_700Bold", fontSize: 18, minWidth: 50, textAlign: "right" },

  neckArea: { flex: 1 },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 10 },
  introKicker: { color: INVASION_COLOR, fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 2 },
  introShape: { color: "#fff", fontFamily: "SpaceGrotesk_700Bold", fontSize: 28 },
  introBlurb: { color: "#4a5e7a", fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 18, marginTop: 4 },
  startBtn: { marginTop: 8, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 14, backgroundColor: INVASION_COLOR },
  startBtnTxt: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16, letterSpacing: 1 },

  resultTitle: { color: "#fff", fontFamily: "SpaceGrotesk_700Bold", fontSize: 26 },
  resultScore: { color: INVASION_COLOR, fontFamily: "SpaceGrotesk_700Bold", fontSize: 72, lineHeight: 76 },
  xpBadge: { color: "#A8FF3E", fontFamily: "Inter_700Bold", fontSize: 18 },
  resultSub: { color: "#4a5e7a", fontFamily: "Inter_400Regular", fontSize: 13 },
  resultBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  resultBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  resultBtnSecondary: { backgroundColor: "#0d1525", borderWidth: 1, borderColor: "#1c2747" },
  resultBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 14, letterSpacing: 0.5 },
});
