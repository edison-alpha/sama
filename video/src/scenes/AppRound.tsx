import { interpolate } from "remotion";
import { RoundJourney } from "@/components/round/round-journey";
import { press, ramp, useT } from "../anim";
import { AppScene, ComponentScene } from "../app/shell";
import { Cursor } from "../ui";
import { EASE_IN_OUT } from "../theme";

/**
 * Step 4: Sama looking for matches. Only the round header + stepper, the "Finding matches…" card and the status
 * panel, cut out of the real round page (rects in app CSS pixels, measured in Studio). Round ids: see real/setup.ts.
 */
export const AppRoundMatching = () => (
  <ComponentScene
    n="04"
    label="Matching"
    title="Sama finds the opposite trades."
    path="/rounds/r-81"
    page={<RoundJourney roundId="r-81" />}
    shots={[
      { rect: [352, 134, 1100, 148], pad: 22, x: 960, y: 350, delay: 40 },
      { rect: [351, 338, 681, 154], pad: 28, x: 960, y: 735, delay: 56, tilt: -4 },
    ]}
  />
);

/** Mock round states in order (real/setup.ts) and the design frame each one takes over. */
const STAGES: [number, string][] = [
  [0, "r-081"],
  [110, "r-0081"],
  [175, "r-00081"],
];
const CROSSFADE = 12;

/**
 * The same round moving on: approving → settling → done & verified. Each new state crossfades over the previous one;
 * every state is mounted (hidden) from the start so its data is loaded before it is shown.
 */
const ProgressingRound = () => {
  const f = useT();
  let k = 0;
  while (k + 1 < STAGES.length && f >= STAGES[k + 1]![0]) k++;
  const [start, id] = STAGES[k]!;
  const prev = STAGES[k - 1];
  const fade = prev ? ramp(f, start, start + CROSSFADE) : 1;
  return (
    <div style={{ position: "relative" }}>
      {prev && fade < 1 && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
          <RoundJourney key={prev[1]} roundId={prev[1]} />
        </div>
      )}
      <div style={{ opacity: fade }}>
        <RoundJourney key={id} roundId={id} />
      </div>
      <div style={{ display: "none" }}>
        {STAGES.filter(([, s]) => s !== id && s !== prev?.[1]).map(([, s]) => (
          <RoundJourney key={s} roundId={s} />
        ))}
      </div>
    </div>
  );
};

/** "Open receipt" on the finished round, in app CSS pixels (measured in Studio). */
const RECEIPT_BUTTON: [number, number] = [1159, 733];
const CLICK = 350;

const ReceiptCursor = () => {
  const f = useT();
  const opts = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT } as const;
  return (
    <Cursor
      x={interpolate(f, [290, CLICK - 2], [1380, RECEIPT_BUTTON[0]], opts)}
      y={interpolate(f, [290, CLICK - 2], [860, RECEIPT_BUTTON[1]], opts)}
      pressed={press(f, CLICK)}
      opacity={ramp(f, 286, 298)}
    />
  );
};

/** Step 5: the full round page settling, then the verified result. */
export const AppRoundDone = () => (
  <AppScene
    n="05"
    label="Settle"
    title="Settle once. Pay only the rest."
    path="/rounds/r-00081"
    cams={[
      { f: 60, x: 1130, y: 600, z: 1 },
      { f: 190, x: 1130, y: 620, z: 1.06 },
      { f: 265, x: 900, y: 760, z: 1.28 },
      { f: 340, x: 1480, y: 960, z: 1.42 },
    ]}
    overlay={<ReceiptCursor />}
  >
    <ProgressingRound />
  </AppScene>
);
