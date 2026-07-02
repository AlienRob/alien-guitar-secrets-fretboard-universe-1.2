import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, useGLTF, useTexture, Decal } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Pause, Play } from "lucide-react";
import type { PickItem } from "@/data/gear";
import { RARITY_META } from "@/data/guitars";
import { isWebGLAvailable } from "@/lib/webgl";
import GearThumb from "@/components/gear-thumb";
import pickModelUrl from "@assets/ags-pick.glb?url";
import agsLogo from "@assets/AGS_Pick_Template__Eyes_Green_1780383489732.png";

useGLTF.preload(pickModelUrl);

// The model is normalised so its longest edge is this many world units, letting
// a fixed camera frame every pick regardless of the .glb's native scale.
const TARGET_SIZE = 5;

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

// Paint a texture that mirrors gear-thumb's per-finish gradients/overlays, so
// the spinning 3D pick reads with the same colour scheme as the flat cover art.
// It is mapped onto the uploaded pick model via a planar projection of its wide
// face (see PickModel), so the gradients lie across the pick like the cover.
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

// Translate the pick's finish + colours into a physically-based material so the
// same model reads as plastic, metal, pearl, neon, etc. across every variant.
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

const axisIndex = (a: Axis): number => (a === "x" ? 0 : a === "y" ? 1 : 2);

// Brand alien-green used for the back label text on the pick's reverse face.
const LABEL_GREEN = "#9bff5a";

// Each pick is a single named item, so we mint a stable "edition" number from
// its id — the same pick always shows the same number.
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

// Draws the pick's name, rarity and edition number onto a canvas so it can be
// stamped on the reverse face as a decal. No mirror correction is needed: the
// back decal is the front decal rigidly rotated 180deg, so it reads the same
// way round as the front logo.
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

  // Name (up to two lines; shrink the font if it would need three).
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
  ctx.fillText(RARITY_META[item.rarity].label.toUpperCase(), cx, S * 0.64);

  ctx.font = "600 34px 'Trebuchet MS', system-ui, sans-serif";
  ctx.fillText(pickEditionNo(item.id), cx, S * 0.75);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function PickModel({ item, logo }: { item: PickItem; logo: THREE.Texture }) {
  const { scene } = useGLTF(pickModelUrl);

  // Grab the uploaded pick mesh's geometry, recentre it on the origin so a fixed
  // camera frames it, work out which axis is the thin (face-normal) one, and lay
  // a planar UV across the wide face so the cover-style colour map sits on it.
  const { geometry, thinAxis, halfThickness, logoSize, normScale, upUnit, upOffset } = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    // Bake each mesh's node transform into the cloned vertices so axis
    // detection, the planar UVs and the decal offsets are correct even if the
    // .glb stores scale/rotation/translation on the node rather than the verts.
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
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
    const faceAxis = dims[1][0]; // narrower face dimension = pick width (left-right)
    const longAxis = dims[2][0]; // tallest face dimension = top-to-point of the pick
    const maxDim = dims[2][1];

    // The wide rounded top of a pick holds far more material than the narrow
    // point, so the vertex centroid sits toward the top relative to the bbox
    // center. Use its sign to know which way is "up" on the face.
    const pos = g.attributes.position as THREE.BufferAttribute;
    const ai = axisIndex(longAxis);
    let sum = 0;
    for (let i = 0; i < pos.count; i++) sum += pos.getComponent(i, ai);
    const upSign = (pos.count ? sum / pos.count : 0) >= 0 ? 1 : -1;

    // Planar UVs from the wide face: u across the pick's width, v from point
    // (0) to wide top (1) so the painted colour map reads upright on the pick.
    const bb = g.boundingBox!;
    const uIdx = axisIndex(faceAxis);
    const vIdx = ai;
    const minU = bb.min.getComponent(uIdx);
    const minV = bb.min.getComponent(vIdx);
    const rangeU = size.getComponent(uIdx) || 1;
    const rangeV = size.getComponent(vIdx) || 1;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getComponent(i, uIdx) - minU) / rangeU;
      const vRaw = (pos.getComponent(i, vIdx) - minV) / rangeV;
      uv[i * 2] = u;
      uv[i * 2 + 1] = upSign > 0 ? vRaw : 1 - vRaw;
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));

    return {
      geometry: g,
      thinAxis: thin,
      halfThickness: thickness / 2,
      // Logo stamp sized as a fraction of the pick's short (width) face axis.
      // Kept in step with the flat cover's logo size so the 3D pick and the 2D
      // vault thumbnail read as the same print.
      logoSize: faceMin * 0.68,
      normScale: TARGET_SIZE / (maxDim || 1),
      upUnit: [
        longAxis === "x" ? upSign : 0,
        longAxis === "y" ? upSign : 0,
        longAxis === "z" ? upSign : 0,
      ] as [number, number, number],
      // Shift the stamp up into the wide top area.
      upOffset: maxDim * 0.13,
    };
  }, [scene]);

  const material = useMemo(() => buildPickMaterial(item), [item]);
  const backLabel = useMemo(() => makeBackLabelTexture(item), [item]);
  useEffect(() => {
    return () => {
      material.map?.dispose();
      material.dispose();
      geometry?.dispose();
      backLabel.dispose();
    };
  }, [material, geometry, backLabel]);

  if (!geometry) return null;

  // Rotate the whole pick so its flat face points at the camera; the turntable
  // spin (around world Y) then reveals the edge + back, proving it is 3D.
  const groupRot: [number, number, number] =
    thinAxis === "x" ? [0, -Math.PI / 2, 0] : thinAxis === "y" ? [Math.PI / 2, 0, 0] : [0, 0, 0];

  // Decal projection (in mesh-local space) aimed down the thin axis, one stamp
  // on each face so the brand reads from front and back.
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
  // Projection depth is kept just over the pick's own half-thickness so each
  // stamp lands on its near face only and never bleeds through to the far face.
  const decalScale: [number, number, number] = [logoSize, logoSize, halfThickness * 2.2];

  return (
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
  );
}

// Pick body colours range from near-black to bright; stamp the logo in a tone
// that contrasts so the brand always reads. Mirrors the flat 2D pick art's
// stampColorFor (gear-thumb.tsx) so the 3D pick and the thumbnail match.
function stampColorFor(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#0b0b14" : "#ffffff";
}

// Recolour the alien logo to a single contrast tone using its own alpha as a
// mask, exactly like the flat pick art. This drops the baked-in green eye colour
// from the source PNG: the eye pupils are transparent so the pick body shows
// through (black/white eyes), instead of the brand green showing in 3D.
function recolorLogo(image: TexImageSource, color: string): THREE.CanvasTexture {
  const w = (image as HTMLImageElement).width || 512;
  const h = (image as HTMLImageElement).height || 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image as CanvasImageSource, 0, 0, w, h);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function Scene({ item }: { item: PickItem }) {
  const base = useTexture(agsLogo);
  const logo = useMemo(
    () => recolorLogo(base.image as TexImageSource, stampColorFor(item.color)),
    [base, item.color],
  );
  useEffect(() => () => logo.dispose(), [logo]);
  return <PickModel item={item} logo={logo} />;
}

interface Props {
  item: PickItem;
  className?: string;
}

// A spinning, branded 3D plectrum. Loads the uploaded pick model (ags-pick.glb)
// and dresses it in the item's colour + finish, so every pick in the catalog
// renders in 3D from a single .glb. Falls back to the flat SVG art when WebGL
// is unavailable.
export default function Pick3DViewer({ item, className }: Props) {
  const [spinning, setSpinning] = useState(true);

  if (!isWebGLAvailable()) {
    return (
      <div
        className={className}
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <GearThumb item={item} className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className={className} style={{ position: "relative" }}>
      <Canvas
        camera={{ position: [0, 0.4, 9], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        onPointerDown={() => setSpinning(false)}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 8]} intensity={1.6} />
        <directionalLight position={[-6, 2, 4]} intensity={0.7} color="#7c5cff" />
        <RoomEnv />
        <Scene item={item} />
        <ContactShadows position={[0, -3, 0]} opacity={0.35} scale={9} blur={2.6} far={5} />
        <OrbitControls
          makeDefault
          enablePan={false}
          autoRotate={spinning}
          autoRotateSpeed={2.2}
          enableDamping
        />
      </Canvas>

      <button
        type="button"
        onClick={() => setSpinning((s) => !s)}
        className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 rounded-full border border-white/25 bg-black/55 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-foreground backdrop-blur transition-colors hover:border-accent/70 hover:text-accent"
        aria-label={spinning ? "Pause spin" : "Spin pick"}
      >
        {spinning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        {spinning ? "Spinning" : "Spin"}
      </button>
    </div>
  );
}
