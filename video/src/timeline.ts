/**
 * Scene lengths in seconds. The promo's total length follows from these (minus the crossfade overlaps), so change a
 * scene here and SamaPromo, its Studio composition and the scene's own composition all pick it up.
 */
export const SCENE_SECONDS = {
  intro: 6.5,
  problem: 12,
  hook: 5.5,
  home: 14,
  target: 10,
  circle: 11,
  roundMatching: 9,
  solver: 13,
  roundDone: 14,
  stats: 8,
  outro: 8,
} as const;

export const CROSSFADE_SECONDS = 0.75;

const scenes = Object.values(SCENE_SECONDS);
export const PROMO_SECONDS = scenes.reduce((s, x) => s + x, 0) - (scenes.length - 1) * CROSSFADE_SECONDS;

/** Plays the whole promo faster (or slower); the promo's length is divided by it so it never ends on empty frames. */
export const PLAYBACK_RATE = 1.1;
