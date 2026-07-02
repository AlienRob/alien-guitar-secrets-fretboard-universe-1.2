import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Pause, Play } from "lucide-react";
import { Guitar } from "@/data/guitars";
import { Handed } from "@/lib/playerCustomization";
import { buildGuitarGroup, disposeGuitar } from "@/components/guitar3d";
import { isWebGLAvailable } from "@/lib/webgl";
import GuitarArt from "@/components/guitar-art";

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

// Builds the guitar and frames the camera so the entire model fits in view,
// regardless of shape (V/explorer are wide, others are tall) or viewport size.
function Scene({ guitar, handed }: { guitar: Guitar; handed: Handed }) {
  const group = useMemo(() => buildGuitarGroup(guitar, handed), [guitar, handed]);
  useEffect(() => () => disposeGuitar(group), [group]);

  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const vFov = (cam.fov * Math.PI) / 180;
    const aspect = width / Math.max(1, height);
    // Distance needed to fit the model's height, and to fit its width given
    // the canvas aspect. Use the larger so nothing is cropped, plus padding.
    const fitH = size.y / 2 / Math.tan(vFov / 2);
    const fitW = size.x / 2 / (Math.tan(vFov / 2) * aspect);
    const distance = 1.18 * Math.max(fitH, fitW);

    // Lift the camera slightly above centre so the turntable spin reads as a
    // 3D object (you see the top edge + back as it comes around) instead of a
    // flat slab flashing edge-on.
    cam.position.set(center.x, center.y + size.y * 0.06, distance);
    cam.near = Math.max(0.1, distance / 100);
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
      oc.minDistance = distance * 0.55;
      oc.maxDistance = distance * 2.2;
      oc.update();
    }
  }, [group, camera, controls, width, height]);

  return <primitive object={group} />;
}

interface Props {
  guitar: Guitar;
  handed?: Handed;
  className?: string;
}

export default function Guitar3DViewer({ guitar, handed = "right", className }: Props) {
  const [spinning, setSpinning] = useState(true);

  if (!isWebGLAvailable()) {
    return (
      <div
        className={className}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
      >
        <GuitarArt
          shape={guitar.shape}
          finish={guitar.finish}
          body={guitar.body}
          accent={guitar.accent}
          handed={handed}
          pickups={guitar.pickups}
          pickguard={guitar.pickguard}
          controls={guitar.controls}
          maple={guitar.maple}
          strings={guitar.strings}
          className="h-full w-auto"
        />
      </div>
    );
  }

  return (
    <div className={className} style={{ position: "relative" }}>
      <Canvas
        camera={{ position: [0, 0, 14], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        onPointerDown={() => setSpinning(false)}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 8]} intensity={1.6} />
        <directionalLight position={[-6, 2, 4]} intensity={0.7} color="#7c5cff" />
        <RoomEnv />
        <Scene guitar={guitar} handed={handed} />
        <ContactShadows position={[0, -4.6, 0]} opacity={0.4} scale={12} blur={2.6} far={6} />
        <OrbitControls
          makeDefault
          enablePan={false}
          autoRotate={spinning}
          autoRotateSpeed={1.6}
          enableDamping
        />
      </Canvas>

      {/* Explicit spin control — drag works too, but a tap target makes the
          "admire / spin" action obvious, especially on touch screens where a
          drag can fight with page scrolling. */}
      <button
        type="button"
        onClick={() => setSpinning((s) => !s)}
        className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 rounded-full border border-white/25 bg-black/55 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-foreground backdrop-blur transition-colors hover:border-accent/70 hover:text-accent"
        aria-label={spinning ? "Pause spin" : "Spin guitar"}
      >
        {spinning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        {spinning ? "Spinning" : "Spin"}
      </button>
    </div>
  );
}
