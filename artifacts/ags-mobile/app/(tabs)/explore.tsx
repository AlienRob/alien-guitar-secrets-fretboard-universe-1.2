import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  PhotoFretboard as Fretboard,
  BOTTOM_LBL_H,
  FRET_WIRE_Y,
  PHOTO_H,
  PHOTO_W,
  type HighlightCell,
} from "@/components/photo-fretboard";
import { ScreenBg } from "@/components/screen-bg";
import { useColors } from "@/hooks/useColors";
import { playNote, playSequence } from "@/lib/audio";
import {
  buildCagedShape,
  build3npsShape,
  buildPentBox,
  CAGED_SCALES,
  CHORD_SECTIONS,
  CHORDS,
  chordSymbol,
  getNoteName,
  getNoteValue,
  parseNote,
  PENT_BOX_COUNT,
  PENT_SCALES,
  ROOT_OPTIONS,
  rootPrefersFlats,
  SCALE_SECTIONS,
  SCALES,
  STRINGS,
  type ScaleShape,
} from "@/lib/musicTheory";

// ─── Types & constants ────────────────────────────────────────────────────────

type Mode     = "scale" | "chord";
type LabelMode = "degrees" | "notes" | "off";
type System    = "caged" | "3nps";
type EffSystem = "caged" | "3nps" | "pent";

const PENT_SCALE_SET = new Set(PENT_SCALES);

const LABEL_CYCLE: LabelMode[] = ["degrees", "notes", "off"];
const LABEL_DISPLAY: Record<LabelMode, string> = {
  degrees: "Degrees", notes: "Notes", off: "Off",
};

const DEGREE: Record<number, string> = {
  0:"1", 1:"b2", 2:"2", 3:"b3", 4:"3", 5:"4",
  6:"b5", 7:"5", 8:"b6", 9:"6", 10:"b7", 11:"7",
};

const MINOR_BASED = new Set([
  "Minor", "m7", "m7b5", "dim", "dim7", "m6", "m9", "m11", "m13", "madd9",
]);
function cagedBaseForChord(name: string): string {
  return MINOR_BASED.has(name) ? "Natural Minor" : "Major";
}

const STRING_COL_LABELS = ["E", "A", "D", "G", "B", "e"];

const MAJOR_SCALES = new Set([
  "Major", "Lydian", "Mixolydian", "Major Pentatonic",
  "MM4 Lydian b7", "HM3 Ionian #5", "Whole Tone",
]);
const MINOR_SCALES = new Set([
  "Natural Minor", "Harmonic Minor", "Melodic Minor",
  "Dorian", "Phrygian", "Aeolian", "Locrian", "Minor Pentatonic", "Blues",
  "HM2 Locrian #6", "HM4 Ukrainian Dorian", "HM5 Phrygian Dominant",
  "HM6 Lydian #2", "HM7 Altered Dim",
  "MM2 Dorian b2", "MM3 Lydian Aug", "MM5 Mixolydian b6",
  "MM6 Aeolian b5", "MM7 Super Locrian",
]);

const LEFT_W  = 44;   // left strip width
const RIGHT_W = 56;   // right strip width
const STRIP_BG = "#000000";
const VIEW_FRETS   = 5;  // always show exactly 5 frets
const MAX_VIEW_START = 19; // last window: frets 20-24

function normCaged(s: ScaleShape): ScaleShape {
  if (s.system === "caged" && s.minFret >= 12) {
    const notes   = s.notes.map((n) => ({ ...n, fret: n.fret - 12 }));
    const minFret = Math.min(...notes.map((n) => n.fret));
    const maxFret = Math.max(...notes.map((n) => n.fret));
    return { ...s, notes, minFret, maxFret };
  }
  return s;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();

  const topPad    = Platform.OS === "web" ? 6 : insets.top;
  const bottomPad = Platform.OS === "web" ? 64 : insets.bottom;

  // ── State ─────────────────────────────────────────────────────────────────
  const [root, setRoot]                         = useState("C");
  const [mode, setMode]                         = useState<Mode>("scale");
  const [scaleName, setScaleName]               = useState("Major");
  const [chordName, setChordName]               = useState("Major");
  const [system, setSystem]                     = useState<System>("caged");
  const [positionIdx, setPositionIdx]           = useState(0);
  const [viewStartFret, setViewStartFret]       = useState(0);
  const [labelMode, setLabelMode]               = useState<LabelMode>("degrees");
  const [typePickerOpen, setTypePickerOpen]     = useState(false);
  const [rootPickerOpen, setRootPickerOpen]     = useState(false);
  const [boardAreaH, setBoardAreaH]             = useState(0);

  const useSharps = !rootPrefersFlats(root);
  const rootPitch = parseNote(root).pitch;

  // ── Effective system ──────────────────────────────────────────────────────
  // Pentatonic/Blues always use 5-box system regardless of the user's CAGED/3NPS preference.
  const effectiveSystem: EffSystem = useMemo(() => {
    if (mode === "chord") return "caged";
    if (PENT_SCALE_SET.has(scaleName)) return "pent";
    if (system === "caged" && CAGED_SCALES.includes(scaleName)) return "caged";
    return "3nps";
  }, [mode, system, scaleName]);

  // ── How many shape positions exist ────────────────────────────────────────
  const positionCount = useMemo(() => {
    if (effectiveSystem === "pent")  return PENT_BOX_COUNT;
    if (effectiveSystem === "caged") return 5;
    return SCALES[scaleName]?.length ?? 7;
  }, [effectiveSystem, scaleName]);

  const safeIdx = Math.min(positionIdx, positionCount - 1);

  // ── Build the active shape ────────────────────────────────────────────────
  const shape = useMemo<ScaleShape | null>(() => {
    try {
      if (mode === "scale") {
        if (effectiveSystem === "pent") {
          return buildPentBox(root, scaleName, safeIdx % PENT_BOX_COUNT);
        }
        if (effectiveSystem === "caged") {
          return normCaged(buildCagedShape(root, scaleName, safeIdx % 5));
        }
        const count = SCALES[scaleName]?.length ?? 7;
        return build3npsShape(root, scaleName, safeIdx % count);
      }
      // Chord mode: CAGED shape filtered to chord-tone intervals
      const baseScale = cagedBaseForChord(chordName);
      const full      = normCaged(buildCagedShape(root, baseScale, safeIdx % 5));
      const intervals = new Set(CHORDS[chordName] ?? []);
      const filtered  = full.notes.filter((n) => intervals.has(n.interval));
      if (filtered.length === 0) return full;
      const minFret = Math.min(...filtered.map((n) => n.fret));
      const maxFret = Math.max(...filtered.map((n) => n.fret));
      return { ...full, notes: filtered, minFret, maxFret };
    } catch { return null; }
  }, [root, mode, scaleName, chordName, effectiveSystem, safeIdx]);

  // Auto-scroll the fret window to the active shape when position/key/scale changes
  useEffect(() => {
    if (shape) setViewStartFret(Math.max(0, Math.min(shape.minFret, MAX_VIEW_START)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionIdx, scaleName, chordName, root, mode, system]);

  // ── Highlight cells ───────────────────────────────────────────────────────
  const highlightCells = useMemo<HighlightCell[]>(() => {
    if (!shape) return [];
    return shape.notes.map((n) => {
      let label: string | undefined;
      if (labelMode === "degrees")
        label = DEGREE[n.interval] ?? `${n.interval}`;
      else if (labelMode === "notes")
        label = getNoteName(getNoteValue(n.string, n.fret), useSharps);
      return {
        string: 5 - n.string,
        fret: n.fret,
        colour: n.isRoot ? "#ff3b3b" : "#3b8aff",
        label,
      };
    });
  }, [shape, labelMode, useSharps]);

  // ── Geometry for the fixed 5-fret window ─────────────────────────────────
  const sfPct  = viewStartFret > 0 ? (FRET_WIRE_Y[viewStartFret - 1] ?? 0) : 0;
  const endPct = FRET_WIRE_Y[Math.min(viewStartFret + VIEW_FRETS, 24)] ?? 115.4;

  const maxDwHeight = boardAreaH > 0
    ? Math.floor((boardAreaH - BOTTOM_LBL_H) * PHOTO_W * 100 / (PHOTO_H * (endPct - sfPct)))
    : screenW * 4;
  // Keep the fretboard clear of both strips with deliberate breathing room.
  // screenW * 1.3 is the scale-to-height upper bound; the strip gap is the hard cap.
  const displayWidth = Math.min(Math.round(screenW * 1.3), maxDwHeight, screenW - LEFT_W - RIGHT_W - 28);

  // ── Fret number Y positions for the left strip ────────────────────────────
  const fretCenterYs = useMemo<{ fret: number; y: number }[]>(() => {
    if (boardAreaH === 0) return [];
    const DH   = displayWidth * PHOTO_H / PHOTO_W;
    const sfPx = viewStartFret > 0
      ? Math.floor(DH * (FRET_WIRE_Y[viewStartFret - 1] ?? 0) / 100) : 0;
    const visH = Math.ceil(DH * endPct / 100) - sfPx + BOTTOM_LBL_H;
    const fbTop = (boardAreaH - visH) / 2;
    const result: { fret: number; y: number }[] = [];
    for (let k = 1; k <= VIEW_FRETS; k++) {
      const fi   = viewStartFret + k;
      const prev = Math.floor(DH * (FRET_WIRE_Y[fi - 1] ?? 0) / 100) - sfPx;
      const curr = Math.floor(DH * (FRET_WIRE_Y[fi]     ?? 0) / 100) - sfPx;
      result.push({ fret: fi, y: fbTop + (prev + curr) / 2 });
    }
    return result;
  }, [boardAreaH, displayWidth, viewStartFret, endPct]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleTap = useCallback((col: number, fret: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playNote(getNoteValue(5 - col, fret));
  }, []);

  const playSelection = useCallback(() => {
    if (!shape || shape.notes.length === 0) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mode === "scale") {
      const vals = [...shape.notes]
        .map((n) => STRINGS[n.string].open + n.fret)
        .sort((a, b) => a - b);
      playSequence([...new Set(vals)], 140);
    } else {
      const vals = [...shape.notes]
        .sort((a, b) => b.string - a.string)
        .map((n) => STRINGS[n.string].open + n.fret);
      playSequence(vals, 38);
    }
  }, [shape, mode]);

  // Left strip: scroll the 5-fret view window by 1 fret
  const scrollFret = useCallback((dir: -1 | 1) => {
    setViewStartFret((v) => Math.max(0, Math.min(v + dir, MAX_VIEW_START)));
  }, []);

  // Right strip: cycle through shape positions (CAGED shapes / NPS patterns)
  const cyclePosition = useCallback((dir: -1 | 1) => {
    setPositionIdx((p) => (p + dir + positionCount) % positionCount);
  }, [positionCount]);

  const cycleLabel = useCallback(() => {
    setLabelMode((m) => LABEL_CYCLE[(LABEL_CYCLE.indexOf(m) + 1) % LABEL_CYCLE.length]);
  }, []);

  const cycleSystem = useCallback(() => {
    setSystem((s) => (s === "caged" ? "3nps" : "caged"));
    setPositionIdx(0);
  }, []);

  const positionLabel  = shape?.label ?? `Pos ${safeIdx + 1}`;
  const isMajorSounding = MAJOR_SCALES.has(scaleName);
  const isMinorSounding = MINOR_SCALES.has(scaleName);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScreenBg>
      <View style={{ flex: 1 }}>

        {/* ══ TOP BAR ══════════════════════════════════════════════════════ */}
        <View style={[styles.topBar, { paddingTop: topPad }]}>
          {/* Scale / Chord mode tabs */}
          <View style={styles.modeTabs}>
            {(["scale", "chord"] as Mode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => { setMode(m); setPositionIdx(0); }}
                style={[
                  styles.modeTab,
                  mode === m && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
                ]}
              >
                <Text style={[styles.modeTabText, { color: mode === m ? colors.accent : colors.mutedForeground }]}>
                  {m === "scale" ? "Scale" : "Chord"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* System badge — scale mode only.
              Pent scales: static "5 Boxes" label (can't switch).
              Others: tap to toggle CAGED ↔ 3 NPS. */}
          {mode === "scale" && (
            <Pressable
              onPress={effectiveSystem !== "pent" ? cycleSystem : undefined}
              style={[styles.sysBadge, { backgroundColor: colors.card + "EE", borderColor: colors.border }]}
            >
              <Text style={[styles.sysBadgeText, {
                color: effectiveSystem === "pent"
                  ? colors.mutedForeground
                  : effectiveSystem === "caged"
                    ? colors.accent
                    : colors.foreground,
              }]}>
                {effectiveSystem === "pent" ? "5 Boxes"
                  : effectiveSystem === "caged" ? "CAGED" : "3 NPS"}
              </Text>
            </Pressable>
          )}
        </View>

        {/* ══ SELECTION ROW — KEY on left, type name on right ═════════════ */}
        <View style={[styles.selRow, { borderBottomColor: colors.border }]}>
          {/* KEY button — always visible, opens root picker modal */}
          <Pressable
            onPress={() => setRootPickerOpen(true)}
            style={[styles.keyBtn, { borderColor: colors.border, backgroundColor: colors.card + "99" }]}
          >
            <Text style={[styles.keyBtnLabel, { color: colors.mutedForeground }]}>KEY</Text>
            <Text style={[styles.keyBtnValue, { color: colors.accent }]}>{root}</Text>
          </Pressable>

          {/* Scale / chord type — opens type picker */}
          <Pressable
            onPress={() => setTypePickerOpen(true)}
            style={styles.selTypeBtn}
          >
            <Text style={[styles.selName, { color: colors.foreground }]} numberOfLines={1}>
              {mode === "scale" ? scaleName : chordName}
            </Text>
            <Text style={[styles.selChevron, { color: colors.mutedForeground }]}>›</Text>
          </Pressable>
        </View>

        {/* ══ BOARD ZONE ═══════════════════════════════════════════════════ */}
        <View
          style={styles.boardArea}
          onLayout={(e) => setBoardAreaH(e.nativeEvent.layout.height)}
        >
          <Fretboard
            pcInfo={{}}
            rootPitch={rootPitch}
            useSharps={useSharps}
            frets={VIEW_FRETS}
            startFret={viewStartFret}
            onTap={handleTap}
            showOpenNames={false}
            highlightCells={highlightCells}
            displayWidth={displayWidth}
          />

          {/* ── Left strip: fret number labels + scroll arrows ─────────── */}
          <View style={styles.leftStrip}>
            <Pressable
              onPress={() => scrollFret(-1)}
              disabled={viewStartFret === 0}
              style={styles.navBtn}
              hitSlop={12}
            >
              <Text style={[
                styles.navArrow,
                { color: viewStartFret === 0 ? "rgba(255,255,255,0.2)" : colors.foreground },
              ]}>▲</Text>
            </Pressable>

            {/* Fret number labels, absolutely positioned at each fret centre */}
            {fretCenterYs.map(({ fret, y }) => (
              <Text
                key={fret}
                style={[styles.fretNum, { color: colors.mutedForeground, top: y - 9 }]}
              >
                {fret}
              </Text>
            ))}

            <Pressable
              onPress={() => scrollFret(1)}
              disabled={viewStartFret === MAX_VIEW_START}
              style={styles.navBtn}
              hitSlop={12}
            >
              <Text style={[
                styles.navArrow,
                { color: viewStartFret === MAX_VIEW_START ? "rgba(255,255,255,0.2)" : colors.foreground },
              ]}>▼</Text>
            </Pressable>
          </View>

          {/* ── Right strip: pickers on top, position cycling below ───── */}
          <View style={styles.rightStrip}>
            {/* Scale / Chord type — taps open the picker sheet */}
            <Pressable
              onPress={() => setTypePickerOpen(true)}
              style={[styles.sideBox, { borderColor: colors.border, backgroundColor: colors.card + "CC" }]}
            >
              <Text style={[styles.sideBoxLabel, { color: colors.mutedForeground }]}>
                {mode === "scale" ? "SCALE" : "CHORD"}
              </Text>
              <Text numberOfLines={2} style={[styles.sideBoxValue, { color: colors.foreground }]}>
                {mode === "scale"
                  ? (scaleName.length > 8 ? scaleName.split(" ")[0] : scaleName)
                  : (chordSymbol(chordName) || "maj")}
              </Text>
            </Pressable>

            {/* Labels cycle */}
            <Pressable
              onPress={cycleLabel}
              style={[styles.sideBox, { borderColor: colors.border, backgroundColor: colors.card + "CC" }]}
            >
              <Text style={[styles.sideBoxLabel, { color: colors.mutedForeground }]}>LABELS</Text>
              <Text style={[styles.sideBoxValue, { color: colors.foreground }]}>
                {LABEL_DISPLAY[labelMode]}
              </Text>
            </Pressable>

            <View style={styles.rightDivider} />

            {/* Position cycling */}
            <Pressable onPress={() => cyclePosition(-1)} style={styles.navBtn} hitSlop={12}>
              <Text style={[styles.navArrow, { color: colors.foreground }]}>▲</Text>
            </Pressable>
            <Text numberOfLines={2} style={[styles.posLabel, { color: colors.foreground }]}>
              {positionLabel}
            </Text>
            <Pressable onPress={() => cyclePosition(1)} style={styles.navBtn} hitSlop={12}>
              <Text style={[styles.navArrow, { color: colors.foreground }]}>▼</Text>
            </Pressable>

            <View style={styles.rightDivider} />

            {/* Play */}
            <Pressable
              onPress={playSelection}
              style={({ pressed }) => [
                styles.playBtn,
                { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.playBtnText, { color: colors.accentForeground }]}>▶</Text>
            </Pressable>
          </View>
        </View>

        {/* ══ BOTTOM BAR ═══════════════════════════════════════════════════ */}
        <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>

          {/* Maj / Min quick-switch + position counter */}
          <View style={styles.bottomCtrlRow}>
            {mode === "scale" ? (
              <View style={styles.majMinRow}>
                <Pressable
                  onPress={() => { setScaleName("Major"); setPositionIdx(0); }}
                  style={[styles.majMinBtn, {
                    borderColor:     isMajorSounding ? colors.accent : colors.border,
                    backgroundColor: isMajorSounding ? colors.accent + "30" : "transparent",
                  }]}
                >
                  <Text style={[styles.majMinText, {
                    color: isMajorSounding ? colors.accent : colors.mutedForeground,
                  }]}>Maj</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setScaleName("Natural Minor"); setPositionIdx(0); }}
                  style={[styles.majMinBtn, {
                    borderColor:     isMinorSounding ? colors.accent : colors.border,
                    backgroundColor: isMinorSounding ? colors.accent + "30" : "transparent",
                  }]}
                >
                  <Text style={[styles.majMinText, {
                    color: isMinorSounding ? colors.accent : colors.mutedForeground,
                  }]}>Min</Text>
                </Pressable>
              </View>
            ) : <View style={{ width: 92 }} />}

            <Text style={[styles.posCounter, { color: colors.mutedForeground }]}>
              {safeIdx + 1} / {positionCount}
            </Text>
          </View>

          {/* Key strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.keyStrip}
          >
            <Text style={[styles.keyStripLabel, { color: "#4a5e7a" }]}>KEY</Text>
            {ROOT_OPTIONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => { setRoot(r); }}
                style={[styles.keyChip, {
                  backgroundColor: r === root ? colors.accent       : colors.card + "99",
                  borderColor:     r === root ? colors.accent       : colors.border,
                  borderRadius:    colors.radius,
                }]}
              >
                <Text style={[styles.keyChipText, {
                  color: r === root ? colors.accentForeground : colors.foreground,
                }]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* ══ TYPE PICKER SHEET ════════════════════════════════════════════════ */}
      <Modal
        visible={typePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTypePickerOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setTypePickerOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]}>

            {/* Scale / Chord toggle */}
            <View style={[styles.sheetModeRow, { borderBottomColor: colors.border }]}>
              {(["scale", "chord"] as Mode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => { setMode(m); setPositionIdx(0); }}
                  style={[
                    styles.sheetModeBtn,
                    mode === m && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
                  ]}
                >
                  <Text style={[styles.sheetModeBtnText, {
                    color: mode === m ? colors.accent : colors.mutedForeground,
                  }]}>
                    {m === "scale" ? "Scale" : "Chord"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Organised sectioned list */}
            <ScrollView>
              {(mode === "scale" ? SCALE_SECTIONS : CHORD_SECTIONS).map((section) => (
                <View key={section.header}>
                  <Text style={[styles.sectionHeader, {
                    color: colors.mutedForeground,
                    borderBottomColor: colors.border,
                  }]}>
                    {section.header}
                  </Text>
                  <View style={styles.sectionGrid}>
                    {section.items.map((n) => {
                      const active = n === (mode === "scale" ? scaleName : chordName);
                      const label  = mode === "chord" ? (chordSymbol(n) || "maj") : n;
                      return (
                        <Pressable
                          key={n}
                          onPress={() => {
                            if (mode === "scale") setScaleName(n);
                            else setChordName(n);
                            setPositionIdx(0);
                            setTypePickerOpen(false);
                          }}
                          style={[styles.sheetChoice, {
                            backgroundColor: active ? colors.accent     : colors.background,
                            borderColor:     active ? colors.accent     : colors.border,
                          }]}
                        >
                          <Text style={[styles.sheetChoiceText, {
                            color: active ? colors.accentForeground : colors.foreground,
                          }]}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
              <View style={{ height: 24 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      {/* ══ ROOT PICKER SHEET ════════════════════════════════════════════════ */}
      <Modal
        visible={rootPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRootPickerOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setRootPickerOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.rootSheetTitle, { color: colors.foreground }]}>Choose Key</Text>
            <View style={styles.rootGrid}>
              {ROOT_OPTIONS.map((r) => {
                const active = r === root;
                return (
                  <Pressable
                    key={r}
                    onPress={() => { setRoot(r); setRootPickerOpen(false); }}
                    style={[styles.rootChoice, {
                      backgroundColor: active ? colors.accent     : colors.background,
                      borderColor:     active ? colors.accent     : colors.border,
                    }]}
                  >
                    <Text style={[styles.rootChoiceText, {
                      color: active ? colors.accentForeground : colors.foreground,
                    }]}>
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ height: 24 }} />
          </Pressable>
        </Pressable>
      </Modal>

    </ScreenBg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modeTabs:    { flexDirection: "row" },
  modeTab:     { paddingHorizontal: 14, paddingVertical: 10 },
  modeTabText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  sysBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sysBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 0.5 },

  // ── Selection row ─────────────────────────────────────────────────────────
  selRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  // KEY button on the left of the selection row
  keyBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: "center",
    minWidth: 54,
  },
  keyBtnLabel: { fontSize: 8,  fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  keyBtnValue: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", lineHeight: 22 },
  // Scale/chord type button fills remaining row space
  selTypeBtn:  { flex: 1, flexDirection: "row", alignItems: "center" },
  selName:     { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", flex: 1 },
  selShape:    { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  selChevron:  { fontSize: 20, lineHeight: 22 },

  // ── Board area ────────────────────────────────────────────────────────────
  boardArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  // ── Left strip: fret scroll ───────────────────────────────────────────────
  leftStrip: {
    position: "absolute",
    left: 0, top: 0, bottom: 0,
    width: LEFT_W,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    backgroundColor: STRIP_BG,
  },

  // ── Right strip: position cycling + pickers ───────────────────────────────
  rightStrip: {
    position: "absolute",
    right: 0, top: 0, bottom: 0,
    width: RIGHT_W,
    alignItems: "stretch",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 5,
    backgroundColor: STRIP_BG,
  },

  // Shared nav button + arrow text
  navBtn:   { padding: 8 },
  navArrow: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center" },

  // Fret numbers: absolutely positioned within left strip
  fretNum: {
    position: "absolute",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    width: LEFT_W,
  },

  // Position label in right strip
  posLabel: {
    fontSize: 9,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    paddingHorizontal: 4,
    lineHeight: 12,
  },

  rightDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginHorizontal: 8,
    marginVertical: 2,
  },

  sideBox: {
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 4,
    paddingVertical: 6,
    paddingHorizontal: 3,
    alignItems: "center",
  },
  sideBoxLabel: { fontSize: 7,  fontFamily: "Inter_600SemiBold", letterSpacing: 1.0 },
  sideBoxValue: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", marginTop: 2, textAlign: "center" },

  playBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center",
  },
  playBtnText: { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },

  // ── Bottom bar ────────────────────────────────────────────────────────────
  bottomBar: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  bottomCtrlRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 8,
    justifyContent: "space-between",
  },
  majMinRow: { flexDirection: "row", gap: 6 },
  majMinBtn: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  majMinText:  { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" },
  posCounter:  { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  keyStrip: {
    paddingHorizontal: 10,
    paddingBottom: 6,
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  keyStripLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginRight: 2,
  },
  keyChip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 46,
  },
  keyChipText: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },

  // ── Type picker sheet ─────────────────────────────────────────────────────
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 4,
    maxHeight: "75%",
  },
  sheetModeRow:      { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
  sheetModeBtn:      { flex: 1, alignItems: "center", paddingVertical: 14 },
  sheetModeBtnText:  { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },

  sectionHeader: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  sectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  sheetChoice: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 68,
    alignItems: "center",
  },
  sheetChoiceText: { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" },

  // ── Root picker sheet ─────────────────────────────────────────────────────
  rootSheetTitle: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    paddingTop: 20,
    paddingBottom: 12,
  },
  rootGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  rootChoice: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 14,
    minWidth: 68,
    alignItems: "center",
  },
  rootChoiceText: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
});
