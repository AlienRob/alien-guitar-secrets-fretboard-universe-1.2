import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Loader2 } from "lucide-react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Guitar } from "@/data/guitars";
import { Handed } from "@/lib/playerCustomization";
import { isWebGLAvailable } from "@/lib/webgl";
import GuitarThumb from "@/components/guitar-thumb";
import mythicModelUrl from "@assets/base_basic_pbr.glb?url";

// Maps a guitar's `model3d` key to its bundled .glb. Keeping the asset import
// here (not in the data file) keeps guitars.ts a pure data module and lets the
// model files live alongside the renderer that knows how to draw them.
const MODEL_URLS: Record<string, string> = {
  "mythic-prime": mythicModelUrl,
};

// The model rests facing forward and can only be turned a little left/right, so
// it reads as a guitar hung in its display niche rather than a spinning prop.
const MAX_TURN = (25 * Math.PI) / 180;

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

// Loads the .glb, recenters it at the origin, and frames the camera so the whole
// model fits regardless of the canvas size.
function Model({ url, onReady }: { url: string; onReady: () => void }) {
  const { scene } = useGLTF(url);
  // Clone so we never mutate the cached original (it is shared across mounts);
  // geometry/materials are shared by reference and managed by the GLTF cache, so
  // we deliberately do NOT dispose them here.
  const group = useMemo(() => scene.clone(true), [scene]);

  // This component only mounts once the .glb has finished loading (Suspense),
  // so a mount-time effect is the signal to hide the thumbnail placeholder.
  useEffect(() => {
    onReady();
  }, [onReady]);

  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    group.position.set(0, 0, 0);
    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    // Recenter the model on the origin so it turns around its own middle.
    group.position.sub(center);

    const vFov = (cam.fov * Math.PI) / 180;
    const aspect = width / Math.max(1, height);
    const fitH = size.y / 2 / Math.tan(vFov / 2);
    const fitW = size.x / 2 / (Math.tan(vFov / 2) * aspect);
    const distance = 1.2 * Math.max(fitH, fitW);

    cam.position.set(0, 0, distance);
    cam.near = Math.max(0.01, distance / 100);
    cam.far = distance * 100;
    cam.updateProjectionMatrix();

    const oc = controls as unknown as {
      target: THREE.Vector3;
      update: () => void;
    } | null;
    if (oc) {
      oc.target.set(0, 0, 0);
      oc.update();
    }
  }, [group, camera, controls, width, height]);

  return <primitive object={group} />;
}

interface Props {
  guitar: Guitar;
  handed?: Handed;
  className?: string;
  // When true the user can drag the guitar a little left/right (the hanger /
  // close-up). When false there is no manual drag (e.g. the Hall dais and wall,
  // whose containers are pointer-events:none).
  interactive?: boolean;
  // When true the guitar slowly spins on its own (the showcase turntable used on
  // the Hall dais). Mutually exclusive with the +/-25 degrees drag clamp.
  autoRotate?: boolean;
}

// Renders a real uploaded 3D guitar model (.glb) live in the Hall. Falls back to
// the regular GuitarThumb when WebGL is unavailable or the guitar has no model.
// In the hanger/close-up it is static and can be dragged +/-25 degrees; on the
// dais it slowly turntable-spins via `autoRotate`.
export default function GuitarModel3D({
  guitar,
  handed = "right",
  className,
  interactive = true,
  autoRotate = false,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const url = guitar.model3d ? MODEL_URLS[guitar.model3d] : undefined;

  if (!url || !isWebGLAvailable()) {
    return <GuitarThumb guitar={guitar} handed={handed} className={className} />;
  }

  return (
    <div className={className} style={{ position: "relative" }}>
      {/* While the ~10MB model streams we show a neutral spinner, NOT the flat
          GuitarThumb — flashing the old 2D art before the 3D model "pops in"
          looked like a glitch. */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2
            className="h-6 w-6 animate-spin text-accent"
            style={{ opacity: 0.7 }}
          />
        </div>
      )}
      <Canvas
        camera={{ position: [0, 0, 6], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 8]} intensity={1.5} />
        <directionalLight position={[-6, 2, 4]} intensity={0.7} color="#7c5cff" />
        <RoomEnv />
        <Suspense fallback={null}>
          <Model url={url} onReady={() => setLoaded(true)} />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={false}
          enableRotate={interactive}
          autoRotate={autoRotate}
          autoRotateSpeed={4}
          enableDamping
          // Keep it upright (no vertical tilt). The +/-25 degrees clamp only
          // applies to the draggable hanger; the turntable needs a full 360 spin.
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
          {...(interactive && !autoRotate
            ? { minAzimuthAngle: -MAX_TURN, maxAzimuthAngle: MAX_TURN }
            : {})}
        />
      </Canvas>
    </div>
  );
}
