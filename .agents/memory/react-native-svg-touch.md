---
name: react-native-svg touch interference on Android
description: SVG native views intercept touches even with pointerEvents="none"; fix is a plain View as the last child.
---

On Android (Expo Go), react-native-svg creates native Android Views that participate in Android's touch dispatch BELOW React Native's level. Even with `pointerEvents="none"` on the SVG wrapper View, the SVG native views intercept touches in areas where SVG elements are drawn (string lines, circles, text). This causes partial touch coverage — only taps landing on plain React Native Views (masks, padding areas) reach the responder chain correctly.

**The fix:** Render a dedicated plain `<View style={StyleSheet.absoluteFill}>` as the VERY LAST child of the component (after the SVG wrapper). Give it `onStartShouldSetResponder={() => true}` and `onResponderGrant` for touch handling. No SVG children — plain View only.

Being rendered last, it is topmost in z-order. Android's native touch dispatch hits this plain React Native View first, before any SVG native views. `locationX/Y` from `onResponderGrant` is always in its own coordinate space (= root space, since absoluteFill).

**Why:** `onStartShouldSetResponder` on the ROOT View alone is insufficient — if a touch starts on an SVG native view, it may be claimed by SVG before bubbling to the root, or `locationX/Y` may be wrong (relative to the SVG element, not the root). A topmost plain child View guarantees the touch starts at a known React Native View.

**How to apply:** Any component that layers SVG over touch-sensitive areas on Android. Applied in `game-neck.tsx` (fretboard games).

**Also:** musicTheory string convention (0 = high e, 5 = low E) is OPPOSITE to GameNeck col convention (0 = low E bottom, 5 = high e top). Game screens must flip: `stringIdx = 5 - col` when calling musicTheory, and `string: 5 - n.string` when passing highlights back to GameNeck. shape-spotter and alien-invasion had this right; note-hunt was missing it.
