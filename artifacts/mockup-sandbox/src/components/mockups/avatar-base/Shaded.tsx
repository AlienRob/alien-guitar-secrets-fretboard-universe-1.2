import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { Suspense } from "react";

const MODEL_URL = "/models/base_basic_shaded.glb";

function AvatarModel() {
  const { scene } = useGLTF(MODEL_URL);
  return <primitive object={scene} scale={1.8} position={[0, -1.7, 0]} />;
}

export function Shaded() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#080b14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#9ca3af", fontFamily: "sans-serif", fontSize: 13, marginBottom: 8, letterSpacing: 2, textTransform: "uppercase" }}>Shaded (Stylised)</p>
      <div style={{ width: 320, height: 520, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(106,0,255,0.3)" }}>
        <Canvas camera={{ position: [0, 0.5, 3.2], fov: 45 }} shadows>
          <ambientLight intensity={1.2} />
          <directionalLight position={[2, 4, 2]} intensity={1.5} />
          <Suspense fallback={null}>
            <AvatarModel />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls enablePan={false} minDistance={1.5} maxDistance={5} target={[0, 0.3, 0]} />
        </Canvas>
      </div>
      <p style={{ color: "#6b7280", fontFamily: "sans-serif", fontSize: 11, marginTop: 8 }}>Drag to rotate</p>
    </div>
  );
}
