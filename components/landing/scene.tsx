"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Shared pieces for the cinematic landing cards: a dark ambient scene (drifting light blobs, grain, vignette), a
 * frosted glass panel, and an in-view hook that starts the reveal and the scene animations. Styles live in
 * globals.css under "Problem carousel".
 */

export type Tone = [base: string, a: string, b: string, c: string];

export const TONES = {
  navy: ["#0a1430", "#1f4fa8", "#e97863", "#0d2f6e"],
  forest: ["#07150f", "#1d5a45", "#3c7d5a", "#a9c47a"],
  amber: ["#160d07", "#8a4a1f", "#e0a35a", "#3b1f10"],
  plum: ["#140a10", "#7a2c3a", "#e97863", "#2a1430"],
  slate: ["#0b0f17", "#2b3d5c", "#6a87b8", "#1b2333"],
  ocean: ["#06121d", "#14537a", "#5fb3d9", "#0c2a44"],
} satisfies Record<string, Tone>;

export function Scene({ tone, className = "aspect-[437/460]", children }: { tone: Tone; className?: string; children: ReactNode }) {
  const [base, a, b, c] = tone;
  return (
    <div className={`ps-scene relative overflow-hidden rounded-[28px] text-white ${className}`} style={{ background: base }}>
      <span className="ps-blob" style={{ background: a, left: "-20%", top: "-15%" }} />
      <span className="ps-blob" style={{ background: b, right: "-25%", bottom: "-20%", animationDelay: "-6s" }} />
      <span className="ps-blob ps-blob-sm" style={{ background: c, left: "30%", top: "40%", animationDelay: "-11s" }} />
      <span className="ps-grain" />
      <span className="ps-vignette" />
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

export const Panel = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`glass glass-frost rounded-[20px] ${className}`}>{children}</div>
);

/** True while the element is on screen; drives the `data-inview` reveal and un-pauses scene animations. */
export function useInView<T extends Element>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e!.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}
