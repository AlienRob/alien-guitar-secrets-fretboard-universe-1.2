// One-shot "whacked out" 80s shred lick played when the player levels up and a
// new guitar is revealed. A single audio element is reused and rewound on each
// play so rapid level-ups don't stack overlapping copies.

import lickUrl from "@assets/generated_audio/levelup_shred_lick.mp3";

let el: HTMLAudioElement | null = null;

export function playLevelUpLick(): void {
  try {
    if (!el) {
      el = new Audio(lickUrl);
      el.preload = "auto";
      // This lick is mastered very hot, so it needs a low playback level to sit
      // evenly with the rest of the app. At higher levels it was jarringly loud
      // and off-putting on a level-up; keep it as a tasteful flourish.
      el.volume = 0.08;
    }
    el.currentTime = 0;
    void el.play().catch(() => {
      // gesture/autoplay restrictions — silently skip the flourish
    });
  } catch {
    // ignore — sound is a non-critical flourish
  }
}
