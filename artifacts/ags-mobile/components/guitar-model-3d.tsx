// React Native's Hermes engine has no global `TextDecoder`, which three's
// GLTFLoader calls to read the .glb's JSON chunk. Without it, `GLTFLoader.parse`
// throws on the phone and the viewer drops to the photo. We assign the polyfill
// constructors onto globalThis ourselves (the package's own side-effect binds to
// `this`, which isn't the real global under Metro). Pure JS, so it works in Expo
// Go with no native rebuild. Must run before GLTFLoader is used.
import {
  TextDecoder as PolyTextDecoder,
  TextEncoder as PolyTextEncoder,
} from "text-encoding-polyfill";

const g = globalThis as unknown as {
  TextDecoder?: unknown;
  TextEncoder?: unknown;
};
if (typeof g.TextDecoder === "undefined") g.TextDecoder = PolyTextDecoder;
if (typeof g.TextEncoder === "undefined") g.TextEncoder = PolyTextEncoder;

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Asset } from "expo-asset";
import { File as FsFile, Paths } from "expo-file-system";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";

// WebGL is always present on native (expo-gl). On web (the preview the user
// sees in their browser) we feature-detect, so headless/old browsers fall back
// to the flat photo instead of a blank canvas.
function isWebGLAvailable(): boolean {
  if (Platform.OS !== "web") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      (window as unknown as { WebGLRenderingContext?: unknown })
        .WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// Reads the bundled .glb into memory and parses it ourselves. We deliberately do
// NOT hand a URL to three's loader: on native the asset lives at a `file:///`
// path that three's XHR-based fetch can't read ("Could not load file:///..."),
// so we load the bytes (fetch on web, expo-file-system on native) and feed them
// to GLTFLoader.parse, which never touches the network.
async function loadGuitarScene(model: number): Promise<THREE.Group> {
  const asset = Asset.fromModule(model);

  let buffer: ArrayBuffer;
  if (Platform.OS === "web") {
    if (!asset.downloaded) await asset.downloadAsync();
    buffer = await fetch(asset.localUri ?? asset.uri).then((r) =>
      r.arrayBuffer(),
    );
  } else if (
    asset.uri.startsWith("http://") ||
    asset.uri.startsWith("https://")
  ) {
    // Expo Go (dev): the asset URL is plain http, and the Replit proxy answers
    // http with a 301 redirect whose tiny HTML body (`<a href="https://...">`)
    // expo-asset's downloader saved verbatim instead of following — so reading
    // it gave us HTML, not the glb. Force https and download the bytes
    // ourselves to a cache file, then read them (reliable for binary, unlike
    // RN's `fetch().arrayBuffer()`).
    const httpsUri = asset.uri.replace(/^http:\/\//, "https://");
    const fileName = `${asset.name || "guitar-model"}.${asset.type || "glb"}`;
    const dest = new FsFile(Paths.cache, fileName);
    if (dest.exists) dest.delete();
    await FsFile.downloadFileAsync(httpsUri, dest);
    buffer = await dest.arrayBuffer();
  } else {
    // Production build: the asset is bundled locally (file://), no network.
    if (!asset.downloaded) await asset.downloadAsync();
    buffer = await new FsFile(asset.localUri ?? asset.uri).arrayBuffer();
  }

  // Diagnostic guard: a valid .glb starts with the ASCII magic "glTF". If the
  // device fetched an HTML page or error text instead (e.g. wrong asset URL),
  // surface exactly what came back so we can see it on-screen.
  const head = new Uint8Array(buffer.slice(0, 4));
  const magic = String.fromCharCode(head[0], head[1], head[2], head[3]);
  if (magic !== "glTF") {
    const preview = new TextDecoder()
      .decode(new Uint8Array(buffer.slice(0, 64)))
      .replace(/\s+/g, " ")
      .trim();
    throw new Error(
      `not a glb (got "${magic}", ${buffer.byteLength}B) ` +
        `localUri=${asset.localUri ?? "null"} uri=${asset.uri} ` +
        `body="${preview}"`,
    );
  }

  const gltf = await new Promise<GLTF>((resolve, reject) => {
    new GLTFLoader().parse(buffer, "", resolve, reject);
  });
  return gltf.scene;
}

// Frees the geometry, materials, and textures of a scene we own (we parsed it
// ourselves, so there's no shared GLTF cache to corrupt). Called when the viewer
// closes or swaps models so reopening doesn't leak GPU memory.
function disposeScene(root: THREE.Object3D) {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material;
    const mats = Array.isArray(material) ? material : material ? [material] : [];
    for (const mat of mats) {
      for (const key of Object.keys(mat)) {
        const value = (mat as unknown as Record<string, unknown>)[key];
        if (value && (value as THREE.Texture).isTexture) {
          (value as THREE.Texture).dispose();
        }
      }
      mat.dispose();
    }
  });
}

// Lights the PBR materials with a procedural studio reflection map. Without an
// environment map a `base_basic_pbr` model renders nearly black (looks like it
// failed to load), so this is essential, not decorative. Procedural means no
// network fetch. Ported from the web renderer.
function RoomEnv() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
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

// Recenters the already-loaded scene at the origin and frames the camera so the
// whole guitar fits regardless of canvas size. Ported from the web renderer.
function Model({ object }: { object: THREE.Group }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    object.position.set(0, 0, 0);
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    object.position.sub(center);

    const vFov = (cam.fov * Math.PI) / 180;
    const aspect = width / Math.max(1, height);
    const fitH = size.y / 2 / Math.tan(vFov / 2);
    const fitW = size.x / 2 / (Math.tan(vFov / 2) * aspect);
    const distance = 1.3 * Math.max(fitH, fitW);

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
  }, [object, camera, controls, width, height]);

  return <primitive object={object} />;
}

interface Props {
  // The bundled .glb (a `require(...)` asset module id).
  model: number;
  // Shown while WebGL is unavailable (e.g. the headless screenshot browser) or
  // if the model fails to load.
  photoFallback: ImageSourcePropType;
}

// On-demand interactive 3D guitar. Drag to rotate, pinch / wheel to zoom.
export default function GuitarModel3D({ model, photoFallback }: Props) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [failed, setFailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let loaded: THREE.Group | null = null;
    setScene(null);
    setFailed(false);
    setErrorMsg(null);
    loadGuitarScene(model)
      .then((group) => {
        if (active) {
          loaded = group;
          setScene(group);
        } else {
          disposeScene(group);
        }
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error
            ? `${err.name}: ${err.message}`
            : String(err);
        // eslint-disable-next-line no-console
        console.warn("[GuitarModel3D] load failed:", msg);
        if (active) {
          setErrorMsg(msg);
          setFailed(true);
        }
      });
    return () => {
      active = false;
      if (loaded) disposeScene(loaded);
    };
  }, [model]);

  if (failed || !isWebGLAvailable()) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Image
          source={photoFallback}
          style={styles.fallbackImg}
          resizeMode="contain"
        />
        {errorMsg && (
          <Text style={styles.errorText} selectable>
            3D load error: {errorMsg}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {!scene && (
        <View
          style={[StyleSheet.absoluteFill, styles.center]}
          pointerEvents="none"
        >
          <ActivityIndicator color="#7c5cff" />
        </View>
      )}
      {scene && (
        <Canvas
          camera={{ position: [0, 0, 6], fov: 35 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 8]} intensity={1.5} />
          <directionalLight
            position={[-6, 2, 4]}
            intensity={0.7}
            color="#7c5cff"
          />
          <RoomEnv />
          <Model object={scene} />
          <OrbitControls
            makeDefault
            enablePan={false}
            enableZoom
            enableRotate
            enableDamping
          />
        </Canvas>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  fallbackImg: { width: "80%", height: "80%" },
  errorText: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    color: "#ff8a8a",
    fontSize: 12,
    textAlign: "center",
  },
});
