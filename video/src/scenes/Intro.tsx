import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import { DESIGN_FPS, enter, pop, ramp, useT } from "../anim";
import { Ambient, ScatterText } from "../ui";
import { C, FONT } from "../theme";

/** "Introducing" assembles letter by letter, then hands over to the Sama lockup and tagline. */
export const Intro = () => {
  const f = useT();
  const fps = DESIGN_FPS;
  const out = ramp(f, 56, 76);
  const logo = pop(f, fps, 66, 18);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Ambient />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", scale: String(ramp(f, 0, 180, 1, 1.05, Easing.linear)) }}>
        <div
          style={{
            position: "absolute",
            fontSize: 76,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: C.ink,
            opacity: 1 - out,
            filter: `blur(${out * 14}px)`,
            translate: `0px ${-out * 50}px`,
          }}
        >
          <ScatterText text="Introducing" start={4} spread={34} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
          <Img
            src={staticFile("sama-brand-logo-ORI-light.svg")}
            style={{
              height: 230,
              opacity: logo,
              scale: String(interpolate(logo, [0, 1], [0.82, 1])),
              filter: `blur(${(1 - logo) * 18}px)`,
            }}
          />
          <div style={{ fontSize: 44, fontWeight: 500, color: C.ink2, letterSpacing: "-0.01em", ...enter(f, fps, 100, 30) }}>
            Find the other side of your rebalance.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
