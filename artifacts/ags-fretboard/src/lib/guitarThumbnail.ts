import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Guitar } from "@/data/guitars";
import { buildGuitarGroup, disposeGuitar } from "@/components/guitar3d";
import { Handed } from "@/lib/playerCustomization";

// Renders catalog guitars to PNG data URLs using a SINGLE shared WebGL context.
// The vault grid shows these still images (fast, no 25 live canvases) while the
// detail view uses the live orbitable model. Same geometry => identical look.

const W = 300;
const H = 520;

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
const cache = new Map<string, string>();

function key(g: Guitar, handed: Handed) {
  return `${g.id}|${handed}`;
}

function ensure() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dir = new THREE.DirectionalLight(0xffffff, 1.6);
  dir.position.set(4, 6, 8);
  scene.add(dir);
  const rim = new THREE.DirectionalLight(0x7c5cff, 0.7);
  rim.position.set(-6, 2, 4);
  scene.add(rim);

  camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 100);
  camera.position.set(1.4, 0.4, 9.2);
  camera.lookAt(0, 0, 0);
}

export function renderGuitarThumbnail(guitar: Guitar, handed: Handed = "right"): string {
  const k = key(guitar, handed);
  const cached = cache.get(k);
  if (cached) return cached;

  ensure();
  const group = buildGuitarGroup(guitar, handed);
  scene!.add(group);
  renderer!.render(scene!, camera!);
  const url = renderer!.domElement.toDataURL("image/png");
  scene!.remove(group);
  disposeGuitar(group);
  cache.set(k, url);
  return url;
}
