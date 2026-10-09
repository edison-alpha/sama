import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "../theme";

/** Demo palette: Sama's dark theme (styles/tokens.css :root[data-theme="dark"]) with the brand coral. */
export const D = {
  bg: "#050506",
  ink: "#f4f4f2",
  ink2: "#a1a1a6",
  ink3: "#6e6e73",
  accent: "#e97863",
  accentHot: "#f7401b",
  ok: "#4cc884",
  match: "#6b9cff",
} as const;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Near-black stage with a slow, warm glow that drifts, so stills never look frozen. */
export function Stage({ children, glow = 1 }: { children?: React.ReactNode; glow?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;
  const gx = 50 + Math.sin(s * 0.21) * 8;
  const gy = 112 + Math.cos(s * 0.17) * 4;
  return (
    <AbsoluteFill style={{ background: D.bg, fontFamily: FONT, color: D.ink, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(60% 55% at ${gx}% ${gy}%, rgb(233 120 99 / ${0.2 * glow}), transparent 70%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 0%, rgb(255 255 255 / 0.035), transparent 60%)" }} />
      {children}
    </AbsoluteFill>
  );
}

/**
 * Words rise out of a blur one after another. `at` is the start in seconds; `out` fades the whole line away.
 * Wrap a word in *asterisks* to set it in the brand coral.
 */
export function Words({ text, at = 0, out, size = 96, weight = 600, color = D.ink, gap = 0.07, style, align = "center" }: { text: string; at?: number; out?: number; size?: number; weight?: number; color?: string; gap?: number; style?: React.CSSProperties; align?: "center" | "left" }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;
  const fade = out === undefined ? 1 : interpolate(s, [out, out + 0.45], [1, 0], clamp);
  const words = text.split(" ");
  return (
    <div style={{ fontSize: size, fontWeight: weight, letterSpacing: "-0.035em", lineHeight: 1.06, textAlign: align, opacity: fade, filter: `blur(${(1 - fade) * 10}px)`, ...style }}>
      {words.map((w, i) => {
        const p = spring({ frame: frame - (at + i * gap) * fps, fps, config: { damping: 28, stiffness: 90 } });
        const hot = w.startsWith("*") && w.endsWith("*");
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p, translate: `0 ${(1 - p) * 0.35 * size}px`, filter: `blur(${(1 - p) * 14}px)`, color: hot ? D.accent : color }}>
            {(hot ? w.slice(1, -1) : w) + (i < words.length - 1 ? " " : "")}
          </span>
        );
      })}
    </div>
  );
}

/** Small uppercase label above a scene ("Step 2 · Match"). */
export function Kicker({ text, at = 0, out, style }: { text: string; at?: number; out?: number; style?: React.CSSProperties }) {
  return <Words text={text} at={at} out={out} size={26} weight={600} color={D.ink2} gap={0.03} style={{ letterSpacing: "0.14em", textTransform: "uppercase", ...style }} />;
}

/** Fades a whole scene in and out at its edges, for soft cuts between scenes. */
export function useSceneFade(duration: number, fadeIn = 0.4, fadeOut = 0.4) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;
  return Math.min(interpolate(s, [0, fadeIn], [0, 1], clamp), interpolate(s, [duration - fadeOut, duration], [1, 0], clamp));
}
