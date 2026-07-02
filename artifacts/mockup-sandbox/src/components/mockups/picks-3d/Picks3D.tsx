import { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, useTexture, Decal, Html } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const LOGO_URL = "/__mockup/images/ags-logo.png";

// World size of each pick's longest edge, so a fixed camera frames the grid.
const PICK_SIZE = 2.3;
const COLS = 4;
const SPACING_X = 3.5;
const SPACING_Y = 4.2;

type Finish =
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

interface PickItem {
  id: string;
  name: string;
  rarity: string;
  finish: Finish;
  color: string;
  color2?: string;
}

// A representative spread of the catalog so every finish family is on show.
const PICKS: PickItem[] = [
  { id: "pick-onyx", name: "Onyx Standard", rarity: "common", finish: "solid", color: "#1c2233" },
  { id: "pick-solar", name: "Solar Flare", rarity: "common", finish: "solid", color: "#f5a623" },
  { id: "pick-carbon", name: "Carbon Vortex", rarity: "rare", finish: "carbon", color: "#161b24", color2: "#2b3242" },
  { id: "pick-foil", name: "Stardust Foil", rarity: "epic", finish: "foil", color: "#c0c6d6" },
  { id: "pick-holo", name: "Holographic Nebula", rarity: "rare", finish: "holographic", color: "#8a2be2", color2: "#00e5ff" },
  { id: "pick-prism", name: "Prism Pulsar", rarity: "epic", finish: "prism", color: "#22d3ee", color2: "#f43f5e" },
  { id: "pick-aurora", name: "Aurora Pearl", rarity: "legendary", finish: "pearl", color: "#a7f3d0", color2: "#60a5fa" },
  { id: "pick-glitter", name: "Quasar Glitter", rarity: "rare", finish: "glitter", color: "#ff3ea5" },
  { id: "pick-singularity", name: "Singularity", rarity: "mythic", finish: "neon", color: "#b026ff", color2: "#00ffd5" },
  { id: "pick-galaxy", name: "Galaxy Swirl", rarity: "rare", finish: "galaxy", color: "#2b0a4a", color2: "#00e5ff" },
  { id: "pick-marble-obsidian", name: "Obsidian Vein", rarity: "legendary", finish: "marble", color: "#1a1a22", color2: "#fbbf24" },
  { id: "pick-neon-acid", name: "Acid Pulse", rarity: "rare", finish: "neon", color: "#aaff00", color2: "#00ffa3" },
];

const ROWS = Math.ceil(PICKS.length / COLS);

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

// Brand alien-green used for the front logo's eyes; the back label echoes it.
const LABEL_GREEN = "#9bff5a";

const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
};

function pickEditionNo(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `No. ${String((h % 999) + 1).padStart(3, "0")}`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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

function makeBackLabelTexture(item: PickItem): THREE.CanvasTexture {
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

  ctx.font = "600 34px 'Trebuchet MS', system-ui, sans-serif";
  ctx.fillText(pickEditionNo(item.id), cx, S * 0.75);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

// The exact pick silhouette used by the 2D cover art (gear-thumb.tsx), in its
// 0..100 x / 0..102 y artboard but with Y flipped so the wide rounded top sits
// at +Y. Extruding this means the 3D pick shares the cover's outline exactly.
function buildPickGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(50, 96);
  shape.bezierCurveTo(72, 96, 88, 81, 88, 59);
  shape.bezierCurveTo(88, 31, 62, 10, 50, 6);
  shape.bezierCurveTo(38, 10, 12, 31, 12, 59);
  shape.bezierCurveTo(12, 81, 28, 96, 50, 96);

  // Map both faces' UVs to the artboard (0..1) so a canvas painted like the
  // cover lines up on the pick; the Y flip above cancels the texture's flipY.
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

// Paint a texture that mirrors gear-thumb's per-finish gradients/overlays, so
// the spinning 3D pick reads with the same colour scheme as the flat cover art.
function buildPickColorMap(item: PickItem): THREE.CanvasTexture {
  const W = 256;
  const H = Math.round((W * 102) / 100);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const X = (x: number) => (x / 100) * W;
  const Y = (y: number) => (y / 102) * H;
  const R = (r: number) => (r / 100) * W;
  // Cover gradients use SVG objectBoundingBox %, i.e. fractions of the pick's
  // bounding box (x 12..88, y 6..96); convert those to artboard coords.
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
    const vein = (pts: [number, number][], w: number, o: number) => {
      ctx.globalAlpha = o;
      ctx.lineWidth = R(w);
      ctx.beginPath();
      ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
      for (let i = 1; i + 2 < pts.length; i += 3) {
        ctx.bezierCurveTo(
          X(pts[i][0]), Y(pts[i][1]),
          X(pts[i + 1][0]), Y(pts[i + 1][1]),
          X(pts[i + 2][0]), Y(pts[i + 2][1]),
        );
      }
      ctx.stroke();
    };
    vein([[16, 66], [34, 50], [44, 60], [58, 40], [68, 26], [78, 30], [88, 20]], 2.2, 0.55);
    vein([[12, 48], [30, 44], [40, 28], [58, 24], [70, 21], [80, 16], [90, 12]], 1.3, 0.4);
    vein([[22, 88], [30, 72], [48, 74], [60, 62]], 1.1, 0.35);
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

  // Soft sheen highlight, mirroring the cover's ellipse near (40,30).
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

function buildPickMaterial(item: PickItem): THREE.MeshPhysicalMaterial {
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
    case "foil":
      m.metalness = 1;
      m.roughness = 0.22;
      m.clearcoat = 0.6;
      break;
    case "carbon":
      m.metalness = 0.5;
      m.roughness = 0.42;
      m.clearcoat = 0.5;
      break;
    case "neon":
      m.emissive = color.clone();
      m.emissiveIntensity = 0.85;
      m.roughness = 0.5;
      m.clearcoat = 0.3;
      break;
    case "holographic":
    case "prism":
      m.iridescence = 1;
      m.iridescenceIOR = 1.6;
      m.metalness = 0.2;
      m.roughness = 0.25;
      m.clearcoat = 0.8;
      break;
    case "pearl":
      m.iridescence = 0.7;
      m.metalness = 0.1;
      m.roughness = 0.3;
      m.clearcoat = 1;
      m.clearcoatRoughness = 0.15;
      break;
    case "glitter":
      m.metalness = 0.35;
      m.roughness = 0.55;
      m.clearcoat = 0.5;
      m.sheen = 1;
      if (color2) m.sheenColor = color2;
      break;
    case "galaxy":
      m.emissive = (color2 ?? color).clone();
      m.emissiveIntensity = 0.25;
      m.metalness = 0.3;
      m.roughness = 0.35;
      m.clearcoat = 0.7;
      break;
    case "marble":
      m.roughness = 0.5;
      m.clearcoat = 0.6;
      break;
    case "solid":
    default:
      m.roughness = 0.5;
      m.clearcoat = 0.35;
      break;
  }

  // The map carries the true colours/finish, so neutralise the base tint.
  m.map = buildPickColorMap(item);
  m.color = new THREE.Color("#ffffff");
  return m;
}

type Axis = "x" | "y" | "z";

interface ModelShape {
  geometry: THREE.BufferGeometry;
  thinAxis: Axis;
  halfThickness: number;
  logoSize: number;
  normScale: number;
  upUnit: [number, number, number];
  upOffset: number;
}

function usePickShape(): ModelShape | null {
  return useMemo(() => {
    // Extrude the same silhouette as the 2D cover art, recentre on the origin.
    // The thin axis is always Z (the extrude depth), facing the camera.
    const g = buildPickGeometry();
    g.computeBoundingBox();
    const center = new THREE.Vector3();
    g.boundingBox!.getCenter(center);
    g.translate(-center.x, -center.y, -center.z);
    g.computeBoundingBox();
    const size = new THREE.Vector3();
    g.boundingBox!.getSize(size);

    const faceMin = Math.min(size.x, size.y);
    const maxDim = Math.max(size.x, size.y, size.z);

    return {
      geometry: g,
      thinAxis: "z" as Axis,
      halfThickness: size.z / 2,
      // Sized so the logo fills the wide pick face (edges clip to the silhouette).
      logoSize: faceMin * 0.82,
      normScale: PICK_SIZE / (maxDim || 1),
      upUnit: [0, 1, 0],
      // Nudge the stamp up to sit just above the pick's centre, like the cover.
      upOffset: maxDim * 0.04,
    };
  }, []);
}

function PickInstance({
  item,
  shape,
  logo,
  position,
  phase,
}: {
  item: PickItem;
  shape: ModelShape;
  logo: THREE.Texture;
  position: [number, number, number];
  phase: number;
}) {
  const spin = useRef<THREE.Group>(null);
  const material = useMemo(() => buildPickMaterial(item), [item]);
  const backLabel = useMemo(() => makeBackLabelTexture(item), [item]);
  useEffect(
    () => () => {
      material.map?.dispose();
      material.dispose();
    },
    [material],
  );
  useEffect(() => () => backLabel.dispose(), [backLabel]);

  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.9;
  });

  const { thinAxis, halfThickness, logoSize, normScale, geometry, upUnit, upOffset } = shape;

  const groupRot: [number, number, number] =
    thinAxis === "x" ? [0, -Math.PI / 2, 0] : thinAxis === "y" ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  const unit: [number, number, number] =
    thinAxis === "x" ? [1, 0, 0] : thinAxis === "y" ? [0, 1, 0] : [0, 0, 1];
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
    thinAxis === "x" ? [0, Math.PI / 2, 0] : thinAxis === "y" ? [-Math.PI / 2, 0, 0] : [0, 0, 0];
  const backRot: [number, number, number] =
    thinAxis === "x" ? [0, -Math.PI / 2, 0] : thinAxis === "y" ? [Math.PI / 2, 0, 0] : [0, Math.PI, 0];
  const decalScale: [number, number, number] = [logoSize, logoSize, halfThickness * 2.2];

  return (
    <group position={position}>
      <group ref={spin} rotation={[0, phase, 0]}>
        <group scale={normScale}>
          <group rotation={groupRot}>
            <mesh geometry={geometry} material={material} castShadow>
              <Decal position={frontPos} rotation={frontRot} scale={decalScale}>
                <meshBasicMaterial
                  map={logo}
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
      </group>
      <Html position={[0, -1.85, 0]} center pointerEvents="none" style={{ pointerEvents: "none" }}>
        <div style={{ textAlign: "center", whiteSpace: "nowrap", userSelect: "none" }}>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{item.name}</div>
          <div
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {item.finish} · {item.rarity}
          </div>
        </div>
      </Html>
    </group>
  );
}

function PicksScene() {
  const shape = usePickShape();
  const logo = useTexture(LOGO_URL);
  useEffect(() => {
    logo.colorSpace = THREE.SRGBColorSpace;
    logo.anisotropy = 4;
    logo.needsUpdate = true;
  }, [logo]);

  // The extruded geometry is shared across every pick, so dispose it once when
  // the scene unmounts (instances only own their own material/back-label).
  useEffect(() => {
    return () => {
      shape?.geometry.dispose();
    };
  }, [shape]);

  if (!shape) return null;

  return (
    <>
      {PICKS.map((item, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = (col - (COLS - 1) / 2) * SPACING_X;
        const y = ((ROWS - 1) / 2 - row) * SPACING_Y;
        return (
          <PickInstance
            key={item.id}
            item={item}
            shape={shape}
            logo={logo}
            position={[x, y, 0]}
            phase={(i * Math.PI) / 5}
          />
        );
      })}
      <ContactShadows position={[0, -((ROWS - 1) / 2) * SPACING_Y - 1.6, 0]} opacity={0.3} scale={20} blur={2.8} far={6} />
    </>
  );
}

export function Picks3D() {
  return (
    <div className="flex min-h-screen flex-col bg-[#070711]">
      <div className="px-8 pt-8">
        <h1 className="text-2xl font-bold text-white">3D Branded Picks</h1>
        <p className="mt-1 max-w-3xl text-sm text-white/50">
          One pick model, re-skinned per finish, with the Alien Guitar Secrets logo stamped on both
          faces. Each one slowly turns so you can see the front, edge and back. Drag to orbit the
          whole tray.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <Canvas
          camera={{ position: [0, 0, 22], fov: 32 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[6, 8, 10]} intensity={1.6} />
          <directionalLight position={[-8, 3, 6]} intensity={0.7} color="#7c5cff" />
          <RoomEnv />
          <PicksScene />
          <OrbitControls makeDefault enablePan={false} enableZoom={false} enableDamping />
        </Canvas>
      </div>
    </div>
  );
}
