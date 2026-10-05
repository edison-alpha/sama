import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** SF Pro Rounded, the app's brand font (copied from ../components/font). */
const WEIGHTS = [
  ["Light", "300"],
  ["Regular", "400"],
  ["Medium", "500"],
  ["Semibold", "600"],
  ["Bold", "700"],
] as const;

export const fontsReady = Promise.all(
  WEIGHTS.map(([name, weight]) =>
    loadFont({ family: "SF Pro Rounded", url: staticFile(`fonts/SF-Pro-Rounded-${name}.otf`), weight }),
  ),
);
