import { interpolate } from "remotion";
import { CircleDetail } from "@/components/circles/circle-detail";
import { press, ramp, useT } from "../anim";
import { ComponentScene } from "../app/shell";
import { Cursor } from "../ui";
import { EASE_IN_OUT } from "../theme";

/** Where "Start a round now" sits on the Circle page, in app CSS pixels (measured in Studio). */
const START_BUTTON: [number, number] = [1266, 548];
const CLICK = 232;

const StartCursor = () => {
  const f = useT();
  const opts = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT } as const;
  return (
    <Cursor
      x={interpolate(f, [160, CLICK - 2], [1380, START_BUTTON[0]], opts)}
      y={interpolate(f, [160, CLICK - 2], [640, START_BUTTON[1]], opts)}
      pressed={press(f, CLICK)}
      opacity={ramp(f, 156, 168)}
    />
  );
};

/** Step 3: the Circle's numbers and its Live round panel, cut out of the real Circle page; the cursor starts a round. */
export const AppCircle = () => (
  <ComponentScene
    n="03"
    label="Circles"
    title="Join a Circle that trades what you hold."
    path="/circles/c-bluechips"
    page={<CircleDetail id="c-bluechips" />}
    shots={[
      { rect: [352, 253, 684, 336], pad: 24, x: 680, y: 560, delay: 40 },
      { rect: [1076, 253, 380, 350], bare: true, radius: 24, x: 1480, y: 560, delay: 56, tilt: -4, overlay: <StartCursor /> },
    ]}
  />
);
