let cached: boolean | null = null;

// Detect whether the browser can create a WebGL context. Used to fall back to
// the flat SVG art on environments without WebGL (e.g. headless screenshots).
export function isWebGLAvailable(): boolean {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    cached = !!(window.WebGLRenderingContext && gl);
    // release the probe context so it doesn't consume a context slot
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}
