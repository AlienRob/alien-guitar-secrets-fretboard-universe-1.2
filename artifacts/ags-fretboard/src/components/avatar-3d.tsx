import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Loader2 } from "lucide-react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Catches a failed GLB load (network/decode error thrown through Suspense) and
// reports it so the caller can fall back to the 2D photo portrait.
class ModelErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// Renders a player's uploaded 3D avatar (.glb) live. One model per species +
// gender (meshopt-compressed, WebP textures). drei's useGLTF wires up the
// meshopt decoder automatically, so no extra setup is needed here.
//
// Two framings:
//   - headshot: the camera tucks in on the head + shoulders (used in small
//     portrait slots where a full figure would be tiny).
//   - full body (default): the whole figure is framed, anchored so the feet sit
//     near the bottom of the slot.
// `inspect` unlocks a full turntable drag (the enlarged detail view); otherwise
// the figure can be nudged a little left/right or slowly auto-rotates.

const MAX_TURN = (28 * Math.PI) / 180;

// Share of the figure's height framed for the head-and-shoulders close-up.
const HEADSHOT_FRACTION = 0.3;

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

function Model({
  url,
  headshot,
  onReady,
}: {
  url: string;
  headshot: boolean;
  onReady: () => void;
}) {
  const { scene } = useGLTF(url);
  // Clone so we never mutate the cached original (shared across mounts). Note the
  // clone shares geometries/materials/textures with the cached scene by
  // reference, so we deliberately do NOT dispose them on unmount — that would
  // corrupt every other mount of the same model. Their GPU resources are owned
  // and reused by drei's useGLTF cache (bounded: only 12 models exist).
  const group = useMemo(() => scene.clone(true), [scene]);

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
    // Recenter on the origin so it turns around its own middle.
    group.position.sub(center);

    const vFov = (cam.fov * Math.PI) / 180;
    const aspect = width / Math.max(1, height);

    // Height we want to frame: the whole figure, or just the top slice for the
    // head-and-shoulders close-up.
    const frameH = headshot ? size.y * HEADSHOT_FRACTION : size.y;
    const frameW = headshot ? size.x * 0.6 : size.x;
    const fitH = frameH / 2 / Math.tan(vFov / 2);
    const fitW = frameW / 2 / (Math.tan(vFov / 2) * aspect);
    const distance = 1.12 * Math.max(fitH, fitW);

    // Look at the head (top of the figure) for the close-up; the middle (with a
    // small upward bias toward the chest) for the full figure.
    const targetY = headshot
      ? size.y / 2 - frameH / 2
      : size.y * 0.04;

    cam.position.set(0, targetY, distance);
    cam.near = Math.max(0.01, distance / 100);
    cam.far = distance * 100;
    cam.updateProjectionMatrix();

    const oc = controls as unknown as {
      target: THREE.Vector3;
      update: () => void;
    } | null;
    if (oc) {
      oc.target.set(0, targetY, 0);
      oc.update();
    }
  }, [group, camera, controls, width, height, headshot]);

  return <primitive object={group} />;
}

interface Props {
  url: string;
  className?: string;
  headshot?: boolean;
  // Full turntable drag (the enlarged inspect view). Otherwise the figure is
  // limited to a small left/right nudge.
  inspect?: boolean;
  // Slow self-rotation (showcase). Mutually exclusive with the nudge clamp.
  autoRotate?: boolean;
  // Called when the GLB fails to load so the caller can fall back to the photo.
  onError?: () => void;
}

export default function Avatar3D({
  url,
  className,
  headshot = false,
  inspect = false,
  autoRotate = false,
  onError,
}: Props) {
  const [loaded, setLoaded] = useState(false);

  // Show the spinner again whenever the model swaps (e.g. changing species or
  // gender in the customiser) until the new figure has finished loading.
  useEffect(() => {
    setLoaded(false);
  }, [url]);

  return (
    <div className={className} style={{ position: "relative" }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" style={{ opacity: 0.7 }} />
        </div>
      )}
      <Canvas
        camera={{ position: [0, 0, 6], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 8]} intensity={1.4} />
        <directionalLight position={[-6, 3, 4]} intensity={0.6} color="#7c5cff" />
        <RoomEnv />
        <ModelErrorBoundary onError={() => onError?.()}>
          <Suspense fallback={null}>
            <Model url={url} headshot={headshot} onReady={() => setLoaded(true)} />
          </Suspense>
        </ModelErrorBoundary>
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={false}
          enableRotate={inspect || !autoRotate}
          autoRotate={autoRotate}
          autoRotateSpeed={3}
          enableDamping
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
          {...(!inspect && !autoRotate
            ? { minAzimuthAngle: -MAX_TURN, maxAzimuthAngle: MAX_TURN }
            : {})}
        />
      </Canvas>
    </div>
  );
}
