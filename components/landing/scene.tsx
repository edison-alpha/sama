"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { TONES, type Tone } from "./scene-tones";

export { TONES } from "./scene-tones";
export type { Tone } from "./scene-tones";

/**
 * Shared pieces for the cinematic landing cards: a dark ambient scene (drifting light blobs, grain, vignette), a
 * frosted glass panel, and an in-view hook that starts the reveal and the scene animations. Styles live in
 * globals.css under "Problem carousel".
 */

export function Scene({
  tone,
  className = "aspect-[437/460]",
  children,
  flat = false,
}: {
  tone: Tone;
  className?: string;
  children: ReactNode;
  /** Use one of the tone colors without the ambient blobs, grain, or vignette. */
  flat?: boolean;
}) {
  const [base, a, b, c] = tone;
  return (
    <div className={`ps-scene relative overflow-hidden rounded-[28px] text-white ${className}`} style={{ background: flat ? a : base }}>
      {!flat && <>
        <span className="ps-blob" style={{ background: a, left: "-20%", top: "-15%" }} />
        <span className="ps-blob" style={{ background: b, right: "-25%", bottom: "-20%", animationDelay: "-6s" }} />
        <span className="ps-blob ps-blob-sm" style={{ background: c, left: "30%", top: "40%", animationDelay: "-11s" }} />
        <span className="ps-grain" />
        <span className="ps-vignette" />
      </>}
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
