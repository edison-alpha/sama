import type React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { DESIGN_FPS, enter, pop, ramp, useT } from "../anim";
import { Ambient, AssetIcon, Avatar, Badge, Check, Glass, Highlight, MixBar, StepLabel } from "../ui";
import { C, FONT } from "../theme";

type Pt = [number, number];
const O: Pt = [960, 640];
/** Maya sells AAPLB for TSLAB, Alex sells TSLAB for NVDAB, you sell NVDAB for AAPLB: no pair matches, the ring does. */
const NODES: { name: string; pos: Pt; give: string; want: string; i: number }[] = [
  { name: "Maya", pos: [960, 400], give: "AAPLB", want: "TSLAB", i: 0 },
  { name: "Alex", pos: [1290, 820], give: "TSLAB", want: "NVDAB", i: 1 },
  { name: "You", pos: [630, 820], give: "NVDAB", want: "AAPLB", i: 3 },
];
/** [from node, to node, token]: each wallet's sale lands with the wallet that wants it. */
const FLOWS: [number, number, string][] = [
  [0, 2, "AAPLB"],
  [1, 0, "TSLAB"],
  [2, 1, "NVDAB"],
];

function control(a: Pt, b: Pt): Pt {
  const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return [m[0] + (m[0] - O[0]) * 0.9, m[1] + (m[1] - O[1]) * 0.9];
}
function at(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
}

const Node: React.FC<{ n: (typeof NODES)[number]; appear: number; matched: number }> = ({ n, appear, matched }) => (
  <div style={{ position: "absolute", left: n.pos[0], top: n.pos[1], translate: "-50% -50%", opacity: appear, scale: String(interpolate(appear, [0, 1], [0.7, 1])) }}>
    <Glass radius={32} style={{ width: 340, padding: "24px 28px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16, outline: `3px solid rgb(35 149 90 / ${matched})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar name={n.name.charAt(0)} i={n.i} size={48} />
        <span style={{ fontSize: 30, fontWeight: 600 }}>{n.name}</span>
        {matched > 0 && (
          <span style={{ marginLeft: "auto", width: 36, height: 36, borderRadius: 99, background: C.ok, color: "#fff", display: "grid", placeItems: "center", scale: String(matched) }}>
            <Check size={22} />
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, color: C.ink2 }}>
        <AssetIcon symbol={n.give} size={40} />
        <span style={{ color: C.danger }}>{n.give}</span>
        <span style={{ color: C.ink3 }}>→</span>
        <AssetIcon symbol={n.want} size={40} />
        <span style={{ color: C.ok }}>{n.want}</span>
      </div>
    </Glass>
  </div>
);

/** The solver: three wallets whose trades only cancel as a ring; tokens travel the ring, then the round's share is shown. */
export const Matching = () => {
  // Choreographed for 14 s (420 design frames); 1.2× speed finishes the last move by 10.3 s of the 13 s scene.
  const f = useT() * 1.2;
  const fps = DESIGN_FPS;
  const shift = pop(f, fps, 300, 200);
  const ringDone = pop(f, fps, 262, 14);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Ambient />
      <div style={{ position: "absolute", top: 96, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <StepLabel n="04" style={enter(f, fps, 0)}>Inside the solver</StepLabel>
        <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: "-0.035em", ...enter(f, fps, 6) }}>
          Opposite trades cancel out. <Highlight progress={ramp(f, 270, 294)}>Even in rings.</Highlight>
        </div>
      </div>

      <AbsoluteFill style={{ translate: `${interpolate(shift, [0, 1], [0, -330])}px 40px`, scale: String(interpolate(shift, [0, 1], [1, 0.84])) }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {FLOWS.map(([a, b], k) => {
            const A = NODES[a]!.pos;
            const B = NODES[b]!.pos;
            const d = ramp(f, 110 + k * 14, 160 + k * 14);
            return (
              <path
                key={k}
                d={`M ${A[0]} ${A[1]} Q ${control(A, B).join(" ")} ${B[0]} ${B[1]}`}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - d}
                fill="none"
                stroke={C.match}
                strokeOpacity={0.5}
                strokeWidth={6}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {FLOWS.map(([a, b, token], k) => {
          const A = NODES[a]!.pos;
          const B = NODES[b]!.pos;
          const t = ramp(f, 170 + k * 10, 250 + k * 10);
          const [x, y] = at(A, control(A, B), B, t);
          const vis = interpolate(t, [0, 0.08, 0.92, 1], [0, 1, 1, 0]);
          return (
            <div key={token} style={{ position: "absolute", left: x, top: y, translate: "-50% -50%", opacity: vis, zIndex: 2 }}>
              <AssetIcon symbol={token} size={64} ring />
            </div>
          );
        })}

        {NODES.map((n, k) => (
          <Node key={n.name} n={n} appear={pop(f, fps, 30 + k * 12, 16)} matched={pop(f, fps, 250 + k * 6, 12)} />
        ))}

        <div style={{ position: "absolute", left: O[0], top: O[1] + 20, translate: "-50% -50%", opacity: ringDone, scale: String(interpolate(ringDone, [0, 1], [0.6, 1])) }}>
          <Badge tone="ok" size={30}>
            <Check size={30} /> Ring of 3 matched
          </Badge>
        </div>
      </AbsoluteFill>

      <Glass
        style={{
          position: "absolute",
          right: 140,
          top: 380,
          width: 600,
          padding: 44,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 26,
          opacity: shift,
          translate: `${interpolate(shift, [0, 1], [160, 0])}px 0px`,
        }}
      >
        <span style={{ fontSize: 26, color: C.ink3 }}>Round 14</span>
        <div>
          <div style={{ fontSize: 120, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, color: C.match, fontVariantNumeric: "tabular-nums" }}>
            {Math.round(92 * ramp(f, 310, 360))}%
          </div>
          <div style={{ marginTop: 10, fontSize: 30, color: C.ink2 }}>matched wallet to wallet</div>
        </div>
        <MixBar grow={ramp(f, 320, 370)} parts={[{ key: "m", value: 92, color: C.match }, { key: "r", value: 8, color: C.rest }]} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 24, color: C.ink2 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 14, height: 14, borderRadius: 9, background: C.match }} /> Matched inside the round
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 14, height: 14, borderRadius: 9, background: C.rest }} /> Only 8% left for the public pool
          </span>
        </div>
      </Glass>
    </AbsoluteFill>
  );
};
