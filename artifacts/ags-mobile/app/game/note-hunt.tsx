import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameNeck, type GameNeckHighlight } from "@/components/game-neck";
import { useProgress } from "@/contexts/progress";
import { useLandscape } from "@/hooks/useLandscape";
import { findAllNeckPositions, getNoteValue, parseNote } from "@/lib/musicTheory";
import { playNote } from "@/lib/audio";

const NATURAL_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const NOTE_COLORS = ["#FF2D55", "#FF6B35", "#FFB800", "#A8FF3E", "#00FF66", "#00FFD5", "#4F8FFF"];
const CHAIN_COLORS = ["#4a5568", "#FFB800", "#00FFD5", "#FF2DCF"];

type Phase = "pick" | "playing" | "done";

export default function NoteHuntScreen() {
  useLandscape();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { recordDrill } = useProgress();

  const [phase, setPhase] = useState<Phase>("pick");
  const [targetNote, setTargetNote] = useState<string>("C");
  const [found, setFound] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(45);
  const [chain, setChain] = useState(0);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [xpGained, setXpGained] = useState(0);
  const [neckW, setNeckW] = useState(0);
  const [neckH, setNeckH] = useState(0);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Prevent double endGame calls (timer + tap both finishing at the same moment)
  const gameEndedRef = useRef(false);
  // Keep a ref-copy of found so endGame always reads the latest count
  const foundRef = useRef(found);
  useEffect(() => { foundRef.current = found; }, [found]);

  // Always compute targets from targetNote so the done screen shows the real count
  const targets = useMemo(
    () => findAllNeckPositions(parseNote(targetNote).pitch, 12),
    [targetNote],
  );

  useEffect(() => {
    if (phase !== "playing") return;
    gameEndedRef.current = false;
    timerRef.current = setInterval(() => {
      // State-updater functions must be pure — don't call endGame here
      setTimeLeft((t) => (t <= 1 ? (clearInterval(timerRef.current!), 0) : t - 1));
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  // React to the timer hitting zero outside the state-updater (avoids render-phase dispatch)
  useEffect(() => {
    if (phase === "playing" && timeLeft === 0 && !gameEndedRef.current) {
      gameEndedRef.current = true;
      void endGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  function startGame(note: string) {
    clearInterval(timerRef.current!);
    gameEndedRef.current = false;
    setTargetNote(note);
    setFound(new Set());
    foundRef.current = new Set();
    setTimeLeft(45);
    setChain(0);
    setFlashColor(null);
    setPhase("playing");
  }

  async function endGame() {
    setPhase("done");
    const correct = foundRef.current.size;
    const outcome = await recordDrill("notes", correct, Math.max(targets.length, 1));
    setXpGained(outcome.xpEarned ?? 0);
  }

  function flash(color: string) {
    setFlashColor(color);
    flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() =>
      setFlashColor(null),
    );
  }

  function handleTap(col: number, fret: number) {
    if (phase !== "playing") return;
    const stringIdx = 5 - col; // GameNeck col 0=low E; musicTheory string 0=high e
    const key = `${stringIdx}:${fret}`;
    const pitch = getNoteValue(stringIdx, fret) % 12;
    const targetPitch = parseNote(targetNote).pitch;

    if (pitch === targetPitch) {
      if (found.has(key)) return;
      playNote(getNoteValue(stringIdx, fret));
      const newFound = new Set([...found, key]);
      const newChain = Math.min(chain + 1, 3);
      setFound(newFound);
      setChain(newChain);
      flash("#00FF6640");
      if (newFound.size === targets.length && !gameEndedRef.current) {
        gameEndedRef.current = true;
        clearInterval(timerRef.current!);
        void endGame();
      }
    } else {
      setChain(0);
      setTimeLeft((t) => Math.max(0, t - 3));
      flash("#FF3B3040");
    }
  }

  const highlights: GameNeckHighlight[] = targets
    .filter((n) => found.has(`${n.string}:${n.fret}`))
    .map((n) => ({
      string: 5 - n.string, // convert musicTheory (0=high e) → GameNeck (0=low E)
      fret: n.fret,
      colour: "#ff3b3b",
      label: targetNote,
    }));

  const noteColor = NOTE_COLORS[NATURAL_NOTES.indexOf(targetNote)] ?? "#00FFD5";
  const accuracy = targets.length > 0 ? Math.round((found.size / targets.length) * 100) : 0;

  return (
    <View style={[styles.root, {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }]}>
      {flashColor && (
        <Animated.View
          style={[styles.flashOverlay, { backgroundColor: flashColor, opacity: flashAnim }]}
          pointerEvents="none"
        />
      )}

      {/* ── Compact header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← BACK</Text>
        </Pressable>
        <Text style={styles.gameLabel}>NOTE HUNT</Text>

        {phase === "playing" && (
          <>
            <Text style={styles.targetLabel}>
              Find all{" "}
              <Text style={{ color: noteColor, fontFamily: "SpaceGrotesk_700Bold" }}>{targetNote}</Text>
            </Text>
            <View style={styles.chainRow}>
              {CHAIN_COLORS.map((c, i) => (
                <View
                  key={i}
                  style={[styles.chainPip, {
                    backgroundColor: i <= chain ? `${c}22` : "transparent",
                    borderColor: i <= chain ? c : "#1c2747",
                  }]}
                >
                  <Text style={[styles.chainPipTxt, { color: i <= chain ? c : "#1c2747" }]}>
                    {["×1", "×2", "×3", "×5"][i]}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={[styles.timer, { color: timeLeft <= 10 ? "#FF3B30" : "#fff" }]}>
              {timeLeft}s
            </Text>
            <Text style={styles.foundTxt}>{found.size}/{targets.length}</Text>
          </>
        )}
      </View>

      {/* ── Pick phase ── */}
      {phase === "pick" && (
        <View style={styles.centered}>
          <Text style={styles.pickPrompt}>Choose your target note</Text>
          <Text style={styles.pickSub}>
            Find every instance across the neck in 45 seconds. Wrong taps cost 3 seconds.
          </Text>
          <View style={styles.noteGrid}>
            {NATURAL_NOTES.map((n, i) => (
              <Pressable
                key={n}
                onPress={() => startGame(n)}
                style={({ pressed }) => [styles.noteBtn, { borderColor: NOTE_COLORS[i], opacity: pressed ? 0.75 : 1 }]}
              >
                <Text style={[styles.noteBtnTxt, { color: NOTE_COLORS[i] }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* ── Playing phase — neck fills all remaining space ── */}
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
              frets={12}
              showOpenStrings
              onTap={handleTap}
              highlightCells={highlights}
            />
          )}
        </View>
      )}

      {/* ── Done phase ── */}
      {phase === "done" && (
        <View style={styles.centered}>
          <Text style={styles.resultTitle}>{found.size === targets.length ? "ALL FOUND!" : `${found.size} / ${targets.length}`}</Text>
          <Text style={[styles.resultBig, { color: noteColor }]}>{accuracy}%</Text>
          {xpGained > 0 && <Text style={styles.xpBadge}>+{xpGained} XP</Text>}
          <Text style={styles.resultSub}>{targetNote} · {targets.length} positions · {45 - timeLeft}s used</Text>
          <View style={styles.resultBtns}>
            <Pressable
              onPress={() => { setPhase("pick"); }}
              style={[styles.resultBtn, styles.resultBtnSecondary]}
            >
              <Text style={styles.resultBtnTxt}>New Note</Text>
            </Pressable>
            <Pressable
              onPress={() => startGame(targetNote)}
              style={[styles.resultBtn, { backgroundColor: noteColor }]}
            >
              <Text style={[styles.resultBtnTxt, { color: "#050816" }]}>Again</Text>
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
  gameLabel: { color: "#00FFD5", fontFamily: "Inter_600SemiBold", fontSize: 9, letterSpacing: 2 },
  targetLabel: { color: "#fff", fontFamily: "Inter_400Regular", fontSize: 13 },
  chainRow: { flexDirection: "row", gap: 4, flex: 1 },
  chainPip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  chainPipTxt: { fontFamily: "Inter_700Bold", fontSize: 10 },
  timer: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 22, letterSpacing: 1, minWidth: 44, textAlign: "right" },
  foundTxt: { color: "#4a5e7a", fontFamily: "Inter_600SemiBold", fontSize: 12, minWidth: 30, textAlign: "right" },

  neckArea: { flex: 1 },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 12 },
  pickPrompt: { color: "#fff", fontFamily: "SpaceGrotesk_700Bold", fontSize: 22 },
  pickSub: { color: "#4a5e7a", fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 18 },
  noteGrid: { flexDirection: "row", gap: 12, marginTop: 8 },
  noteBtn: {
    width: 60, height: 60, borderRadius: 14, borderWidth: 2,
    alignItems: "center", justifyContent: "center", backgroundColor: "#0a0f1e",
  },
  noteBtnTxt: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 24 },

  resultTitle: { color: "#fff", fontFamily: "SpaceGrotesk_700Bold", fontSize: 26 },
  resultBig: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 72, lineHeight: 76 },
  xpBadge: { color: "#A8FF3E", fontFamily: "Inter_700Bold", fontSize: 18 },
  resultSub: { color: "#4a5e7a", fontFamily: "Inter_400Regular", fontSize: 13 },
  resultBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  resultBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  resultBtnSecondary: { backgroundColor: "#0d1525", borderWidth: 1, borderColor: "#1c2747" },
  resultBtnTxt: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14, letterSpacing: 0.5 },
});
