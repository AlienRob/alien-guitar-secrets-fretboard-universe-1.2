import React from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";

import { getNoteValue } from "@/lib/musicTheory";

const DEGREE_LABEL: Record<number, string> = {
  0: "R",   1: "b2",  2: "2",   3: "b3",
  4: "3",   5: "4",   6: "b5",  7: "5",
  8: "b6",  9: "6",   10: "b7", 11: "7",
};

const STRING_W = [0.9, 1.1, 1.4, 1.7, 2.0, 2.3];

interface MiniNeckProps {
  rootPitch: number;
  scalePitches: number[];
  startFret: number;
  endFret: number;
  color: string;
}

export default function MiniNeck({
  rootPitch, scalePitches, startFret, endFret, color,
}: MiniNeckProps) {
  const STRINGS   = 6;
  const fretCount = endFret - startFret + 1;
  const SY        = 18;
  const FX        = 26;
  const PL        = 6;
  const PT        = 10;
  const NUM_H     = 14;
  const R         = 8.5;

  const W = PL + fretCount * FX + 6;
  const H = PT + (STRINGS - 1) * SY + NUM_H;

  type Dot = { x: number; y: number; isRoot: boolean; label: string };
  const dots: Dot[] = [];

  for (let str = 0; str < STRINGS; str++) {
    for (let fret = startFret; fret <= endFret; fret++) {
      const pitch = getNoteValue(str, fret) % 12;
      if (scalePitches.includes(pitch)) {
        const interval = (pitch - rootPitch + 12) % 12;
        dots.push({
          x: PL + (fret - startFret + 0.5) * FX,
          y: PT + str * SY,
          isRoot: interval === 0,
          label: DEGREE_LABEL[interval] ?? "?",
        });
      }
    }
  }

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={W} height={H}>
        {Array.from({ length: STRINGS }, (_, s) => (
          <Line key={`s${s}`}
            x1={PL} y1={PT + s * SY} x2={W - 3} y2={PT + s * SY}
            stroke="#4a4a4a" strokeWidth={STRING_W[s]}
          />
        ))}

        {Array.from({ length: fretCount + 1 }, (_, i) => (
          <Line key={`f${i}`}
            x1={PL + i * FX} y1={PT}
            x2={PL + i * FX} y2={PT + (STRINGS - 1) * SY}
            stroke={i === 0 ? "#777" : "#333"}
            strokeWidth={i === 0 ? 2.5 : 1}
          />
        ))}

        {Array.from({ length: fretCount }, (_, i) => (
          <SvgText key={`fn${i}`}
            x={PL + (i + 0.5) * FX}
            y={PT + (STRINGS - 1) * SY + 11}
            fontSize={7} fill="#666" textAnchor="middle">
            {startFret + i}
          </SvgText>
        ))}

        {dots.map((d, i) => (
          <G key={i}>
            <Circle cx={d.x} cy={d.y} r={R}
              fill={d.isRoot ? color : "rgba(255,255,255,0.14)"}
              stroke={d.isRoot ? color : "rgba(255,255,255,0.52)"}
              strokeWidth={d.isRoot ? 0 : 1.4}
            />
            <SvgText
              x={d.x} y={d.y + 3.5}
              fontSize={d.label.length > 1 ? 5 : 6.5}
              fill={d.isRoot ? "#000" : "rgba(255,255,255,0.9)"}
              textAnchor="middle"
              fontWeight="bold">
              {d.label}
            </SvgText>
          </G>
        ))}
      </Svg>
    </View>
  );
}
