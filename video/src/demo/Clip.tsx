import type React from "react";
import { Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_IN_OUT } from "../theme";

/**
 * A screen recording (scripts/record-*.mjs) played in a floating window, the way Apple shows software: it tilts up
 * into place, a slow camera pushes in on what matters, and a drawn cursor replays the real mouse path from the
 * recording's .json log, with a soft press on every click.
 */

export type Segment = { from: number; to: number; rate?: number };
export type Shot = { t: number; zoom: number; x?: number; y?: number };
type Log = { cursor: { t: number; x: number; y: number }[]; clicks: { t: number; x: number; y: number }[] };

const W = 1920;
const H = 1080;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const segmentsLength = (segs: Segment[]) => segs.reduce((s, g) => s + (g.to - g.from) / (g.rate ?? 1), 0);

/** Scene seconds → recording seconds, through the cut list. */
export function clipTime(segs: Segment[], s: number) {
  let acc = 0;
  for (const g of segs) {
    const len = (g.to - g.from) / (g.rate ?? 1);
    if (s < acc + len) return g.from + (s - acc) * (g.rate ?? 1);
    acc += len;
  }
  const last = segs.at(-1)!;
  return last.to;
}

/** Recording seconds → scene seconds (first segment containing it), or null when the moment was cut. */
function sceneTime(segs: Segment[], c: number) {
  let acc = 0;
  for (const g of segs) {
    if (c >= g.from && c <= g.to) return acc + (c - g.from) / (g.rate ?? 1);
    acc += (g.to - g.from) / (g.rate ?? 1);
  }
  return null;
}

/** Eased camera between shots: zoom about a point given in recording pixels. */
function camera(shots: Shot[], s: number) {
  const first = shots[0] ?? { t: 0, zoom: 1 };
  let a = first;
  let b = first;
  for (const sh of shots) {
    if (sh.t <= s) a = sh;
    if (sh.t > s) {
      b = sh;
      break;
    }
    b = sh;
  }
  const k = a === b ? 0 : interpolate(s, [a.t, b.t], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const lerp = (p: number, q: number) => p + (q - p) * k;
  return { zoom: lerp(a.zoom, b.zoom), x: lerp(a.x ?? W / 2, b.x ?? W / 2), y: lerp(a.y ?? H / 2, b.y ?? H / 2) };
}

function Cursor({ log, t, segs, fps }: { log: Log; t: number; segs: Segment[]; fps: number }) {
  const pts = log.cursor;
  if (!pts.length || t < pts[0]!.t - 0.05) return null;
  let i = pts.findIndex((p) => p.t > t);
  if (i === -1) i = pts.length;
  const p = pts[Math.max(0, i - 1)]!;
  const q = pts[Math.min(i, pts.length - 1)]!;
  const k = q.t > p.t ? Math.min(1, Math.max(0, (t - p.t) / (q.t - p.t))) : 0;
  const x = p.x + (q.x - p.x) * k;
  const y = p.y + (q.y - p.y) * k;
  // Press: dip to 82% for the first 120 ms after a click, then spring back.
  const click = [...log.clicks].reverse().find((c) => c.t <= t && sceneTime(segs, c.t) !== null);
  const since = click ? t - click.t : 99;
  const press = since < 0.5 ? 1 - 0.18 * Math.exp(-since * 14) * Math.min(1, since * 30 + 0.4) : 1;
  const ring = since < 0.6 ? since / 0.6 : 1;
  const appear = interpolate(t - pts[0]!.t, [-0.05, 0.25], [0, 1], clamp);
  void fps;
  return (
    <>
      {since < 0.6 && click ? (
        <div style={{ position: "absolute", left: click.x - 40, top: click.y - 40, width: 80, height: 80, borderRadius: 999, border: "3px solid rgba(255,255,255,0.9)", opacity: (1 - ring) * 0.55, scale: `${0.35 + ring * 0.9}` }} />
      ) : null}
      <svg width={34} height={34} viewBox="0 0 24 24" style={{ position: "absolute", left: x - 6, top: y - 3, opacity: appear, scale: `${press}`, transformOrigin: "6px 3px", filter: "drop-shadow(0 3px 6px rgb(0 0 0 / 0.45))" }}>
        <path d="M5.5 3.2v15.6l4.3-4.1 2.7 6.3 2.6-1.1-2.7-6.2h6z" fill="#fff" stroke="#111" strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </>
  );
}

export function Clip({
  name,
  segments,
  shots = [],
  log,
  scale = 0.8,
  offsetY = 50,
  enterAt = 0,
  clickSound = true,
  overlay,
}: {
  name: string;
  segments: Segment[];
  shots?: Shot[];
  log: Log;
  scale?: number;
  offsetY?: number;
  enterAt?: number;
  clickSound?: boolean;
  overlay?: React.ReactNode;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;
  const t = clipTime(segments, s);

  // Tilt up into place.
  const rise = spring({ frame: frame - enterAt * fps, fps, config: { damping: 32, stiffness: 70, mass: 1.1 } });
  const cam = camera(shots, s);
  // Translation happens after scaling, so it is in screen pixels: centre the shot point.
  const tx = (W / 2 - cam.x) * cam.zoom * scale;
  const ty = (H / 2 - cam.y) * cam.zoom * scale;

  let acc = 0;
  const seqs = segments.map((g, i) => {
    const len = (g.to - g.from) / (g.rate ?? 1);
    const from = Math.round(acc * fps);
    acc += len;
    return (
      <Sequence key={i} from={from} durationInFrames={Math.max(1, Math.round(acc * fps) - from)} layout="none">
        <OffthreadVideo src={staticFile(`rec/${name}.mp4`)} startFrom={Math.round(g.from * fps)} playbackRate={g.rate ?? 1} muted style={{ position: "absolute", inset: 0, width: W, height: H }} />
      </Sequence>
    );
  });

  const clicks = clickSound
    ? log.clicks.map((c, i) => {
        const at = sceneTime(segments, c.t);
        return at === null ? null : (
          <Sequence key={`c${i}`} from={Math.round(at * fps)} durationInFrames={Math.round(0.2 * fps)} layout="none">
            <Audio src={staticFile("click.wav")} volume={0.35} />
          </Sequence>
        );
      })
    : null;

  return (
    <div style={{ position: "absolute", inset: 0, perspective: 2600, perspectiveOrigin: "50% 30%" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${tx}px, ${ty + offsetY + (1 - rise) * 220}px) scale(${scale * cam.zoom * (0.94 + rise * 0.06)}) rotateX(${(1 - rise) * 24}deg)`,
          transformOrigin: "50% 50%",
          opacity: Math.min(1, rise * 1.6),
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 30,
            overflow: "hidden",
            background: "#0b0b0d",
            boxShadow: "0 0 0 1px rgb(255 255 255 / 0.09), 0 60px 160px -20px rgb(0 0 0 / 0.85), 0 0 120px -30px rgb(233 120 99 / 0.25)",
          }}
        >
          {seqs}
          <Cursor log={log} t={t} segs={segments} fps={fps} />
          {overlay}
        </div>
      </div>
      {clicks}
    </div>
  );
}
