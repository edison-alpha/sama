import { AbsoluteFill, interpolate } from "remotion";
import { DESIGN_FPS, enter, pop, ramp, useT } from "../anim";
import { Ambient, Highlight, Mark } from "../ui";
import { C, FONT } from "../theme";

/** The two pills of the Sama mark slide together: the brand is two trades meeting in the middle. */
export const Hook = () => {
  const f = useT();
  const fps = DESIGN_FPS;
  const meet = pop(f, fps, 4, 16);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink, justifyContent: "center", alignItems: "center" }}>
      <Ambient />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 64 }}>
        <div style={{ opacity: ramp(f, 0, 14) }}>
          <Mark height={190} apart={interpolate(meet, [0, 1], [420, 0])} />
        </div>
        <div style={{ textAlign: "center", fontSize: 104, fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.035em" }}>
          <div style={enter(f, fps, 24)}>What if both trades</div>
          <div style={enter(f, fps, 32)}>
            <Highlight progress={ramp(f, 58, 84)}>met in the middle</Highlight> first?
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
