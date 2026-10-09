import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Clip, clipTime, type Segment, type Shot } from "./Clip";
import { D, Kicker, Stage, Words } from "./type";
import ai from "../../public/rec/ai.json";
import circle from "../../public/rec/circle.json";
import home from "../../public/rec/home.json";
import round from "../../public/rec/round.json";
import target from "../../public/rec/target.json";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const useS = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { s: frame / fps, frame, fps };
};

export function Open() {
  return (
    <Stage glow={0.6}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Words text="Every rebalance has *another* *side.*" at={0.35} size={110} />
      </AbsoluteFill>
    </Stage>
  );
}

export function Problem() {
  return (
    <Stage glow={0.4}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "relative", width: 1600, height: 260, display: "grid", placeItems: "center" }}>
          <div style={{ position: "absolute" }}><Words text="Someone wants the exact opposite trade." at={0.2} out={2.9} size={92} /></div>
          <div style={{ position: "absolute" }}><Words text="But you never meet." at={3.3} out={4.9} size={92} /></div>
          <div style={{ position: "absolute" }}><Words text="So everyone pays *the* *pool.*" at={5.1} size={92} /></div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/** Live PancakeSwap V3 quotes for a $10K USDT buy, 7 Oct 2026 (the pitch deck's numbers). */
const COSTS = [
  { sym: "NVDAB", pct: 0.26 },
  { sym: "NFLXB", pct: 1.48 },
  { sym: "NOKB", pct: 7.7 },
  { sym: "MUB", pct: 75 },
];

export function Cost() {
  const { s, frame, fps } = useS();
  const n = interpolate(s, [0.3, 1.8], [0, 4.4], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const bigOut = interpolate(s, [3.9, 4.4], [1, 0], clamp);
  const chartIn = spring({ frame: frame - 4.2 * fps, fps, config: { damping: 30 } });
  return (
    <Stage glow={0.5}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: bigOut, filter: `blur(${(1 - bigOut) * 12}px)`, scale: `${1 + (1 - bigOut) * 0.06}` }}>
        <div style={{ fontSize: 340, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1, color: D.accent, fontVariantNumeric: "tabular-nums" }}>{n.toFixed(1)}%</div>
        <Words text="median cost of a $10K swap in bStock pools under $100K" at={0.9} size={40} weight={500} color={D.ink2} gap={0.03} style={{ marginTop: 24 }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: chartIn }}>
        <div style={{ width: 1280 }}>
          <Words text="What one wallet pays to swap $10K alone" at={4.3} size={44} weight={600} align="left" gap={0.03} />
          <div style={{ marginTop: 48, display: "grid", gap: 26 }}>
            {COSTS.map((c, i) => {
              const p = spring({ frame: frame - (4.6 + i * 0.22) * fps, fps, config: { damping: 30, stiffness: 80 } });
              const w = Math.max(0.012, Math.log10(1 + c.pct * 4) / Math.log10(301)) * 980;
              return (
                <div key={c.sym} style={{ display: "grid", gridTemplateColumns: "150px 1fr", alignItems: "center", opacity: p }}>
                  <div style={{ fontSize: 34, fontWeight: 600, color: D.ink2 }}>{c.sym}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                    <div style={{ height: 44, width: w * p, borderRadius: 999, background: i === 3 ? `linear-gradient(90deg, ${D.accent}, ${D.accentHot})` : "rgb(255 255 255 / 0.16)" }} />
                    <div style={{ fontSize: 36, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: i === 3 ? D.accent : D.ink }}>{(c.pct * p).toFixed(c.pct < 1 ? 2 : c.pct < 10 ? 1 : 0)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 44, fontSize: 22, color: D.ink3, opacity: interpolate(s, [5.6, 6.2], [0, 1], clamp) }}>Live PancakeSwap V3 quotes, $10K USDT buy, 7 Oct 2026. Pool scan of 88 bStocks.</div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

export function Meet() {
  const { s, frame, fps } = useS();
  const p = spring({ frame: frame - 0.15 * fps, fps, config: { damping: 18, stiffness: 70, mass: 1.2 } });
  const word = spring({ frame: frame - 1.0 * fps, fps, config: { damping: 30 } });
  const bloom = interpolate(s, [0, 1.2], [0, 1], clamp);
  return (
    <Stage glow={1.2}>
      <AbsoluteFill style={{ background: `radial-gradient(28% 32% at 50% 44%, rgb(247 64 27 / ${0.35 * bloom}), transparent 70%)` }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 46 }}>
        <Img src={staticFile("icon-512.png")} style={{ width: 300, height: 300, scale: `${0.6 + p * 0.4}`, opacity: Math.min(1, p * 1.5), rotate: `${(1 - p) * -8}deg`, filter: `blur(${(1 - p) * 10}px) drop-shadow(0 40px 80px rgb(247 64 27 / 0.45))` }} />
        <div style={{ opacity: word, translate: `0 ${(1 - word) * 30}px`, filter: `blur(${(1 - word) * 10}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <Img src={staticFile("sama-wordmark.svg")} style={{ height: 104 }} />
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/** A recording scene: a headline above the window that clears once the camera moves in. */
function ClipScene({ kicker, title, titleOut, clip }: { kicker?: string; title: string; titleOut: number; clip: React.ReactNode }) {
  return (
    <Stage glow={0.7}>
      {clip}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 34 }}>
        {kicker ? <Kicker text={kicker} at={0.1} out={titleOut} /> : null}
        <Words text={title} at={0.25} out={titleOut} size={58} style={{ marginTop: 10 }} />
      </AbsoluteFill>
    </Stage>
  );
}

export const HOME_SEGS: Segment[] = [{ from: 0.4, to: 10.5, rate: 1.3 }];
export function Home() {
  const shots: Shot[] = [
    { t: 0, zoom: 1 },
    { t: 1.6, zoom: 1 },
    { t: 3.0, zoom: 1.55, x: 700, y: 330 },
    { t: 4.6, zoom: 1.55, x: 760, y: 360 },
    { t: 5.8, zoom: 1.3, x: 1120, y: 880 },
    { t: 7.8, zoom: 1.35, x: 1180, y: 900 },
  ];
  return <ClipScene kicker="Your wallet" title="Your stocks never leave it." titleOut={2.4} clip={<Clip name="home" log={home} segments={HOME_SEGS} shots={shots} offsetY={70} />} />;
}

export const TARGET_SEGS: Segment[] = [{ from: 0.5, to: 8.0, rate: 1.05 }];
export function Target() {
  const shots: Shot[] = [
    { t: 0, zoom: 1 },
    { t: 2.6, zoom: 1 },
    { t: 3.8, zoom: 1.4, x: 820, y: 560 },
    { t: 6.6, zoom: 1.45, x: 900, y: 500 },
  ];
  return <ClipScene kicker="Target" title="Set the mix you want. Once." titleOut={3.0} clip={<Clip name="target" log={target} segments={TARGET_SEGS} shots={shots} offsetY={70} />} />;
}

/** Ask, wait (sped up), read the answer card; then the second question's answer. */
export const AI_SEGS: Segment[] = [
  { from: 2.6, to: 7.9, rate: 1.7 },
  { from: 7.9, to: 18.0, rate: 3.4 },
  { from: 18.0, to: 22.6, rate: 1 },
  { from: 31.6, to: 37.8, rate: 1 },
];
export function Ai() {
  const shots: Shot[] = [
    { t: 0, zoom: 1 },
    { t: 1.2, zoom: 1.0 },
    { t: 2.6, zoom: 1.5, x: 960, y: 780 },
    { t: 6.2, zoom: 1.55, x: 960, y: 760 },
    { t: 10.4, zoom: 1.55, x: 960, y: 700 },
  ];
  const { s } = useS();
  const badge = interpolate(s, [0.6, 1.2], [0, 1], clamp);
  return (
    <Stage glow={0.7}>
      <Clip name="ai" log={ai} segments={AI_SEGS} shots={shots} offsetY={70} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 34 }}>
        <Kicker text="AI assistant" at={0.1} out={2.2} />
        <Words text="Just say it." at={0.25} out={2.2} size={58} style={{ marginTop: 10 }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", right: 56, top: 44, display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderRadius: 999, background: "rgb(255 255 255 / 0.06)", boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.1)", backdropFilter: "blur(20px)", fontSize: 22, fontWeight: 600, color: D.ink2, opacity: badge }}>
        <span style={{ width: 10, height: 10, borderRadius: 99, background: D.ok, boxShadow: `0 0 12px ${D.ok}` }} />
        Real responses · app.samafi.xyz
      </div>
    </Stage>
  );
}

export const CIRCLE_SEGS: Segment[] = [{ from: 0.5, to: 9.2, rate: 1.15 }];
export function CircleScene() {
  const shots: Shot[] = [
    { t: 0, zoom: 1 },
    { t: 2.6, zoom: 1 },
    { t: 3.8, zoom: 1.35, x: 1180, y: 380 },
    { t: 6.8, zoom: 1.4, x: 1280, y: 420 },
  ];
  return <ClipScene kicker="Circles" title="Rebalance together." titleOut={2.4} clip={<Clip name="circle" log={circle} segments={CIRCLE_SEGS} shots={shots} offsetY={70} />} />;
}

/** The whole round, one take: join → match → approve → settle → finish. Beats are scene seconds for the VO. */
export const ROUND_SEGS: Segment[] = [
  { from: 0.4, to: 5.0, rate: 1 },
  { from: 5.0, to: 12.2, rate: 1.15 },
  { from: 12.2, to: 16.6, rate: 0.65 },
  { from: 16.6, to: 27.4, rate: 1.35 },
  { from: 27.4, to: 40.2, rate: 2.0 },
  { from: 40.2, to: 44.5, rate: 1 },
];
const segStarts = ROUND_SEGS.reduce<number[]>((a, g, i) => [...a, (a[i] ?? 0) + (g.to - g.from) / (g.rate ?? 1)], [0]);
export const ROUND_BEATS = { join: segStarts[0]!, match: segStarts[1]!, paired: segStarts[2]!, settle: segStarts[3]!, leftover: segStarts[4]!, done: segStarts[5]!, end: segStarts[6]! };

const STEPS = ["Join", "Match", "Approve", "Settle", "Finish"] as const;
export function Round() {
  const { s } = useS();
  const B = ROUND_BEATS;
  const shots: Shot[] = [
    { t: 0, zoom: 1 },
    { t: 1.0, zoom: 1.3, x: 900, y: 560 },
    { t: 3.2, zoom: 1.3, x: 1150, y: 520 },
    { t: B.match - 0.2, zoom: 1.0 },
    { t: B.paired, zoom: 1.0 },
    { t: B.paired + 1.0, zoom: 2.0, x: 760, y: 560 },
    { t: B.settle - 0.6, zoom: 1.9, x: 800, y: 600 },
    { t: B.settle + 0.6, zoom: 1.12, x: 1100, y: 560 },
    { t: B.leftover - 0.4, zoom: 1.12, x: 1100, y: 560 },
    { t: B.leftover + 0.6, zoom: 1.25, x: 1200, y: 600 },
    { t: B.done, zoom: 1.0 },
    { t: B.done + 1.0, zoom: 1.45, x: 900, y: 420 },
  ];
  // The step pill follows the app's own stepper: read the stage from the recording's marks, not the voice-over beats.
  const at = (label: string) => round.marks.find((m) => m.label === label)!.t;
  const c = clipTime(ROUND_SEGS, s);
  const step = c < at("signed") ? 0 : c < at("paired") ? 1 : c < at("settling") ? 2 : c < at("leftover") ? 3 : 4;
  return (
    <Stage glow={0.7}>
      <Clip name="round" log={round} segments={ROUND_SEGS} shots={shots} offsetY={70} />
      <div style={{ position: "absolute", left: "50%", top: 40, translate: "-50% 0", display: "flex", gap: 10, padding: 8, borderRadius: 999, background: "rgb(20 20 22 / 0.72)", boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.09), 0 20px 50px rgb(0 0 0 / 0.5)", backdropFilter: "blur(24px)", opacity: interpolate(s, [0.2, 0.8], [0, 1], clamp) }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ padding: "10px 22px", borderRadius: 999, fontSize: 22, fontWeight: 600, color: i === step ? "#fff" : i < step ? D.ink2 : D.ink3, background: i === step ? D.accent : "transparent", transition: "none" }}>
            {i < step ? "✓ " : `${i + 1}  `}
            {label}
          </div>
        ))}
      </div>
    </Stage>
  );
}

export function Proof() {
  const { frame, fps } = useS();
  const rows = ["Verified on BscScan", "BNB Chain mainnet", "Independently checked after every round"];
  return (
    <Stage glow={0.8}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Kicker text="Settlement contract" at={0.1} />
        <Words text="SamaSettlement" at={0.3} size={120} style={{ marginTop: 14 }} />
        <div style={{ marginTop: 22, fontSize: 34, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: D.ink2, letterSpacing: "0.04em", opacity: spring({ frame: frame - 0.8 * fps, fps, config: { damping: 30 } }) }}>0x7811a30D29d6c2Ca95Aeb4EE9D896cE44Cb72AC8</div>
        <div style={{ marginTop: 60, display: "flex", gap: 22 }}>
          {rows.map((r, i) => {
            const p = spring({ frame: frame - (1.4 + i * 0.25) * fps, fps, config: { damping: 26 } });
            return (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 28px", borderRadius: 999, background: "rgb(255 255 255 / 0.05)", boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.09)", fontSize: 28, fontWeight: 600, opacity: p, translate: `0 ${(1 - p) * 24}px` }}>
                <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 99, background: "rgb(76 200 132 / 0.16)", color: D.ok, fontSize: 20 }}>✓</span>
                {r}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/** Closing frame on the brand image (public/outro-bg.webp): a slow push-in, the line set in the open sky. */
export function Outro() {
  const { s, frame, fps } = useS();
  const p = spring({ frame: frame - 0.1 * fps, fps, config: { damping: 22, stiffness: 80 } });
  const reveal = interpolate(s, [0, 1.2], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#0a2a6b", overflow: "hidden" }}>
      <Img src={staticFile("outro-bg.webp")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", scale: `${1.12 - interpolate(s, [0, 6], [0, 0.08], clamp)}`, filter: `blur(${(1 - reveal) * 16}px)`, opacity: reveal }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgb(8 24 70 / 0.35) 0%, transparent 45%)" }} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 120 }}>
        <Img src={staticFile("icon-512.png")} style={{ width: 132, height: 132, opacity: p, scale: `${0.8 + p * 0.2}`, filter: "drop-shadow(0 24px 50px rgb(0 0 0 / 0.35))" }} />
        <Words text="Don't swap alone." at={0.5} size={120} style={{ marginTop: 36, textShadow: "0 4px 30px rgb(0 0 0 / 0.25)" }} />
        <Words text="samafi.xyz" at={1.4} size={36} weight={500} color="rgb(255 255 255 / 0.78)" style={{ marginTop: 22 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
