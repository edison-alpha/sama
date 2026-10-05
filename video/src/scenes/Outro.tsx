import { AbsoluteFill, Easing, Img, interpolate, staticFile, useVideoConfig } from "remotion";
import { DESIGN_FPS, enter, pop, ramp, useT } from "../anim";
import { AssetIcon, GLASS_DARK, Pill } from "../ui";
import { FONT } from "../theme";

/** The landing hero: photo, white lockup, the footer CTA line and the two hero buttons. */
export const Outro = () => {
  const f = useT();
  const fps = DESIGN_FPS;
  const durationInFrames = (useVideoConfig().durationInFrames * DESIGN_FPS) / useVideoConfig().fps;
  const logo = pop(f, fps, 8, 18);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff", background: "#0d2f6e" }}>
      <Img
        src={staticFile("hero-bg.webp")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", scale: String(ramp(f, 0, durationInFrames, 1.14, 1.0, Easing.out(Easing.quad))) }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgb(8 24 64 / 0.35) 0%, rgb(8 24 64 / 0.05) 55%, rgb(0 0 0 / 0.35) 100%)" }} />

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 120 }}>
        <Img
          src={staticFile("sama-brand-logo-ORI.svg")}
          style={{ height: 130, opacity: logo, scale: String(interpolate(logo, [0, 1], [0.85, 1])), filter: `blur(${(1 - logo) * 14}px)` }}
        />
        <span
          style={{
            ...GLASS_DARK,
            marginTop: 36,
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            borderRadius: 999,
            padding: "8px 22px 8px 10px",
            fontSize: 24,
            fontWeight: 500,
            ...enter(f, fps, 22, 20),
          }}
        >
          <AssetIcon symbol="BNB" size={36} /> Live on BNB Chain
        </span>
        <div
          style={{
            marginTop: 30,
            textAlign: "center",
            fontSize: 88,
            fontWeight: 600,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            textShadow: "0 2px 30px rgb(0 20 60 / 0.4)",
          }}
        >
          <div style={enter(f, fps, 30)}>Your next rebalance</div>
          <div style={enter(f, fps, 38)}>may already have a match.</div>
        </div>
        <div style={{ marginTop: 52, display: "flex", gap: 20, ...enter(f, fps, 56, 30) }}>
          <Pill variant="glass" size={30}>Start matching</Pill>
          <Pill variant="primary" size={30}>Open Sama</Pill>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "#000", opacity: ramp(f, durationInFrames - 20, durationInFrames, 0, 1, Easing.linear) }} />
    </AbsoluteFill>
  );
};
