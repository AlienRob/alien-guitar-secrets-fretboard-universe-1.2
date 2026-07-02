---
name: SVG inside Animated.View
description: react-native-svg components crash when placed inside Animated.View on native.
---

## The rule

Never place `react-native-svg` elements (`<Svg>`, `<Circle>`, `<Line>`, etc.) as direct or
indirect children of `Animated.View` on React Native / Expo Go.

**Why:** React Native's Animated system tries to attach child-tracking listeners to every
descendant by calling `this._children.push(child)` on the underlying animated node. SVG
elements from react-native-svg are frozen native objects — they reject property mutation and
throw `TypeError: cannot add a new property`. The crash happens at render time, before any
animation fires.

**How to apply:**
- For animated opacity/scale on an SVG scene: put the `<Svg>` inside a plain `<View>`, then
  wrap THAT View in `Animated.View`. The plain View is a transparent pass-through and doesn't
  get mutation-tracked.
- For animated ring/circle shapes: replace SVG `<Circle>` with a `<View>` using
  `borderRadius` = half the diameter and `borderWidth` + `borderColor` to draw the ring.
  Views work fine inside `Animated.View`.
- Avoid passing `Animated.Value` as a prop (`strokeWidth`, `r`, `x`, etc.) directly to SVG
  elements — same class of error. Use `createAnimatedComponent(Circle)` from react-native-svg
  if you truly need per-prop animation on an SVG element.
