import { AbsoluteFill, interpolate } from "remotion";
import { DESIGN_FPS, enter, ramp, useT } from "../anim";
import { Ambient } from "../ui";
import { C, FONT } from "../theme";

/** Same numbers as the landing's Stats section (lib/i18n/en.ts → landing.stats): they roll from `from` to `to`. */
const STATS: [number, number, string, string][] = [
  [12, 1, " tx", "Every matched transfer in a round settles in a single transaction."],
  [9, 0, " BNB", "Gas is sponsored, so stock tokens are all you need to hold."],
  [0, 3, "+ wallets", "The solver closes rings across three or more wallets, not just pairs."],
  [100, 0, "% custody", "Tokens move wallet to wallet. The contract never holds a share."],
];

export const Stats = () => {
  const f = useT();
  const fps = DESIGN_FPS;

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Ambient tint="warm" />
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center", fontSize: 92, lineHeight: 1.04, letterSpacing: "-0.035em" }}>
        <div style={enter(f, fps, 0)}>Less paid to the market.</div>
        <div style={{ color: C.ink3, ...enter(f, fps, 8) }}>More kept in your portfolio.</div>
      </div>

      <div style={{ position: "absolute", left: 160, right: 160, top: 440, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 120 }}>
        {STATS.map(([from, to, unit, body], i) => (
          <div
            key={unit}
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 40,
              padding: "44px 0 32px",
              borderBottom: `1px solid rgb(13 13 15 / 0.1)`,
              ...enter(f, fps, 24 + i * 8, 40),
            }}
          >
            <span style={{ maxWidth: 380, fontSize: 28, lineHeight: 1.4, color: C.ink2 }}>{body}</span>
            <span style={{ fontSize: 120, fontWeight: 300, lineHeight: 0.9, letterSpacing: "-0.04em", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
              {Math.round(interpolate(ramp(f, 34 + i * 8, 100 + i * 8), [0, 1], [from, to]))}
              <span style={{ fontSize: 56, letterSpacing: "-0.02em" }}>{unit}</span>
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
