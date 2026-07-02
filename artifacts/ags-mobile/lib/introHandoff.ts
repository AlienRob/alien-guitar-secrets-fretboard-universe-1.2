/**
 * Module-level flag: intro.tsx sets it before navigating away;
 * the tabs layout reads + clears it on mount to know whether to
 * start with a black overlay and fade in.
 */
let _pending = false;

export function markIntroComplete(): void {
  _pending = true;
}

export function consumeIntroFade(): boolean {
  const v = _pending;
  _pending = false;
  return v;
}
