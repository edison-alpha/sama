import type React from "react";
import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, random, staticFile } from "remotion";
import { ramp, useT } from "./anim";
import { C, FONT, SHADOW_FLOAT } from "./theme";

/* ---------------------------------------------------------------------------
 * Video versions of Sama's UI pieces (components/ui, asset-icon, round/parts).
 * Same tokens and shapes, but every animation is driven by the current frame.
 * ------------------------------------------------------------------------- */

/** Soft drifting light over the app backdrop (the landing's ambient scene, in light mode). */
export const Ambient: React.FC<{ tint?: "cool" | "warm" }> = ({ tint = "cool" }) => {
  const f = useT();
  const blobs =
    tint === "cool"
      ? [
          { c: "#cfe0ff", x: -12, y: -30, s: 62, k: 0 },
          { c: "#fde3dc", x: 62, y: 46, s: 55, k: 3 },
          { c: "#dde8ff", x: 28, y: 68, s: 46, k: 6 },
        ]
      : [
          { c: "#fde0d8", x: -10, y: -25, s: 60, k: 0 },
          { c: "#d9e6ff", x: 60, y: 40, s: 58, k: 3 },
          { c: "#fff0e6", x: 30, y: 70, s: 44, k: 6 },
        ];
  return (
    <AbsoluteFill style={{ background: C.app, overflow: "hidden" }}>
      {blobs.map((b) => (
        <div
          key={b.c}
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.s}%`,
            aspectRatio: "1",
            borderRadius: "50%",
            background: b.c,
            filter: "blur(140px)",
            translate: `${Math.sin((f + b.k * 40) / 80) * 80}px ${Math.cos((f + b.k * 40) / 100) * 50}px`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** Floating frosted panel (.glass-panel-strong). */
export const Glass: React.FC<{ style?: CSSProperties; children?: ReactNode; radius?: number }> = ({ style, children, radius = 40 }) => (
  <div
    style={{
      background: "rgb(255 255 255 / 0.78)",
      border: "1px solid rgb(255 255 255 / 0.95)",
      boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.8), ${SHADOW_FLOAT}`,
      backdropFilter: "blur(30px) saturate(160%)",
      borderRadius: radius,
      fontFamily: FONT,
      color: C.ink,
      ...style,
    }}
  >
    {children}
  </div>
);

export type Tone = "neutral" | "accent" | "match" | "ok" | "warn" | "danger" | "rest";
const TONES: Record<Tone, [string, string]> = {
  neutral: [C.surface2, C.ink2],
  accent: [C.accentSoft, C.ink],
  match: [C.matchSoft, C.match],
  ok: [C.okSoft, C.ok],
  warn: [C.warnSoft, C.warn],
  danger: [C.dangerSoft, C.danger],
  rest: [C.restSoft, C.rest],
};

export const Badge: React.FC<{ tone?: Tone; dot?: boolean; children: ReactNode; size?: number; style?: CSSProperties }> = ({ tone = "neutral", dot, children, size = 22, style }) => {
  const f = useT();
  const [bg, fg] = TONES[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.45,
        borderRadius: 999,
        padding: `${size * 0.36}px ${size * 0.72}px`,
        fontSize: size,
        fontWeight: 500,
        lineHeight: 1,
        background: bg,
        color: tone === "accent" ? C.accentStrong : fg,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && <span style={{ width: size * 0.36, height: size * 0.36, borderRadius: 99, background: "currentColor", opacity: 0.55 + 0.45 * Math.sin(f / 6) }} />}
      {children}
    </span>
  );
};

/** Pill button (components/ui/button.tsx). `pressed` 0..1 squeezes it like active:scale-[0.97]. */
export const Pill: React.FC<{ variant?: "primary" | "secondary" | "ok" | "glass"; children: ReactNode; pressed?: number; size?: number; style?: CSSProperties }> = ({
  variant = "primary",
  children,
  pressed = 0,
  size = 28,
  style,
}) => {
  const v = {
    primary: { background: C.accent, color: "#fff", boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.25), 0 10px 30px -10px rgb(233 120 99 / 0.6)" },
    secondary: { background: "#fff", color: C.ink, border: `1px solid ${C.lineStrong}` },
    ok: { background: C.ok, color: "#fff", boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.25)" },
    glass: { ...GLASS_DARK, color: "#fff" },
  }[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        height: size * 2.5,
        padding: `0 ${size * 1.4}px`,
        borderRadius: 999,
        fontSize: size,
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: "nowrap",
        scale: String(1 - pressed * 0.05),
        ...v,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/** Clear liquid glass for use over imagery (.glass). */
export const GLASS_DARK: CSSProperties = {
  background: "linear-gradient(180deg, rgb(255 255 255 / 0.2) 0%, rgb(255 255 255 / 0.06) 55%, rgb(255 255 255 / 0.12) 100%)",
  border: "1px solid rgb(255 255 255 / 0.34)",
  backdropFilter: "blur(10px) saturate(150%)",
  boxShadow: "inset 0 2px 6px -2px rgb(255 255 255 / 0.35), 0 6px 24px rgb(0 18 60 / 0.16)",
};

const PNG = new Set(["NVDAB", "AAPLB", "TSLAB", "MSFTB", "GOOGLB", "AMZNB", "METAB", "NFLXB", "AMDB", "SPYB", "QQQB"]);

/** Asset logo: issuer PNG for bStocks, drawn chips for USDT / BNB. */
export const AssetIcon: React.FC<{ symbol: string; size?: number; ring?: boolean }> = ({ symbol, size = 56, ring }) => {
  const frame: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    boxShadow: ring ? `0 0 0 ${Math.max(3, size / 14)}px #fff, 0 6px 18px rgb(13 20 48 / 0.18)` : "0 1px 2px rgb(13 13 15 / 0.08)",
  };
  if (PNG.has(symbol)) return <Img src={staticFile(`assets/${symbol}.png`)} style={{ ...frame, objectFit: "cover" }} />;
  if (symbol === "USDT")
    return (
      <span style={{ ...frame, display: "grid", placeItems: "center", background: "#26a17b", color: "#fff", fontSize: size * 0.56, fontWeight: 700, fontFamily: FONT }}>₮</span>
    );
  return (
    <span style={{ ...frame, display: "grid", placeItems: "center", background: "#f3ba2f" }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="#fff">
        <path d="M12 3 9.3 5.7 12 8.4l2.7-2.7L12 3Zm-5.4 5.4L3.9 11.1l2.7 2.7 2.7-2.7-2.7-2.7Zm10.8 0-2.7 2.7 2.7 2.7 2.7-2.7-2.7-2.7ZM12 9.3l-2.7 2.7L12 14.7l2.7-2.7L12 9.3Zm0 6.3-2.7 2.7L12 21l2.7-2.7-2.7-2.7Z" />
      </svg>
    </span>
  );
};

const AVATAR_PAIRS = [
  ["#e97863", "#f6b39f"],
  ["#2563d9", "#8fb3ff"],
  ["#0d2f6e", "#4f7fd1"],
  ["#23955a", "#8fdcb0"],
  ["#c27400", "#ffc978"],
  ["#8a8173", "#d8cfbf"],
  ["#7a2c3a", "#e79aa6"],
];

/** Gradient avatar with initials, like boring-avatars in the app. */
export const Avatar: React.FC<{ name: string; size?: number; i?: number; style?: CSSProperties }> = ({ name, size = 64, i = 0, style }) => {
  const [a, b] = AVATAR_PAIRS[i % AVATAR_PAIRS.length]!;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: `linear-gradient(135deg, ${a}, ${b})`,
        color: "#fff",
        fontSize: size * 0.36,
        fontWeight: 600,
        fontFamily: FONT,
        boxShadow: "0 0 0 4px #fff",
        ...style,
      }}
    >
      {name}
    </span>
  );
};

/** Highlighter sweep behind text, as in the reference ("Directly."). */
export const Highlight: React.FC<{ children: ReactNode; progress: number; color?: string }> = ({ children, progress, color = C.highlight }) => (
  <span style={{ position: "relative", display: "inline-block", isolation: "isolate" }}>
    <span
      style={{
        position: "absolute",
        left: "-0.08em",
        right: "-0.08em",
        top: "0.06em",
        bottom: "0.02em",
        background: color,
        borderRadius: "0.12em",
        transformOrigin: "left center",
        scale: `${progress} 1`,
        zIndex: -1,
      }}
    />
    {children}
  </span>
);

/** Letters fade in out of order (the reference's "In roduci g" intro). */
export const ScatterText: React.FC<{ text: string; start?: number; spread?: number }> = ({ text, start = 0, spread = 30 }) => {
  const f = useT();
  return (
    <span style={{ whiteSpace: "pre" }}>
      {[...text].map((ch, i) => {
        const at = start + random(`${text}-${i}`) * spread;
        const o = ramp(f, at, at + 10);
        return (
          <span key={i} style={{ opacity: o, filter: `blur(${(1 - o) * 10}px)` }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/** macOS-style pointer with a click ripple. */
export const Cursor: React.FC<{ x: number; y: number; pressed?: number; opacity?: number }> = ({ x, y, pressed = 0, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity, pointerEvents: "none", zIndex: 50 }}>
    <span
      style={{
        position: "absolute",
        left: -30,
        top: -30,
        width: 60,
        height: 60,
        borderRadius: "50%",
        border: `3px solid ${C.accent}`,
        opacity: pressed * 0.8,
        scale: String(0.4 + pressed * 0.8),
      }}
    />
    <svg width="40" height="48" viewBox="0 0 20 24" style={{ position: "absolute", left: -4, top: -2, scale: String(1 - pressed * 0.12), filter: "drop-shadow(0 4px 8px rgb(0 0 0 / 0.25))" }}>
      <path d="M2 1.5v18.6l4.7-4.4 2.9 6.6 3.3-1.4-2.9-6.5h6.4L2 1.5Z" fill="#0d0d0f" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  </div>
);

export const Check: React.FC<{ size?: number; color?: string; stroke?: number }> = ({ size = 20, color = "currentColor", stroke = 2.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5 10 17.5 19 7" />
  </svg>
);

export const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = "currentColor" }) => {
  const f = useT();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ rotate: `${f * 14}deg` }}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

/** "01 · Know where you stand" step label above feature headlines. */
export const StepLabel: React.FC<{ n: string; children: ReactNode; style?: CSSProperties }> = ({ n, children, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 500, color: C.ink2, ...style }}>
    <span style={{ display: "grid", placeItems: "center", height: 44, padding: "0 16px", borderRadius: 999, background: C.accentSoft, color: C.accentStrong, fontSize: 22, fontVariantNumeric: "tabular-nums" }}>{n}</span>
    {children}
  </div>
);

/** One row of rounded segments sized by share, with the app's diagonal sheen (components/ui/mix-bar.tsx). */
export const MixBar: React.FC<{ parts: { key: string; value: number; color: string }[]; grow: number; height?: number }> = ({ parts, grow, height = 40 }) => {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div style={{ display: "flex", gap: 6, height }}>
      {parts.map((p, i) => (
        <span
          key={p.key}
          style={{
            flexGrow: (p.value / total) * Math.min(1, Math.max(0, grow * parts.length - i)),
            flexBasis: 0,
            minWidth: 10,
            borderRadius: height * 0.3,
            backgroundColor: p.color,
            backgroundImage: "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.16) 0 3px, transparent 3px 9px)",
            boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.35)",
          }}
        />
      ))}
    </div>
  );
};

/** The two coral pills of the Sama mark (public/sama-logo.svg); `apart` slides them away from each other. */
export const Mark: React.FC<{ height?: number; apart?: number; color?: string }> = ({ height = 200, apart = 0, color = C.accent }) => (
  <svg height={height} width={(height * 198) / 216} viewBox="0 0 198 216" style={{ overflow: "visible" }}>
    <path
      transform={`translate(${-apart} 0)`}
      fill={color}
      d="M12.4045 40.6518C7.09734 20.6101 21.7898 0 42.5223 0H62C78.5685 0 92 13.4315 92 30V186C92 202.569 78.5685 216 62 216H41.9217C21.3593 216 6.64315 195.697 11.6409 175.751C17.6093 151.932 23.4671 121.908 22.5965 98.3368C21.9503 80.841 17.3121 59.1844 12.4045 40.6518Z"
    />
    <path
      transform={`translate(${apart} 0)`}
      fill={color}
      d="M185.431 40.7636C190.798 20.693 176.099 0 155.323 0H135C118.431 0 105 13.4315 105 30V186C105 202.569 118.431 216 135 216H155.931C176.535 216 191.26 195.617 186.205 175.642C180.181 151.84 174.279 121.872 175.158 98.3368C175.81 80.8762 180.481 59.2715 185.431 40.7636Z"
    />
  </svg>
);
