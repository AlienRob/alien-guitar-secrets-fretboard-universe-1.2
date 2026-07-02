/**
 * pick-3d-viewer.tsx — Expo **web preview** only.
 *
 * Renders the pick as a spinning 3D model (ags-pick.glb) dressed in the item's
 * colour + finish, with the AGS alien logo decal on the front face and a name /
 * rarity label on the back — matching the web vault's Pick3DViewer.
 *
 * On native (iOS / Android) Metro resolves pick-3d-viewer.native.tsx instead,
 * which renders the flat 2D PickRender so the Hermes bytecode compiler never
 * sees Three.js code.
 */
import {
  TextDecoder as PolyTextDecoder,
  TextEncoder as PolyTextEncoder,
} from "text-encoding-polyfill";

const _g = globalThis as unknown as { TextDecoder?: unknown; TextEncoder?: unknown };
if (typeof _g.TextDecoder === "undefined") _g.TextDecoder = PolyTextDecoder;
if (typeof _g.TextEncoder === "undefined") _g.TextEncoder = PolyTextEncoder;

import { ContactShadows, Decal, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Asset } from "expo-asset";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";

import type { GearItem } from "@/lib/gear";
import { PickRender } from "./pick-render";

// ─── Constants ────────────────────────────────────────────────────────────────
// Longest pick edge normalised to this many world units so a fixed camera
// frames every pick regardless of the .glb's native scale.
const TARGET_SIZE = 5;
const LABEL_GREEN = "#9bff5a";

const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
};

// ─── WebGL detection ─────────────────────────────────────────────────────────
function isWebGLAvailable(): boolean {
  if (Platform.OS !== "web") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      (window as unknown as { WebGLRenderingContext?: unknown }).WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// ─── GLB loader ───────────────────────────────────────────────────────────────
// Reads the bundled .glb into memory and parses it with GLTFLoader.parse so we
// never hand a file:// URI to three's XHR-based loader (same pattern as
// guitar-model-3d.tsx).
async function loadPickGlb(): Promise<THREE.Group> {
  const asset = Asset.fromModule(require("@/assets/ags-pick.glb"));
  if (!asset.downloaded) await asset.downloadAsync();
  const buffer = await fetch(asset.localUri ?? asset.uri).then((r) =>
    r.arrayBuffer(),
  );
  const head = new Uint8Array(buffer.slice(0, 4));
  const magic = String.fromCharCode(head[0], head[1], head[2], head[3]);
  if (magic !== "glTF")
    throw new Error(
      `Not a glb (got "${magic}", ${buffer.byteLength}B) uri=${asset.uri}`,
    );
  const gltf = await new Promise<GLTF>((resolve, reject) => {
    new GLTFLoader().parse(buffer, "", resolve, reject);
  });
  return gltf.scene;
}

// ─── Canvas-based texture helpers (safe: only called on web) ─────────────────

function stampColorFor(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const gv = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * gv + 0.0722 * b;
  return lum > 0.55 ? "#0b0b14" : "#ffffff";
}

// Recolour the alien logo PNG to a single flat tone using its own alpha as a
// mask. Mirrors the web app's recolorLogo so the 3D decal matches the 2D SVG stamp.
function recolorLogo(image: HTMLImageElement, color: string): THREE.CanvasTexture {
  const w = image.width || 512;
  const h = image.height || 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, w, h);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

// Mirrors buildPickColorMap from the web pick-3d-viewer so the 3D pick's
// surface reads the same as the flat SVG thumbnail.
function buildPickColorMap(item: GearItem): THREE.CanvasTexture {
  const W = 256;
  const H = Math.round((W * 102) / 100);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const X = (x: number) => (x / 100) * W;
  const Y = (y: number) => (y / 102) * H;
  const R = (r: number) => (r / 100) * W;
  const bx = (p: number) => 12 + (p / 100) * 76;
  const by = (p: number) => 6 + (p / 100) * 90;
  const br = (p: number) => (p / 100) * 83;
  const color = item.color ?? "#888";
  const color2 = item.color2;

  ctx.fillStyle = color;
  switch (item.finish) {
    case "holographic": {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#ff5fa2");
      g.addColorStop(0.3, color);
      g.addColorStop(0.6, color2 ?? "#00e5ff");
      g.addColorStop(1, "#a7ff5f");
      ctx.fillStyle = g;
      break;
    }
    case "foil": {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.35, color);
      g.addColorStop(0.55, "#6b7280");
      g.addColorStop(0.75, color);
      g.addColorStop(1, "#e5e7eb");
      ctx.fillStyle = g;
      break;
    }
    case "pearl": {
      const g = ctx.createRadialGradient(X(bx(38)), Y(by(32)), 0, X(bx(38)), Y(by(32)), R(br(75)));
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.45, color);
      g.addColorStop(1, color2 ?? "#60a5fa");
      ctx.fillStyle = g;
      break;
    }
    case "neon": {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, color);
      g.addColorStop(1, color2 ?? color);
      ctx.fillStyle = g;
      break;
    }
    case "galaxy": {
      const g = ctx.createRadialGradient(X(bx(42)), Y(by(36)), 0, X(bx(42)), Y(by(36)), R(br(80)));
      g.addColorStop(0, color2 ?? "#00e5ff");
      g.addColorStop(0.45, color);
      g.addColorStop(1, "#05060f");
      ctx.fillStyle = g;
      break;
    }
    case "marble": {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.55, color);
      g.addColorStop(1, color);
      ctx.fillStyle = g;
      break;
    }
    default:
      // solid / carbon / glitter / prism: use item.color as base
      break;
  }
  ctx.fillRect(0, 0, W, H);

  if (item.finish === "carbon") {
    ctx.save();
    ctx.fillStyle = color2 ?? "#2b3242";
    ctx.translate(W / 2, H / 2);
    ctx.rotate(Math.PI / 4);
    const step = R(9);
    const half = step / 2;
    for (let gx = -W; gx < W; gx += step) {
      for (let gy = -H; gy < H; gy += step) {
        ctx.fillRect(gx, gy, half, half);
        ctx.fillRect(gx + half, gy + half, half, half);
      }
    }
    ctx.restore();
  }

  if (item.finish === "prism") {
    const bars = ["#f43f5e", "#f59e0b", "#22d3ee", "#a78bfa"];
    ctx.globalAlpha = 0.85;
    bars.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(X(6 + i * 22), 0, X(22), H);
    });
    ctx.globalAlpha = 1;
  }

  if (item.finish === "marble") {
    ctx.lineCap = "round";
    ctx.strokeStyle = color2 ?? "#c026d3";
    type Pt = [number, number];
    const vein = (pts: Pt[], w: number, o: number) => {
      ctx.globalAlpha = o;
      ctx.lineWidth = R(w);
      ctx.beginPath();
      ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
      for (let i = 1; i + 2 < pts.length; i += 3) {
        ctx.bezierCurveTo(
          X(pts[i][0]),   Y(pts[i][1]),
          X(pts[i+1][0]), Y(pts[i+1][1]),
          X(pts[i+2][0]), Y(pts[i+2][1]),
        );
      }
      ctx.stroke();
    };
    vein([[16,66],[34,50],[44,60],[58,40],[68,26],[78,30],[88,20]], 2.2, 0.55);
    vein([[12,48],[30,44],[40,28],[58,24],[70,21],[80,16],[90,12]], 1.3, 0.40);
    vein([[22,88],[30,72],[48,74],[60,62]],                         1.1, 0.35);
    ctx.globalAlpha = 1;
  }

  if (item.finish === "glitter" || item.finish === "galaxy") {
    const count = item.finish === "glitter" ? 22 : 16;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < count; i++) {
      const cx2 = 20 + ((i * (item.finish === "glitter" ? 37 : 41)) % 60);
      const cy2 =
        (item.finish === "glitter" ? 18 : 16) +
        ((i * (item.finish === "glitter" ? 53 : 47)) %
          (item.finish === "glitter" ? 70 : 72));
      const r2 = i % (item.finish === "glitter" ? 3 : 4) === 0 ? 1.7 : 0.9;
      ctx.beginPath();
      ctx.arc(X(cx2), Y(cy2), R(r2), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Soft sheen highlight
  const hl = ctx.createRadialGradient(X(40), Y(30), 0, X(40), Y(30), R(20));
  hl.addColorStop(0, "rgba(255,255,255,0.30)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hl;
  ctx.save();
  ctx.translate(X(40), Y(30));
  ctx.scale(1, 0.7);
  ctx.beginPath();
  ctx.arc(0, 0, R(16), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function buildPickMaterial(item: GearItem): THREE.MeshPhysicalMaterial {
  const color = new THREE.Color(item.color ?? "#888");
  const color2 = item.color2 ? new THREE.Color(item.color2) : null;
  const m = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
  });
  switch (item.finish) {
    case "foil":       m.metalness = 1;   m.roughness = 0.22; m.clearcoat = 0.6;  break;
    case "carbon":     m.metalness = 0.5; m.roughness = 0.42; m.clearcoat = 0.5;  break;
    case "neon":       m.emissive = color.clone(); m.emissiveIntensity = 0.85; m.roughness = 0.5; m.clearcoat = 0.3; break;
    case "holographic":
    case "prism":      m.iridescence = 1; m.iridescenceIOR = 1.6; m.metalness = 0.2; m.roughness = 0.25; m.clearcoat = 0.8; break;
    case "pearl":      m.iridescence = 0.7; m.metalness = 0.1; m.roughness = 0.3; m.clearcoat = 1; m.clearcoatRoughness = 0.15; break;
    case "glitter":    m.metalness = 0.35; m.roughness = 0.55; m.clearcoat = 0.5; m.sheen = 1; if (color2) m.sheenColor = color2; break;
    case "galaxy":     m.emissive = (color2 ?? color).clone(); m.emissiveIntensity = 0.25; m.metalness = 0.3; m.roughness = 0.35; m.clearcoat = 0.7; break;
    case "marble":     m.roughness = 0.5; m.clearcoat = 0.6; break;
    default:           m.roughness = 0.5; m.clearcoat = 0.35; break;
  }
  m.map = buildPickColorMap(item);
  m.color = new THREE.Color("#ffffff");
  return m;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function makeBackLabelTexture(item: GearItem): THREE.CanvasTexture {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = LABEL_GREEN;
  ctx.shadowColor = "rgba(140,255,100,0.5)";
  ctx.shadowBlur = 10;

  const cx = S / 2;
  const maxW = S * 0.72;

  ctx.font = "700 58px 'Trebuchet MS', system-ui, sans-serif";
  let nameLines = wrapLines(ctx, item.name, maxW);
  if (nameLines.length > 2) {
    ctx.font = "700 46px 'Trebuchet MS', system-ui, sans-serif";
    nameLines = wrapLines(ctx, item.name, maxW).slice(0, 2);
  }
  const lh = 56;
  let y = S * 0.42 - ((nameLines.length - 1) * lh) / 2;
  for (const ln of nameLines) {
    ctx.fillText(ln, cx, y);
    y += lh;
  }

  ctx.font = "700 38px 'Trebuchet MS', system-ui, sans-serif";
  ctx.fillText((RARITY_LABEL[item.rarity] ?? item.rarity).toUpperCase(), cx, S * 0.64);

  // Stable edition number derived from the item id
  let h = 0;
  for (let i = 0; i < item.id.length; i++) h = (h * 31 + item.id.charCodeAt(i)) >>> 0;
  ctx.font = "600 34px 'Trebuchet MS', system-ui, sans-serif";
  ctx.fillText(`No. ${String((h % 999) + 1).padStart(3, "0")}`, cx, S * 0.75);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

// ─── Three.js scene helpers ───────────────────────────────────────────────────

function RoomEnv() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      env.dispose();
      pmrem.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);
  return null;
}

type Axis = "x" | "y" | "z";
const axisIndex = (a: Axis): number => (a === "x" ? 0 : a === "y" ? 1 : 2);

// ─── Pick mesh (inside Canvas) ────────────────────────────────────────────────
function PickModel({
  glbScene,
  item,
  logoTex,
}: {
  glbScene: THREE.Group;
  item: GearItem;
  logoTex: THREE.Texture;
}) {
  const { geometry, thinAxis, halfThickness, logoSize, normScale, upUnit, upOffset } =
    useMemo(() => {
      let geo: THREE.BufferGeometry | null = null;
      // Bake each mesh's node transform into the cloned vertices.
      glbScene.updateMatrixWorld(true);
      glbScene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!geo && mesh.isMesh) {
          const cloned = mesh.geometry.clone();
          cloned.applyMatrix4(mesh.matrixWorld);
          geo = cloned;
        }
      });

      if (!geo) {
        return {
          geometry: null,
          thinAxis: "z" as Axis,
          halfThickness: 0.1,
          logoSize: 1,
          normScale: 1,
          upUnit: [0, 1, 0] as [number, number, number],
          upOffset: 0,
        };
      }

      const g = geo as THREE.BufferGeometry;
      g.computeBoundingBox();
      const box = g.boundingBox!;
      const center = new THREE.Vector3();
      box.getCenter(center);
      g.translate(-center.x, -center.y, -center.z);
      g.computeBoundingBox();
      const size = new THREE.Vector3();
      g.boundingBox!.getSize(size);

      const dims: [Axis, number][] = [
        ["x", size.x],
        ["y", size.y],
        ["z", size.z],
      ];
      dims.sort((a, b) => a[1] - b[1]);
      const thin = dims[0][0];
      const thickness = dims[0][1];
      const faceMin = dims[1][1];
      const faceAxis = dims[1][0];
      const longAxis = dims[2][0];
      const maxDim = dims[2][1];

      const pos = g.attributes.position as THREE.BufferAttribute;
      const ai = axisIndex(longAxis);
      let sum = 0;
      for (let i = 0; i < pos.count; i++) sum += pos.getComponent(i, ai);
      const upSign = (pos.count ? sum / pos.count : 0) >= 0 ? 1 : -1;

      const bb = g.boundingBox!;
      const uIdx = axisIndex(faceAxis);
      const vIdx = ai;
      const minU = bb.min.getComponent(uIdx);
      const minV = bb.min.getComponent(vIdx);
      const rangeU = size.getComponent(uIdx) || 1;
      const rangeV = size.getComponent(vIdx) || 1;
      const uv = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        uv[i * 2] = (pos.getComponent(i, uIdx) - minU) / rangeU;
        const vRaw = (pos.getComponent(i, vIdx) - minV) / rangeV;
        uv[i * 2 + 1] = upSign > 0 ? vRaw : 1 - vRaw;
      }
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));

      return {
        geometry: g,
        thinAxis: thin,
        halfThickness: thickness / 2,
        logoSize: faceMin * 0.68,
        normScale: TARGET_SIZE / (maxDim || 1),
        upUnit: [
          longAxis === "x" ? upSign : 0,
          longAxis === "y" ? upSign : 0,
          longAxis === "z" ? upSign : 0,
        ] as [number, number, number],
        upOffset: maxDim * 0.13,
      };
    }, [glbScene]);

  const material = useMemo(() => buildPickMaterial(item), [item]);
  const backLabel = useMemo(() => makeBackLabelTexture(item), [item]);

  useEffect(
    () => () => {
      material.map?.dispose();
      material.dispose();
      geometry?.dispose();
      backLabel.dispose();
    },
    [material, geometry, backLabel],
  );

  if (!geometry) return null;

  const groupRot: [number, number, number] =
    thinAxis === "x" ? [0, -Math.PI / 2, 0]
    : thinAxis === "y" ? [Math.PI / 2, 0, 0]
    : [0, 0, 0];

  const unit: [number, number, number] =
    thinAxis === "x" ? [1, 0, 0]
    : thinAxis === "y" ? [0, 1, 0]
    : [0, 0, 1];

  const frontPos: [number, number, number] = [
    unit[0] * halfThickness + upUnit[0] * upOffset,
    unit[1] * halfThickness + upUnit[1] * upOffset,
    unit[2] * halfThickness + upUnit[2] * upOffset,
  ];
  const backPos: [number, number, number] = [
    -unit[0] * halfThickness + upUnit[0] * upOffset,
    -unit[1] * halfThickness + upUnit[1] * upOffset,
    -unit[2] * halfThickness + upUnit[2] * upOffset,
  ];
  const frontRot: [number, number, number] =
    thinAxis === "x" ? [0, Math.PI / 2, 0]
    : thinAxis === "y" ? [-Math.PI / 2, 0, 0]
    : [0, 0, 0];
  const backRot: [number, number, number] =
    thinAxis === "x" ? [0, -Math.PI / 2, 0]
    : thinAxis === "y" ? [Math.PI / 2, 0, 0]
    : [0, Math.PI, 0];
  const decalScale: [number, number, number] = [logoSize, logoSize, halfThickness * 2.2];

  return (
    <group scale={normScale}>
      <group rotation={groupRot}>
        <mesh geometry={geometry} material={material} castShadow>
          <Decal position={frontPos} rotation={frontRot} scale={decalScale}>
            <meshBasicMaterial
              map={logoTex}
              transparent
              polygonOffset
              polygonOffsetFactor={-6}
              depthTest
              depthWrite={false}
              toneMapped={false}
            />
          </Decal>
          <Decal position={backPos} rotation={backRot} scale={decalScale}>
            <meshBasicMaterial
              map={backLabel}
              transparent
              polygonOffset
              polygonOffsetFactor={-6}
              depthTest
              depthWrite={false}
              toneMapped={false}
            />
          </Decal>
        </mesh>
      </group>
    </group>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Pick3DViewer({
  item,
  style,
}: {
  item: GearItem;
  style?: object;
}) {
  const [spinning, setSpinning] = useState(true);
  const [glbScene, setGlbScene] = useState<THREE.Group | null>(null);
  const [logoTex, setLogoTex] = useState<THREE.Texture | null>(null);
  const [failed, setFailed] = useState(false);

  // Load the pick .glb once on mount
  useEffect(() => {
    let active = true;
    loadPickGlb()
      .then((scene) => { if (active) setGlbScene(scene); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  // Load and recolour the logo texture whenever the item's colour changes
  useEffect(() => {
    if (!isWebGLAvailable()) return;
    let active = true;
    const load = async () => {
      const asset = Asset.fromModule(
        require("@/assets/images/ags-pick-logo.png"),
      );
      if (!asset.downloaded) await asset.downloadAsync();
      const base = await new THREE.TextureLoader().loadAsync(
        asset.localUri ?? asset.uri,
      );
      if (!active) { base.dispose(); return; }
      const stamp = stampColorFor(item.color ?? "#333");
      const tinted = recolorLogo(base.image as HTMLImageElement, stamp);
      base.dispose();
      if (active) setLogoTex((prev) => { prev?.dispose(); return tinted; });
    };
    load().catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [item.color]);

  // Dispose logo texture on unmount
  useEffect(() => () => { logoTex?.dispose(); }, [logoTex]);

  if (failed || !isWebGLAvailable()) {
    return (
      <View style={[st.fallback, style]}>
        <PickRender item={item} size={150} />
      </View>
    );
  }

  const ready = glbScene !== null && logoTex !== null;

  return (
    <View style={[st.root, style]}>
      {!ready && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ActivityIndicator color="#7c5cff" style={{ flex: 1 }} />
        </View>
      )}
      {ready && (
        <>
          <Canvas
            camera={{ position: [0, 0.4, 9], fov: 35 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.55} />
            <directionalLight position={[4, 6, 8]} intensity={1.6} />
            <directionalLight position={[-6, 2, 4]} intensity={0.7} color="#7c5cff" />
            <RoomEnv />
            <PickModel glbScene={glbScene} item={item} logoTex={logoTex} />
            <ContactShadows
              position={[0, -3, 0]}
              opacity={0.35}
              scale={9}
              blur={2.6}
              far={5}
            />
            <OrbitControls
              makeDefault
              enablePan={false}
              autoRotate={spinning}
              autoRotateSpeed={2.2}
              enableDamping
            />
          </Canvas>

          <Pressable
            onPress={() => setSpinning((s) => !s)}
            style={st.spinBtn}
          >
            <Text style={st.spinTxt}>{spinning ? "SPINNING" : "SPIN"}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
  },
  fallback: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  spinBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  spinTxt: {
    color: "#ffffff",
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
});
