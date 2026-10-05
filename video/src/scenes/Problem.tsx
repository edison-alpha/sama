import type React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { DESIGN_FPS, enter, pop, ramp, usd, useT } from "../anim";
import { Ambient, AssetIcon, Avatar, Badge, Glass, Highlight } from "../ui";
import { C, FONT } from "../theme";

/** One wallet with one trade, as a card. */
const WalletCard: React.FC<{ name: string; addr: string; i: number; selling: boolean }> = ({ name, addr, i, selling }) => (
  <Glass style={{ width: 560, height: 250, padding: 36, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 28 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <Avatar name={name.charAt(0)} i={i} size={56} />
      <span style={{ fontSize: 32, fontWeight: 600 }}>{name}</span>
      <span style={{ fontSize: 24, color: C.ink3, marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>{addr}</span>
    </div>
    <div style={{ height: 1, background: C.line }} />
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <AssetIcon symbol="NVDAB" size={64} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 30, fontWeight: 600 }}>NVDAB</div>
        <div style={{ fontSize: 24, color: selling ? C.danger : C.ok }}>{selling ? "↑ Selling" : "↓ Buying"}</div>
      </div>
      <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        <div style={{ fontSize: 30, fontWeight: 600 }}>{selling ? "−" : "+"}120 NVDAB</div>
        <div style={{ fontSize: 24, color: C.ink3 }}>{usd(21480)}</div>
      </div>
    </div>
  </Glass>
);

/** Two wallets make opposite NVDAB trades the same afternoon, and both pay the pool. */
export const Problem = () => {
  const f = useT();
  const fps = DESIGN_FPS;
  const up = pop(f, fps, 96, 200);
  const draw = (start: number) => ramp(f, start, start + 40);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Ambient tint="warm" />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: interpolate(up, [0, 1], [360, 100]),
          textAlign: "center",
          fontSize: interpolate(up, [0, 1], [104, 62]),
          fontWeight: 600,
          lineHeight: 1.06,
          letterSpacing: "-0.035em",
        }}
      >
        <div style={enter(f, fps, 0)}>Every stock rebalance</div>
        <div style={enter(f, fps, 10)}>
          pays the market <Highlight progress={ramp(f, 40, 66)} color="#fbd6cd">alone.</Highlight>
        </div>
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[
          ["M 480 560 C 480 700, 600 810, 750 810", 180],
          ["M 1440 560 C 1440 700, 1320 810, 1170 810", 192],
        ].map(([d, at]) => (
          <path key={d} d={d as string} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw(at as number)} fill="none" stroke={C.danger} strokeOpacity={0.55} strokeWidth={5} strokeLinecap="round" />
        ))}
      </svg>

      <div style={{ position: "absolute", left: 200, top: 300, ...enter(f, fps, 120, 60) }}>
        <WalletCard name="Maya" addr="0x7a…3f" i={0} selling />
      </div>
      <div style={{ position: "absolute", right: 200, top: 300, ...enter(f, fps, 132, 60) }}>
        <WalletCard name="Alex" addr="0x91…c2" i={1} selling={false} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 750,
          top: 760,
          width: 420,
          height: 100,
          borderRadius: 999,
          background: C.ink,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontSize: 32,
          fontWeight: 500,
          boxShadow: "0 30px 60px -20px rgb(13 13 15 / 0.45)",
          opacity: pop(f, fps, 165),
          scale: String(interpolate(pop(f, fps, 165), [0, 1], [0.8, 1])),
        }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
          <path d="M2 8c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 14c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
        </svg>
        Public liquidity pool
      </div>

      <div style={{ position: "absolute", right: 1470, top: 660, ...enter(f, fps, 222, 20) }}>
        <Badge tone="danger" size={26}>−$64 spread + impact</Badge>
      </div>
      <div style={{ position: "absolute", left: 1470, top: 660, ...enter(f, fps, 234, 20) }}>
        <Badge tone="danger" size={26}>−$61 spread + impact</Badge>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 920, textAlign: "center", fontSize: 38, color: C.ink2, ...enter(f, fps, 270, 24) }}>
        Opposite trades. Both pay. <span style={{ color: C.ink, fontWeight: 600 }}>Neither sees the other.</span>
      </div>
    </AbsoluteFill>
  );
};
