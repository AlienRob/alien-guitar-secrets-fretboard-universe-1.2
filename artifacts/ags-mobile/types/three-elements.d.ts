// React Three Fiber augments the JSX namespace so intrinsic elements like
// <primitive>, <ambientLight>, <directionalLight> typecheck. On @types/react 19.2
// (used by Expo) the JSX namespace lives at React.JSX, which the library's own
// `declare module 'react'` augmentation does not reliably merge into. React is
// exposed as a global namespace (`export as namespace React`), so we re-apply the
// element map directly to React.JSX here.
import type { ThreeElements } from "@react-three/fiber";

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}

export {};
