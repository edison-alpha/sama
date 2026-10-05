import { Easing } from "remotion";

/** Sama design tokens (light theme), mirrored from ../styles/tokens.css. */
export const C = {
  bg: "#ffffff",
  app: "#f6f6f4",
  surface2: "#f4f4f3",
  surface3: "#e6e6e5",
  ink: "#0d0d0f",
  ink2: "#4a4b50",
  ink3: "#85868c",
  line: "#ececeb",
  lineStrong: "#d6d6d4",
  accent: "#e97863",
  accentStrong: "#d9604a",
  accentSoft: "#fdece8",
  sky: "#0d2f6e",
  sky2: "#1c4fa3",
  match: "#2563d9",
  matchSoft: "#e6effd",
  highlight: "#d6e4ff",
  rest: "#8a8173",
  restSoft: "#f1eee8",
  ok: "#23955a",
  okSoft: "#e2f5ea",
  warn: "#c27400",
  warnSoft: "#fff1db",
  danger: "#d63a4a",
  dangerSoft: "#fde8ea",
} as const;

export const FONT = `"SF Pro Rounded", ui-rounded, system-ui, sans-serif`;

export const SHADOW_FLOAT =
  "0 0 1px 0 rgb(0 0 0 / 0.28), 0 1px 12px 0 rgb(0 0 0 / 0.05), 0 40px 100px -30px rgb(13 20 48 / 0.28)";

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/** Colours per asset, shared by the mix bar, drift bars and legends. */
export const ASSET_COLOR: Record<string, string> = {
  NVDAB: C.accent,
  TSLAB: C.match,
  AAPLB: C.sky,
  USDT: C.ok,
};
