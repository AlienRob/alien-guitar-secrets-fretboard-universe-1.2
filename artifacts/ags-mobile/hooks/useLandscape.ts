import { useEffect } from "react";
import * as ScreenOrientation from "expo-screen-orientation";

/**
 * Lock to landscape while the component is mounted, restore default on unmount.
 * Used by all three fretboard games so the full neck is visible across the screen.
 */
export function useLandscape() {
  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
    };
  }, []);
}
