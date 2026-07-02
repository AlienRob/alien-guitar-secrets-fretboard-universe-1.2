import * as THREE from "three";
import { Guitar, GuitarFinish, GuitarShape, PickupConfig } from "@/data/guitars";

// Builds a real, orbitable 3D guitar from the catalog data. The body silhouette
// reuses the same tuned 2D outlines as the flat art (so the iconic shapes stay
// accurate), extruded into a solid slab. Famous paint jobs (EVH stripes, Zakk
// bullseye, Rhoads polka dot, Vai floral, sunburst, chrome) are painted onto the
// body via a generated texture so they remain recognisable from any angle.

// --- Coordinate mapping (SVG art space -> 3D world units) ------------------
const SX = 40; // scale divisor
const CX = 60; // svg x centre
const CY = 200; // svg y centre
const tx = (x: number) => (x - CX) / SX;
const ty = (y: number) => (CY - y) / SX;

const BODY_PATHS: Record<GuitarShape, string> = {
  strat:
    "M28 184 C23 188.8 17.7 217 17 230 C16.3 243 24.3 250.3 24 262 C23.7 273.7 12.3 287 15 300 C17.7 313 32.5 332.2 40 340 C47.5 347.8 53.3 347 60 347 C66.7 347 72.5 347.8 80 340 C87.5 332.2 102.3 313 105 300 C107.7 287 96.3 273.7 96 262 C95.7 250.3 104.3 242.3 103 230 C101.7 217.7 93 192 88 188 C83 184 77.7 203.7 73 206 C68.3 208.3 64.3 202.8 60 202 C55.7 201.2 52.3 204 47 201 C41.7 198 33 179.2 28 184 Z",
  superstrat:
    "M25 176 C19.7 181.3 14.3 217 14 232 C13.7 247 23.2 254.3 23 266 C22.8 277.7 10.2 289.3 13 302 C15.8 314.7 32.2 334.3 40 342 C47.8 349.7 53.3 348 60 348 C66.7 348 72.2 349.7 80 342 C87.8 334.3 104.2 314.7 107 302 C109.8 289.3 97.2 277.7 97 266 C96.8 254.3 106.8 246 106 232 C105.2 218 97.7 186.3 92 182 C86.3 177.7 77.3 202.5 72 206 C66.7 209.5 64.3 204 60 203 C55.7 202 51.8 204.5 46 200 C40.2 195.5 30.3 170.7 25 176 Z",
  lespaul:
    "M33 200 C28 205 22.2 221.7 20 232 C17.8 242.3 18.8 250.7 20 262 C21.2 273.3 22.3 287.3 27 300 C31.7 312.7 42.3 330.5 48 338 C53.7 345.5 56.7 345 61 345 C65.3 345 67 345.5 74 338 C81 330.5 98.2 312.7 103 300 C107.8 287.3 104.8 273.7 103 262 C101.2 250.3 93.5 240.3 92 230 C90.5 219.7 97 204.2 94 200 C91 195.8 79.7 204 74 205 C68.3 206 64 206.5 60 206 C56 205.5 54.5 203 50 202 C45.5 201 38 195 33 200 Z",
  flyingv: "M52 200 L18 338 L42 346 L60 286 L78 346 L102 338 L68 200 Z",
  explorer: "M50 198 L43 240 L18 262 L18 302 L57 302 L57 250 L93 346 L106 339 L58 198 Z",
  majesty:
    "M27 182 C21.8 187 16.5 218.3 16 232 C15.5 245.7 24 252.7 24 264 C24 275.3 14.3 289 16 300 C17.7 311 26.7 321.5 34 330 C41.3 338.5 51.3 351 60 351 C68.7 351 78.7 338.5 86 330 C93.3 321.5 102.3 311 104 300 C105.7 289 96 275.3 96 264 C96 252.7 105 245 104 232 C103 219 95.3 190.3 90 186 C84.7 181.7 77 203.2 72 206 C67 208.8 64.2 203.7 60 203 C55.8 202.3 52.5 205.5 47 202 C41.5 198.5 32.2 177 27 182 Z",
  iceman:
    "M60 196 C50 192 39 193 32 199 C25 205 25 219 31 229 C20 242 16 270 25 300 L34 344 L66 322 C84 312 99 290 101 264 C103 240 98 224 90 224 C97 212 94 199 85 196 C77 193 68 193 60 196 Z",
  axebass:
    "M58 198 L52 250 C36 250 16 260 14 286 L42 300 C26 306 24 330 42 332 C70 330 100 312 106 280 C111 256 96 240 76 246 L70 198 Z",
};

const DEFAULT_PICKUPS: Record<GuitarShape, PickupConfig> = {
  strat: "sss",
  superstrat: "hsh",
  majesty: "hh",
  lespaul: "hh",
  flyingv: "hh",
  explorer: "hh",
  iceman: "hh",
  axebass: "hh",
};

// --- SVG path -> THREE.Shape (supports M / C / L / Z absolute) --------------
function shapeFromPath(d: string): THREE.Shape {
  const shape = new THREE.Shape();
  const tokens = d.match(/[MCLZ]|-?\d*\.?\d+/g) ?? [];
  let i = 0;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === "M") {
      shape.moveTo(tx(num()), ty(num()));
    } else if (cmd === "L") {
      shape.lineTo(tx(num()), ty(num()));
    } else if (cmd === "C") {
      shape.bezierCurveTo(tx(num()), ty(num()), tx(num()), ty(num()), tx(num()), ty(num()));
    } else if (cmd === "Z") {
      shape.closePath();
    }
  }
  return shape;
}

function bounds(d: string) {
  const nums = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (let k = 0; k + 1 < nums.length; k += 2) {
    const X = tx(nums[k]);
    const Y = ty(nums[k + 1]);
    minX = Math.min(minX, X);
    maxX = Math.max(maxX, X);
    minY = Math.min(minY, Y);
    maxY = Math.max(maxY, Y);
  }
  return { minX, maxX, minY, maxY };
}

// --- Finish textures --------------------------------------------------------
function canvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, aspect: number) {
  const w = 512;
  const h = Math.round(512 * aspect);
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeFinishTexture(
  finish: GuitarFinish,
  body: string,
  accent: string,
  aspect: number,
): THREE.Texture | null {
  switch (finish) {
    case "stripes":
      return canvasTexture((ctx, w, h) => {
        ctx.fillStyle = body;
        ctx.fillRect(0, 0, w, h);
        ctx.lineCap = "round";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = w * 0.09;
        for (let k = -2; k < 8; k++) {
          ctx.beginPath();
          ctx.moveTo(k * w * 0.22, h);
          ctx.lineTo(k * w * 0.22 + w * 0.6, 0);
          ctx.stroke();
        }
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = w * 0.06;
        for (let k = -2; k < 8; k++) {
          ctx.beginPath();
          ctx.moveTo(w - k * w * 0.24, h);
          ctx.lineTo(w - k * w * 0.24 - w * 0.6, 0);
          ctx.stroke();
        }
      }, aspect);
    case "bullseye":
      return canvasTexture((ctx, w, h) => {
        ctx.fillStyle = body;
        ctx.fillRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h * 0.6;
        const max = Math.max(w, h) * 0.7;
        for (let r = max, idx = 0; r > 0; r -= max / 9, idx++) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = idx % 2 === 0 ? accent : body;
          ctx.fill();
        }
      }, aspect);
    case "polkadot":
      return canvasTexture((ctx, w, h) => {
        ctx.fillStyle = body;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = accent;
        const step = w / 6;
        for (let yy = step / 2; yy < h; yy += step) {
          for (let xx = step / 2; xx < w; xx += step) {
            ctx.beginPath();
            ctx.arc(xx, yy, w * 0.035, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }, aspect);
    case "floral":
      return canvasTexture((ctx, w, h) => {
        ctx.fillStyle = body;
        ctx.fillRect(0, 0, w, h);
        const step = w / 4;
        for (let yy = step / 2; yy < h; yy += step) {
          for (let xx = step / 2; xx < w; xx += step) {
            for (let p = 0; p < 5; p++) {
              const a = (p / 5) * Math.PI * 2;
              ctx.beginPath();
              ctx.ellipse(
                xx + Math.cos(a) * w * 0.03,
                yy + Math.sin(a) * w * 0.03,
                w * 0.018,
                w * 0.032,
                a,
                0,
                Math.PI * 2,
              );
              ctx.fillStyle = accent;
              ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(xx, yy, w * 0.014, 0, Math.PI * 2);
            ctx.fillStyle = "#fde047";
            ctx.fill();
          }
        }
      }, aspect);
    case "sunburst":
      return canvasTexture((ctx, w, h) => {
        const g = ctx.createRadialGradient(w / 2, h * 0.55, w * 0.05, w / 2, h * 0.55, w * 0.75);
        g.addColorStop(0, accent);
        g.addColorStop(0.55, body);
        g.addColorStop(1, "#160a04");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }, aspect);
    case "alien":
      return canvasTexture((ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, body);
        g.addColorStop(1, accent);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        for (let k = 0; k < 60; k++) {
          ctx.beginPath();
          ctx.arc(((k * 97) % w), ((k * 53) % h), 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }, aspect);
    case "mirror":
      return canvasTexture((ctx, w, h) => {
        // reflective silver base
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.3, "#cbd5e1");
        g.addColorStop(0.52, "#7c8aa0");
        g.addColorStop(0.74, "#e2e8f0");
        g.addColorStop(1, "#64748b");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // shattered-mirror crack seams
        const lines: Array<[number, number, number, number]> = [
          [0.32, 0.05, 0.5, 0.45],
          [0.5, 0.45, 0.36, 0.78],
          [0.36, 0.78, 0.58, 1],
          [0.78, 0.08, 0.55, 0.42],
          [0.55, 0.42, 0.82, 0.8],
          [0.16, 0.5, 0.55, 0.55],
          [0.55, 0.55, 0.92, 0.48],
          [0.2, 0.84, 0.52, 0.72],
          [0.52, 0.72, 0.9, 0.86],
        ];
        for (const [x1, y1, x2, y2] of lines) {
          ctx.beginPath();
          ctx.moveTo(x1 * w, y1 * h);
          ctx.lineTo(x2 * w, y2 * h);
          ctx.strokeStyle = "rgba(255,255,255,0.85)";
          ctx.lineWidth = w * 0.01;
          ctx.stroke();
          ctx.strokeStyle = "rgba(30,41,59,0.5)";
          ctx.lineWidth = w * 0.005;
          ctx.stroke();
        }
      }, aspect);
    default:
      return null;
  }
}

// --- Geometry helpers -------------------------------------------------------
function disposeMat(m: THREE.Material) {
  const anyM = m as THREE.MeshStandardMaterial;
  anyM.map?.dispose();
  m.dispose();
}

export function disposeGuitar(group: THREE.Group) {
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) mesh.material.forEach(disposeMat);
      else disposeMat(mesh.material);
    }
  });
}

const BODY_DEPTH = 0.5;

export function buildGuitarGroup(guitar: Guitar, handed: "right" | "left" = "right"): THREE.Group {
  const group = new THREE.Group();
  const { shape, finish, body, accent } = guitar;
  const pickups = guitar.pickups ?? DEFAULT_PICKUPS[shape];
  const showPickguard = guitar.pickguard ?? pickups === "sss";
  const knobCount = guitar.controls ?? (pickups === "h" ? 1 : pickups === "sss" ? 3 : 2);
  const maple = guitar.maple ?? false;
  const tremolo = pickups === "sss";
  const stringCount = guitar.strings ?? 6;

  const pathD = BODY_PATHS[shape];
  const bb = bounds(pathD);
  const bw = bb.maxX - bb.minX;
  const bh = bb.maxY - bb.minY;

  // ---- Body --------------------------------------------------------------
  const bodyShape = shapeFromPath(pathD);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: BODY_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.05,
    bevelSegments: 4,
    curveSegments: 48,
  });
  bodyGeo.translate(0, 0, -BODY_DEPTH / 2);

  const metallic = finish === "chrome" || finish === "mirror";
  const tex = makeFinishTexture(finish, body, accent, bh / bw);
  if (tex) {
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1 / bw, 1 / bh);
    tex.offset.set(-bb.minX / bw, -bb.minY / bh);
  }
  // Physical material with a clearcoat gives every guitar the glossy lacquered
  // finish of a real instrument — a polished top coat with sharp highlights over
  // the painted body, and a brighter mirror/chrome for the metallic finishes.
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: tex ? "#ffffff" : body,
    map: tex ?? undefined,
    metalness: metallic ? 0.95 : 0.2,
    roughness: metallic ? 0.14 : finish === "relic" ? 0.68 : 0.28,
    clearcoat: metallic ? 0.5 : 0.85,
    clearcoatRoughness: finish === "relic" ? 0.5 : 0.16,
    reflectivity: 0.55,
    sheen: metallic ? 0 : 0.3,
  });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));

  const FRONT = BODY_DEPTH / 2 + 0.08;

  // ---- Neck --------------------------------------------------------------
  const neckTopY = ty(55);
  const neckBotY = ty(204);
  const neckH = neckTopY - neckBotY;
  const neckW = tx(68) - tx(52);
  const neckDepth = 0.22;
  const neckZ = FRONT - neckDepth / 2 - 0.02;
  const neckMat = new THREE.MeshStandardMaterial({ color: "#b8915c", roughness: 0.55 });
  const neck = new THREE.Mesh(new THREE.BoxGeometry(neckW, neckH, neckDepth), neckMat);
  neck.position.set(0, (neckTopY + neckBotY) / 2, neckZ);
  group.add(neck);

  // fretboard
  const fbMat = new THREE.MeshStandardMaterial({ color: maple ? "#e3bd7d" : "#2c2016", roughness: 0.5 });
  const fb = new THREE.Mesh(new THREE.BoxGeometry(neckW * 0.86, neckH, 0.05), fbMat);
  fb.position.set(0, (neckTopY + neckBotY) / 2, neckZ + neckDepth / 2 + 0.02);
  group.add(fb);
  const fbFront = neckZ + neckDepth / 2 + 0.05;

  // frets + inlays
  const fretMat = new THREE.MeshStandardMaterial({ color: "#d4d4d8", metalness: 0.85, roughness: 0.25 });
  const inlayMat = new THREE.MeshStandardMaterial({ color: maple ? "#1f2937" : "#e5e7eb", roughness: 0.4 });
  const fretGeo = new THREE.BoxGeometry(neckW * 0.86, 0.025, 0.02);
  for (let f = 0; f < 11; f++) {
    const y = ty(66 + f * 12.5);
    const fret = new THREE.Mesh(fretGeo, fretMat);
    fret.position.set(0, y, fbFront);
    group.add(fret);
  }
  const inlayGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.02, 12);
  for (const sy of [78, 103, 128, 153]) {
    const inl = new THREE.Mesh(inlayGeo, inlayMat);
    inl.rotation.x = Math.PI / 2;
    inl.position.set(0, ty(sy), fbFront);
    group.add(inl);
  }

  // ---- Headstock ---------------------------------------------------------
  const hsMat = new THREE.MeshStandardMaterial({ color: "#241a12", roughness: 0.5 });
  const hsW = neckW * 1.5;
  const hsH = ty(8) - ty(52);
  const hs = new THREE.Mesh(new THREE.BoxGeometry(hsW, hsH, 0.16), hsMat);
  hs.position.set(0, (ty(8) + ty(52)) / 2, neckZ);
  hs.rotation.z = 0.12;
  group.add(hs);
  const tunerMat = new THREE.MeshStandardMaterial({ color: accent, metalness: 0.7, roughness: 0.3 });
  const tunerGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12);
  const inline = shape === "strat" || shape === "superstrat" || shape === "majesty" || shape === "axebass";
  if (inline) {
    const span = 35;
    for (let k = 0; k < stringCount; k++) {
      const t = new THREE.Mesh(tunerGeo, tunerMat);
      t.position.set(-hsW * 0.4, ty(14 + (span * k) / Math.max(1, stringCount - 1)), neckZ + 0.12);
      group.add(t);
    }
  } else {
    for (let k = 0; k < 3; k++) {
      for (const side of [-1, 1]) {
        const t = new THREE.Mesh(tunerGeo, tunerMat);
        t.position.set(side * hsW * 0.42, ty(16 + k * 8), neckZ + 0.12);
        group.add(t);
      }
    }
  }

  // ---- Pickups -----------------------------------------------------------
  const pickupMat = new THREE.MeshStandardMaterial({ color: "#111111", roughness: 0.4 });
  const addPickup = (svgY: number, wide: boolean) => {
    const w = wide ? tx(76) - tx(44) : tx(71) - tx(49);
    const h = wide ? 0.36 : 0.42;
    const pu = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), pickupMat);
    pu.position.set(0, ty(svgY), FRONT + 0.01);
    group.add(pu);
  };
  if (showPickguard) {
    const pgMat = new THREE.MeshStandardMaterial({
      color: body === "#000000" || body === "#0a0a0a" ? "#0a0a0a" : "#f3f4f6",
      roughness: 0.45,
    });
    const pg = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.42, bh * 0.5, 0.03), pgMat);
    pg.position.set(-bw * 0.04, ty(280), FRONT - 0.005);
    group.add(pg);
  }
  if (pickups === "sss") {
    addPickup(244, false);
    addPickup(270, false);
    addPickup(296, false);
  } else if (pickups === "hh") {
    addPickup(250, true);
    addPickup(296, true);
  } else if (pickups === "hsh") {
    addPickup(248, true);
    addPickup(272, false);
    addPickup(298, true);
  } else if (pickups === "sh") {
    addPickup(248, false);
    addPickup(296, true);
  } else if (pickups === "hhh") {
    addPickup(244, true);
    addPickup(272, true);
    addPickup(300, true);
  } else if (pickups === "h") {
    addPickup(294, true);
  }

  // ---- Bridge ------------------------------------------------------------
  const metalMat = new THREE.MeshStandardMaterial({ color: "#cbd5e1", metalness: 0.85, roughness: 0.3 });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(tx(70) - tx(50), tremolo ? 0.22 : 0.16, 0.1), metalMat);
  bridge.position.set(0, ty(320), FRONT + 0.01);
  group.add(bridge);

  // ---- Knobs -------------------------------------------------------------
  const knobMat = new THREE.MeshStandardMaterial({ color: "#d1d5db", roughness: 0.4, metalness: 0.3 });
  const knobGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.12, 16);
  const knobPos: Array<[number, number]> = [
    [tx(82), ty(318)],
    [tx(88), ty(330)],
    [tx(76), ty(330)],
  ];
  for (let k = 0; k < knobCount; k++) {
    const knob = new THREE.Mesh(knobGeo, knobMat);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(knobPos[k][0], knobPos[k][1], FRONT + 0.02);
    group.add(knob);
  }

  // ---- Strings -----------------------------------------------------------
  const stringMat = new THREE.MeshStandardMaterial({ color: "#e5e7eb", metalness: 0.8, roughness: 0.3 });
  const sTop = ty(55);
  const sBot = ty(320);
  const sH = sTop - sBot;
  const stringGap = 12 / (stringCount - 1);
  const baseR = stringCount === 4 ? 0.014 : 0.008;
  const stepR = stringCount === 4 ? 0.004 : 0.002;
  for (let s = 0; s < stringCount; s++) {
    const x = tx(54 + s * stringGap);
    const r = baseR + s * stepR;
    const str = new THREE.Mesh(new THREE.CylinderGeometry(r, r, sH, 6), stringMat);
    str.position.set(x, (sTop + sBot) / 2, fbFront + 0.03);
    group.add(str);
  }

  // centre vertically so the model orbits around its middle
  group.position.y = -(bb.maxY + ty(8)) / 2 - 0.2;
  if (handed === "left") group.scale.x = -1;
  return group;
}
