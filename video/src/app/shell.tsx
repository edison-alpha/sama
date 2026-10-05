import type React from "react";
import type { ReactNode } from "react";
import { AbsoluteFill, Easing, useVideoConfig } from "remotion";
import { AppShell } from "@/components/shell/app-shell";
import { I18nProvider } from "@/lib/i18n/provider";
import { DESIGN_FPS, enter, ramp, useT } from "../anim";
import { PathContext } from "../real/stubs/next-navigation";
import { RevealContext } from "../real/stubs/motion";
import { Ambient, StepLabel } from "../ui";
import { C, FONT } from "../theme";

/**
 * App scenes render the real Sama screens (components/shell/app-shell.tsx and the page components) in a 1536×880 CSS
 * viewport, the same as the reference screenshots (1920×1100 px at 125% scaling).
 * Full-window camera coordinates are given in screenshot pixels (`px` converts them); component crops and cursors use
 * app CSS pixels, as measured in Studio.
 */
export const APP_W = 1536;
export const APP_H = 880;
export const px = (x: number, y: number): [number, number] => [x / 1.25, (y - 100) / 1.25];

/** Soft ease-out used for everything that flies in. */
const SOFT = Easing.bezier(0.22, 1, 0.36, 1);

/** Scene length in design frames (30 per second). */
function useSceneLength() {
  const { durationInFrames, fps } = useVideoConfig();
  return (durationInFrames * DESIGN_FPS) / fps;
}

/**
 * Monotone cubic interpolation (Fritsch–Carlson) through keyframes: velocity carries smoothly through each key, so
 * the camera glides instead of stopping at every keyframe, and it never overshoots a key (holds stay still).
 */
function glide(t: number, ks: number[], vs: number[]) {
  const n = ks.length;
  if (t <= ks[0]!) return vs[0]!;
  if (t >= ks[n - 1]!) return vs[n - 1]!;
  let i = 0;
  while (t > ks[i + 1]!) i++;
  const secant = (j: number) => (vs[j + 1]! - vs[j]!) / (ks[j + 1]! - ks[j]!);
  const slope = (j: number) => {
    if (j <= 0 || j >= n - 1) return 0;
    const a = secant(j - 1);
    const b = secant(j);
    if (a * b <= 0) return 0;
    return Math.sign(a) * Math.min(Math.abs((a + b) / 2), 3 * Math.abs(a), 3 * Math.abs(b));
  };
  const h = ks[i + 1]! - ks[i]!;
  const u = (t - ks[i]!) / h;
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * vs[i]! + (u3 - 2 * u2 + u) * h * slope(i) + (-2 * u3 + 3 * u2) * vs[i + 1]! + (u3 - u2) * h * slope(i + 1);
}

/** Providers + the real AppShell around a page, as app/(app)/layout.tsx does. */
export const AppFrame: React.FC<{ path: string; reveal?: { start: number; next: () => number } | null; children: ReactNode }> = ({ path, reveal = null, children }) => (
  <I18nProvider locale="en">
    <PathContext.Provider value={path}>
      <RevealContext.Provider value={reveal}>
        <AppShell>{children}</AppShell>
      </RevealContext.Provider>
    </PathContext.Provider>
  </I18nProvider>
);

/** The kinetic headline that opens every app scene, then lifts away as the product arrives. */
const Headline: React.FC<{ n: string; label: string; title: ReactNode }> = ({ n, label, title }) => {
  const f = useT();
  const fps = DESIGN_FPS;
  const out = ramp(f, 30, 58, 0, 1, Easing.bezier(0.55, 0, 0.45, 1));
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30, opacity: 1 - out, translate: `0px ${-out * 140}px`, filter: `blur(${out * 12}px)` }}>
      <StepLabel n={n} style={enter(f, fps, 0)}>{label}</StepLabel>
      <div style={{ fontSize: 104, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.05, color: C.ink, textAlign: "center", ...enter(f, fps, 6) }}>{title}</div>
    </AbsoluteFill>
  );
};

export type Cam = { f: number; x: number; y: number; z: number };

/** Frame when the full window has landed and the page's cards start their entrance. */
export const LANDED = 54;

/**
 * Full app window: headline, then the window flies up and the camera glides across it. `cams` are focus points in
 * screenshot pixels with zoom z (1 = whole window). Each key is kept inside the window before gliding, so a zoomed
 * shot never shows the backdrop beside it.
 */
export const AppScene: React.FC<{ n: string; label: string; title: ReactNode; path: string; cams: Cam[]; overlay?: ReactNode; children: ReactNode }> = ({
  n,
  label,
  title,
  path,
  cams,
  overlay,
  children,
}) => {
  const f = useT();
  const S = 1.1;
  const fly = ramp(f, 28, 74, 0, 1, SOFT);
  const keys = cams.map((c) => {
    const [x, y] = px(c.x, c.y);
    const z = c.z * S;
    const keep = (v: number, size: number, half: number) => (size * z > half * 2 ? Math.min(size - half / z, Math.max(half / z, v)) : v);
    return { f: c.f, x: keep(x, APP_W, 960), y: keep(y, APP_H, 540), lz: Math.log(z) };
  });
  const ks = keys.map((k) => k.f);
  const cx = glide(f, ks, keys.map((k) => k.x));
  const cy = glide(f, ks, keys.map((k) => k.y));
  const z = Math.exp(glide(f, ks, keys.map((k) => k.lz)));

  // Recreated every frame so `rise` elements number themselves in render order.
  let i = 0;
  const reveal = { start: LANDED, next: () => i++ };

  return (
    <AbsoluteFill style={{ fontFamily: FONT, perspective: 2600 }}>
      <Ambient />
      <Headline n={n} label={label} title={title} />
      <div
        className="sama-app"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: APP_W,
          height: APP_H,
          transformOrigin: "0 0",
          transform: `translate3d(${960 - cx * z}px, ${540 - cy * z + (1 - fly) * 900}px, 0) scale3d(${z}, ${z}, 1) rotateX(${(1 - fly) * 28}deg)`,
          backfaceVisibility: "hidden",
          opacity: ramp(f, 28, 44),
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 0 0 1px rgb(255 255 255 / 0.08), 0 60px 140px -30px rgb(13 20 48 / 0.55)",
        }}
      >
        <AppFrame path={path} reveal={reveal}>{children}</AppFrame>
        {overlay}
      </div>
    </AbsoluteFill>
  );
};

/**
 * One component cut out of a real app page. `rect` is the component's own box in app CSS pixels ([x, y, w, h], measured
 * in Studio); the cut adds `pad` px of the page on every side, or none for a `bare` component that is already a card
 * in the app (then its own border and corner `radius` are the card's edge, so there is no frame around a frame).
 * Every cut in a scene uses the same `scale`, so text sizes match; (x, y) is its centre in the 1920×1080 frame.
 */
export type Shot = {
  rect: [number, number, number, number];
  x: number;
  y: number;
  delay: number;
  scale?: number;
  pad?: number;
  bare?: boolean;
  radius?: number;
  tilt?: number;
  overlay?: ReactNode;
};

export const SHOT_SCALE = 1.3;

const ShotCard: React.FC<{ shot: Shot; path: string; page: ReactNode }> = ({ shot, path, page }) => {
  const f = useT();
  const length = useSceneLength();
  const s = shot.scale ?? SHOT_SCALE;
  const pad = shot.bare ? 0 : (shot.pad ?? 24);
  const [rx, ry, rw, rh] = shot.rect;
  const width = (rw + pad * 2) * s;
  const height = (rh + pad * 2) * s;
  const p = ramp(f, shot.delay, shot.delay + 42, 0, 1, SOFT);
  const drift = ramp(f, shot.delay, length, 0, 1, Easing.linear);
  const tilt = shot.tilt ?? 4;
  const k = 0.94 + 0.06 * p + 0.02 * drift;
  return (
    <div
      style={{
        position: "absolute",
        left: shot.x - width / 2,
        top: shot.y - height / 2,
        width,
        height,
        borderRadius: (shot.bare ? (shot.radius ?? 24) : 28) * s,
        overflow: "hidden",
        background: "#0b0b0d",
        boxShadow: shot.bare ? "0 50px 120px -30px rgb(13 20 48 / 0.5)" : "0 0 0 1px rgb(255 255 255 / 0.08), 0 50px 120px -30px rgb(13 20 48 / 0.5)",
        opacity: p,
        transform: `perspective(2400px) translate3d(0, ${(1 - p) * 160}px, 0) rotateX(${(1 - p) * 22 + 2 * (1 - drift)}deg) rotateY(${tilt * (0.5 - drift)}deg) scale3d(${k}, ${k}, 1)`,
        backfaceVisibility: "hidden",
      }}
    >
      <div className="sama-app" style={{ position: "absolute", left: 0, top: 0, width: APP_W, height: APP_H, transformOrigin: "0 0", transform: `scale(${s}) translate(${pad - rx}px, ${pad - ry}px)` }}>
        <AppFrame path={path}>{page}</AppFrame>
        {shot.overlay}
      </div>
    </div>
  );
};

/** Headline, then only the components that matter, cut from the real page and floating over the backdrop. */
export const ComponentScene: React.FC<{ n: string; label: string; title: ReactNode; path: string; page: ReactNode; shots: Shot[] }> = ({ n, label, title, path, page, shots }) => {
  const f = useT();
  const length = useSceneLength();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Ambient />
      <Headline n={n} label={label} title={title} />
      <AbsoluteFill style={{ scale: String(ramp(f, 30, length, 1, 1.03, Easing.linear)) }}>
        {shots.map((shot) => (
          <ShotCard key={shot.rect.join()} shot={shot} path={path} page={page} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
