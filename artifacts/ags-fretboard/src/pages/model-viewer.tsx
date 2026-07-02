import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Pause, Play, Loader2 } from "lucide-react";
import { isWebGLAvailable } from "@/lib/webgl";

// The optimized character model lives in /public/models. meshopt + webp keep it
// to ~6 MB (down from 40 MB); both decode in-browser with no external fetch.
const MODEL_URL = `${import.meta.env.BASE_URL}models/cosmic-avatar.glb`;

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

// Loads the GLB and frames the camera so the whole figure fits, whatever the
// viewport size. The model stands on y = 0, so we keep its feet on the floor.
function Model() {
  const { scene } = useGLTF(MODEL_URL, false);
  const model = useMemo(() => scene.clone(true), [scene]);

  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }, [model]);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const box = new THREE.Box3().setFromObject(model);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const vFov = (cam.fov * Math.PI) / 180;
    const aspect = width / Math.max(1, height);
    const fitH = size.y / 2 / Math.tan(vFov / 2);
    const fitW = size.x / 2 / (Math.tan(vFov / 2) * aspect);
    const distance = 1.25 * Math.max(fitH, fitW);

    cam.position.set(center.x, center.y + size.y * 0.05, distance);
    cam.near = Math.max(0.01, distance / 100);
    cam.far = distance * 100;
    cam.updateProjectionMatrix();

    const oc = controls as unknown as {
      target: THREE.Vector3;
      minDistance: number;
      maxDistance: number;
      update: () => void;
    } | null;
    if (oc) {
      oc.target.copy(center);
      oc.minDistance = distance * 0.4;
      oc.maxDistance = distance * 2.4;
      oc.update();
    }
  }, [model, camera, controls, width, height]);

  return <primitive object={model} />;
}

useGLTF.preload(MODEL_URL, false);

function Loader() {
  return (
    <Html center>
      <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading model
      </div>
    </Html>
  );
}

export default function ModelViewer() {
  const [spinning, setSpinning] = useState(true);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Model Preview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag to spin the 3D character. Scroll to zoom. This is a sandbox — it
          doesn't touch your avatar page.
        </p>
      </div>

      <div className="relative h-[70vh] min-h-[420px] overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-b from-[#0a0a1f] to-[#05060f] alien-glow">
        {!isWebGLAvailable() ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Your browser can't show 3D models (WebGL is unavailable).
          </div>
        ) : (
          <>
            <Canvas
              camera={{ position: [0, 1, 4], fov: 35 }}
              dpr={[1, 2]}
              shadows
              gl={{ antialias: true, alpha: true }}
              onPointerDown={() => setSpinning(false)}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[4, 8, 6]} intensity={1.6} castShadow />
              <directionalLight position={[-6, 3, 4]} intensity={0.7} color="#7c5cff" />
              <RoomEnv />
              <Suspense fallback={<Loader />}>
                <Model />
              </Suspense>
              <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={6} blur={2.4} far={4} />
              <OrbitControls
                makeDefault
                enablePan={false}
                autoRotate={spinning}
                autoRotateSpeed={1.4}
                enableDamping
              />
            </Canvas>

            <button
              type="button"
              onClick={() => setSpinning((s) => !s)}
              className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full border border-white/25 bg-black/55 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-foreground backdrop-blur transition-colors hover:border-accent/70 hover:text-accent"
              aria-label={spinning ? "Pause spin" : "Spin model"}
            >
              {spinning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {spinning ? "Spinning" : "Spin"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
