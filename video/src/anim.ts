import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_OUT } from "./theme";

/**
 * Scene timings are written in 30 fps "design frames" (1 s = 30). useT() turns the real frame into design frames, so
 * the video runs at any frame rate (it renders at 60) with the same tempo and smoother motion; springs use DESIGN_FPS.
 */
export const DESIGN_FPS = 30;
export function useT() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (frame * DESIGN_FPS) / fps;
}

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 (or from→to) between two frames, clamped, eased out. */
export function ramp(frame: number, start: number, end: number, from = 0, to = 1, easing = EASE_OUT) {
  return interpolate(frame, [start, end], [from, to], { ...clamp, easing });
}

/** Critically damped spring that starts at `delay`. */
export function pop(frame: number, fps: number, delay = 0, damping = 200) {
  return spring({ frame: frame - delay, fps, config: { damping } });
}

/** Fade + rise entrance, as the app's `rise` motion variant. */
export function enter(frame: number, fps: number, delay = 0, dist = 40): React.CSSProperties {
  const p = pop(frame, fps, delay);
  return { opacity: p, translate: `0px ${(1 - p) * dist}px`, filter: `blur(${(1 - p) * 8}px)` };
}

/** Up then down: a short press for button clicks. */
export function press(frame: number, at: number, len = 8) {
  return interpolate(frame, [at, at + len / 2, at + len], [0, 1, 0], clamp);
}

export function usd(value: number, digits = 2) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
}
