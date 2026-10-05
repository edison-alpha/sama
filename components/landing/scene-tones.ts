/** Shared palette for cinematic landing and documentation scenes. */
export type Tone = [base: string, a: string, b: string, c: string];

export const TONES = {
  navy: ["#0a1430", "#1f4fa8", "#e97863", "#0d2f6e"],
  forest: ["#07150f", "#1d5a45", "#3c7d5a", "#a9c47a"],
  amber: ["#160d07", "#8a4a1f", "#e0a35a", "#3b1f10"],
  plum: ["#140a10", "#7a2c3a", "#e97863", "#2a1430"],
  slate: ["#0b0f17", "#2b3d5c", "#6a87b8", "#1b2333"],
  ocean: ["#06121d", "#14537a", "#5fb3d9", "#0c2a44"],
} satisfies Record<string, Tone>;
