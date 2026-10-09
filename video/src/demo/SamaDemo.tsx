import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { segmentsLength } from "./Clip";
import {
  AI_SEGS,
  Ai,
  CIRCLE_SEGS,
  CircleScene,
  Cost,
  HOME_SEGS,
  Home,
  Meet,
  Open,
  Outro,
  Problem,
  Proof,
  Round,
  ROUND_BEATS,
  TARGET_SEGS,
  Target,
} from "./scenes";
import VO from "./voice-durations.json";

/**
 * The Sama product demo: real app recordings (scripts/record-*.mjs) cut to an English voice-over (scripts/voice.mjs).
 * Scene lengths come from the recordings' cut lists and the narration, so re-recording or re-voicing re-times it.
 */

type LineId = keyof typeof VO;
type Cue = { line: LineId; at: number };
type Scene = {
  id: string;
  dur: number;
  cues: Cue[];
  render: (dur: number) => React.ReactNode;
};

export const CROSSFADE = 0.5;

const ROUND_CUES: Cue[] = [
  { line: "join", at: 0.3 },
  { line: "match", at: ROUND_BEATS.match },
  { line: "paired", at: ROUND_BEATS.paired + 0.5 },
  { line: "settle", at: ROUND_BEATS.settle + 0.15 },
  { line: "leftover", at: ROUND_BEATS.leftover + 0.25 },
];

export const SCENES: Scene[] = [
  {
    id: "open",
    dur: VO.open + 1.7,
    cues: [{ line: "open", at: 0.45 }],
    render: () => <Open />,
  },
  {
    id: "problem",
    dur: VO.problem + 1.1,
    cues: [{ line: "problem", at: 0.2 }],
    render: () => <Problem />,
  },
  {
    id: "cost",
    dur: VO.cost + 1.6,
    cues: [{ line: "cost", at: 0.3 }],
    render: () => <Cost />,
  },
  {
    id: "meet",
    dur: 4.4,
    cues: [{ line: "meet", at: 0.55 }],
    render: () => <Meet />,
  },
  {
    id: "home",
    dur: segmentsLength(HOME_SEGS),
    cues: [{ line: "home", at: 0.5 }],
    render: () => <Home />,
  },
  {
    id: "target",
    dur: segmentsLength(TARGET_SEGS),
    cues: [{ line: "target", at: 0.4 }],
    render: () => <Target />,
  },
  {
    id: "ai",
    dur: segmentsLength(AI_SEGS),
    cues: [
      { line: "ai", at: 0.4 },
      { line: "ai2", at: segmentsLength(AI_SEGS.slice(0, 3)) + 0.2 },
    ],
    render: () => <Ai />,
  },
  {
    id: "circle",
    dur: segmentsLength(CIRCLE_SEGS),
    cues: [{ line: "circle", at: 0.4 }],
    render: () => <CircleScene />,
  },
  {
    id: "round",
    dur: ROUND_BEATS.end,
    cues: ROUND_CUES,
    render: () => <Round />,
  },
  {
    id: "proof",
    dur: VO.proof + 1.6,
    cues: [{ line: "proof", at: 0.5 }],
    render: () => <Proof />,
  },
  {
    id: "outro",
    dur: 5.2,
    cues: [{ line: "outro", at: 0.6 }],
    render: () => <Outro />,
  },
];

export const DEMO_SECONDS =
  SCENES.reduce((s, x) => s + x.dur, 0) - (SCENES.length - 1) * CROSSFADE;

/** Every voice-over line as [start, end] in video seconds, for ducking the music under it. */
const VO_SPANS: [number, number][] = (() => {
  const spans: [number, number][] = [];
  let start = 0;
  for (const sc of SCENES) {
    for (const c of sc.cues)
      spans.push([start + c.at, start + c.at + VO[c.line]]);
    start += sc.dur - CROSSFADE;
  }
  return spans;
})();

const MUSIC_BED = 0.1; // between lines
const MUSIC_UNDER_VO = 0.035; // while the narrator speaks
const DUCK = 0.35; // seconds to dip in / swell back

/** Background track: quiet bed that dips under every line, fades in at the start and out over the last 3 s. */
function musicVolume(s: number) {
  let duck = 0;
  for (const [a, b] of VO_SPANS)
    duck = Math.max(
      duck,
      interpolate(s, [a - DUCK, a, b, b + DUCK * 2], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
  const edge = Math.min(
    interpolate(s, [0, 1.5], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(s, [DEMO_SECONDS - 3, DEMO_SECONDS], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  return (MUSIC_BED + (MUSIC_UNDER_VO - MUSIC_BED) * duck) * edge;
}

export const SamaDemo = () => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  const timing = linearTiming({
    durationInFrames: f(CROSSFADE),
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music.mp3")}
        volume={(frame) => musicVolume(frame / fps)}
      />
      <TransitionSeries>
        {SCENES.flatMap((sc, i) => [
          ...(i
            ? [
                <TransitionSeries.Transition
                  key={`t${sc.id}`}
                  presentation={fade()}
                  timing={timing}
                />,
              ]
            : []),
          <TransitionSeries.Sequence
            key={sc.id}
            name={sc.id}
            durationInFrames={f(sc.dur)}
            premountFor={fps}
          >
            {sc.render(sc.dur)}
            {sc.cues.map((c) => (
              <Sequence
                key={c.line}
                name={`VO ${c.line}`}
                from={f(c.at)}
                durationInFrames={f(VO[c.line] + 0.2)}
                layout="none"
              >
                <Audio src={staticFile(`vo/${c.line}.mp3`)} volume={1} />
              </Sequence>
            ))}
          </TransitionSeries.Sequence>,
        ])}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
