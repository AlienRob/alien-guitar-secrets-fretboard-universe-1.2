import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Decal, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const LOGO_URL = "/__mockup/images/ags-logo.png";

export type PickFinish =
  | "solid"
  | "foil"
  | "carbon"
  | "neon"
  | "holographic"
  | "prism"
  | "pearl"
  | "glitter"
  | "galaxy"
  | "marble";

export interface PickDef {
  id: string;
  name: string;
  rarity: string;
  finish: PickFinish;
  color: string;
  color2?: string;
}

// ── Room environment ──────────────────────────────────────────────────────────
function RoomEnv() {
  const { gl, scene } = useThree();
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

// ── Geometry ──────────────────────────────────────────────────────────────────
function buildPickGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(50, 96);
  shape.bezierCurveTo(72, 96, 88, 81, 88, 59);
  shape.bezierCurveTo(88, 31, 62, 10, 50, 6);
  shape.bezierCurveTo(38, 10, 12, 31, 12, 59);
  shape.bezierCurveTo(12, 81, 28, 96, 50, 96);

  const uvGen: THREE.UVGenerator = {
    generateTopUV(_g, v, a, b, c) {
      return [
        new THREE.Vector2(v[a * 3] / 100, v[a * 3 + 1] / 102),
        new THREE.Vector2(v[b * 3] / 100, v[b * 3 + 1] / 102),
        new THREE.Vector2(v[c * 3] / 100, v[c * 3 + 1] / 102),
      ];
    },
    generateSideWallUV(_g, v, a, b, c, d) {
      return [
        new THREE.Vector2(v[a * 3] / 100, v[a * 3 + 1] / 102),
        new THREE.Vector2(v[b * 3] / 100, v[b * 3 + 1] / 102),
        new THREE.Vector2(v[c * 3] / 100, v[c * 3 + 1] / 102),
        new THREE.Vector2(v[d * 3] / 100, v[d * 3 + 1] / 102),
      ];
    },
  };

  return new THREE.ExtrudeGeometry(shape, {
    depth: 7,
    bevelEnabled: true,
    bevelThickness: 2.2,
    bevelSize: 2.2,
    bevelSegments: 4,
    curveSegments: 64,
    UVGenerator: uvGen,
  });
}

// ── Color map ─────────────────────────────────────────────────────────────────
function buildPickColorMap(item: PickDef): THREE.CanvasTexture {
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
  const color = item.color;
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
      ctx.fillStyle = color;
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
    for (let gx = -W; gx < W; gx += step)
      for (let gy = -H; gy < H; gy += step) {
        ctx.fillRect(gx, gy, half, half);
        ctx.fillRect(gx + half, gy + half, half, half);
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
    const vein = (pts: [number, number][], w: number, o: number) => {
      ctx.globalAlpha = o;
      ctx.lineWidth = R(w);
      ctx.beginPath();
      ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
      for (let i = 1; i + 2 < pts.length; i += 3)
        ctx.bezierCurveTo(X(pts[i][0]), Y(pts[i][1]), X(pts[i+1][0]), Y(pts[i+1][1]), X(pts[i+2][0]), Y(pts[i+2][1]));
      ctx.stroke();
    };
    vein([[16,66],[34,50],[44,60],[58,40],[68,26],[78,30],[88,20]], 2.2, 0.55);
    vein([[12,48],[30,44],[40,28],[58,24],[70,21],[80,16],[90,12]], 1.3, 0.4);
    vein([[22,88],[30,72],[48,74],[60,62]], 1.1, 0.35);
    ctx.globalAlpha = 1;
  }

  if (item.finish === "glitter" || item.finish === "galaxy") {
    const count = item.finish === "glitter" ? 22 : 16;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < count; i++) {
      const cx = 20 + ((i * (item.finish === "glitter" ? 37 : 41)) % 60);
      const cy = (item.finish === "glitter" ? 18 : 16) + ((i * (item.finish === "glitter" ? 53 : 47)) % (item.finish === "glitter" ? 70 : 72));
      const r = i % (item.finish === "glitter" ? 3 : 4) === 0 ? 1.7 : 0.9;
      ctx.beginPath();
      ctx.arc(X(cx), Y(cy), R(r), 0, Math.PI * 2);
      ctx.fill();
    }
  }

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

// ── Material ──────────────────────────────────────────────────────────────────
function buildPickMaterial(item: PickDef): THREE.MeshPhysicalMaterial {
  const color = new THREE.Color(item.color);
  const color2 = item.color2 ? new THREE.Color(item.color2) : null;
  const m = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
  });
  switch (item.finish) {
    case "foil":    m.metalness = 1; m.roughness = 0.22; m.clearcoat = 0.6; break;
    case "carbon":  m.metalness = 0.5; m.roughness = 0.42; m.clearcoat = 0.5; break;
    case "neon":    m.emissive = color.clone(); m.emissiveIntensity = 0.85; m.roughness = 0.5; m.clearcoat = 0.3; break;
    case "holographic":
    case "prism":   m.iridescence = 1; m.iridescenceIOR = 1.6; m.metalness = 0.2; m.roughness = 0.25; m.clearcoat = 0.8; break;
    case "pearl":   m.iridescence = 0.7; m.metalness = 0.1; m.roughness = 0.3; m.clearcoat = 1; m.clearcoatRoughness = 0.15; break;
    case "glitter": m.metalness = 0.35; m.roughness = 0.55; m.clearcoat = 0.5; m.sheen = 1; if (color2) m.sheenColor = color2; break;
    case "galaxy":  m.emissive = (color2 ?? color).clone(); m.emissiveIntensity = 0.25; m.metalness = 0.3; m.roughness = 0.35; m.clearcoat = 0.7; break;
    case "marble":  m.roughness = 0.5; m.clearcoat = 0.6; break;
    default:        m.roughness = 0.5; m.clearcoat = 0.35; break;
  }
  m.map = buildPickColorMap(item);
  m.color = new THREE.Color("#ffffff");
  return m;
}

// ── Back label ────────────────────────────────────────────────────────────────
const LABEL_GREEN = "#9bff5a";
const RARITY_LABEL: Record<string, string> = {
  common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary", mythic: "Mythic",
};
function pickEditionNo(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `No. ${String((h % 999) + 1).padStart(3, "0")}`;
}
function makeBackLabelTexture(item: PickDef): THREE.CanvasTexture {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = LABEL_GREEN;
  ctx.shadowColor = "rgba(140,255,100,0.5)"; ctx.shadowBlur = 10;
  const cx = S / 2; const maxW = S * 0.72;
  ctx.font = "700 58px 'Trebuchet MS', system-ui, sans-serif";
  const words = item.name.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  const lh = 56;
  let y = S * 0.42 - ((lines.length - 1) * lh) / 2;
  for (const ln of lines) { ctx.fillText(ln, cx, y); y += lh; }
  ctx.font = "700 38px 'Trebuchet MS', system-ui, sans-serif";
  ctx.fillText((RARITY_LABEL[item.rarity] ?? item.rarity).toUpperCase(), cx, S * 0.64);
  ctx.font = "600 34px 'Trebuchet MS', system-ui, sans-serif";
  ctx.fillText(pickEditionNo(item.id), cx, S * 0.75);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.needsUpdate = true;
  return tex;
}

// ── Single pick scene ─────────────────────────────────────────────────────────
const PICK_SIZE = 2.3;

function SinglePickScene({ item }: { item: PickDef }) {
  const spin = useRef<THREE.Group>(null);
  const logo = useTexture(LOGO_URL);

  const geometry = useMemo(() => {
    const g = buildPickGeometry();
    g.computeBoundingBox();
    const center = new THREE.Vector3();
    g.boundingBox!.getCenter(center);
    g.translate(-center.x, -center.y, -center.z);
    return g;
  }, []);

  const { normScale, logoSize, halfThickness } = useMemo(() => {
    geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    geometry.boundingBox!.getSize(size);
    const faceMin = Math.min(size.x, size.y);
    const maxDim = Math.max(size.x, size.y, size.z);
    return {
      normScale: PICK_SIZE / (maxDim || 1),
      logoSize: faceMin * 0.82,
      halfThickness: size.z / 2,
    };
  }, [geometry]);

  const material = useMemo(() => buildPickMaterial(item), [item]);
  const backLabel = useMemo(() => makeBackLabelTexture(item), [item]);

  useEffect(() => {
    logo.colorSpace = THREE.SRGBColorSpace;
    logo.anisotropy = 4;
    logo.needsUpdate = true;
  }, [logo]);

  useEffect(() => () => {
    material.map?.dispose();
    material.dispose();
    backLabel.dispose();
    geometry.dispose();
  }, [material, backLabel, geometry]);

  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.9;
  });

  const decalScale: [number, number, number] = [logoSize, logoSize, halfThickness * 2.2];
  const frontPos: [number, number, number] = [0, 0, halfThickness];
  const backPos:  [number, number, number] = [0, 0, -halfThickness];
  const backRot:  [number, number, number] = [0, Math.PI, 0];

  return (
    <group ref={spin}>
      <group scale={normScale}>
        <mesh geometry={geometry} material={material} castShadow>
          <Decal position={frontPos} rotation={[0, 0, 0]} scale={decalScale}>
            <meshBasicMaterial map={logo} transparent polygonOffset polygonOffsetFactor={-6} depthTest depthWrite={false} toneMapped={false} />
          </Decal>
          <Decal position={backPos} rotation={backRot} scale={decalScale}>
            <meshBasicMaterial map={backLabel} transparent polygonOffset polygonOffsetFactor={-6} depthTest depthWrite={false} toneMapped={false} />
          </Decal>
        </mesh>
      </group>
    </group>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export function SinglePick3D({ item, size = 200 }: { item: PickDef; size?: number }) {
  return (
    <div style={{ width: size, height: Math.round(size * 1.1), flexShrink: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 32 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 8, 10]} intensity={1.6} />
        <directionalLight position={[-8, 3, 6]} intensity={0.7} color="#7c5cff" />
        <RoomEnv />
        <SinglePickScene item={item} />
      </Canvas>
    </div>
  );
}
