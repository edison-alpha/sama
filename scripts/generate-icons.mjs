// Regenerates public/icons/*.png from public/sama-logo.svg.
// Run with: pnpm run icons  (needs Node >=20 for `import ... with { type: "json" }`,
// which sharp's own ESM entry uses internally)
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "icons");
mkdirSync(OUT, { recursive: true });

const BG = "#ffffff"; // matches manifest.webmanifest's background_color

// The source SVG's inner-shadow <filter> effects aren't fully supported by sharp's
// SVG renderer (librsvg) and rasterize as opaque black bars. Icons are tiny enough
// that the shadow is imperceptible anyway, so strip the filter wiring and keep the
// flat colored shapes.
const RAW_SVG = readFileSync(path.join(ROOT, "public", "sama-logo.svg"), "utf8");
const SVG_BUFFER = Buffer.from(
  RAW_SVG.replace(/\sfilter="url\([^)]*\)"/g, "").replace(/<defs>[\s\S]*?<\/defs>/, "")
);

async function renderOnBg({ size, scale, out, bg = BG }) {
  const logoSize = Math.round(size * scale);
  // The source is a tall, non-square mark: without an explicit transparent background,
  // sharp's "contain" letterboxing pads with opaque black instead of transparency.
  const logo = await sharp(SVG_BUFFER)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(out);
  console.log("wrote", path.relative(ROOT, out));
}

// Standard "any" purpose icons: logo near full-bleed on a solid bg (plain alpha is
// also fine for "any", but a solid bg looks correct on launchers that flatten it).
await renderOnBg({ size: 192, scale: 0.72, out: path.join(OUT, "icon-192.png") });
await renderOnBg({ size: 512, scale: 0.72, out: path.join(OUT, "icon-512.png") });

// Maskable icon: the OS applies a circular/rounded/squircle mask, so content must sit
// inside the ~80% center "safe zone" with a solid bg filling the rest.
await renderOnBg({ size: 512, scale: 0.5, out: path.join(OUT, "icon-maskable-512.png") });

// iOS home screen icon: must be fully opaque (iOS fills any transparency with black).
await renderOnBg({ size: 180, scale: 0.68, out: path.join(OUT, "apple-touch-icon.png") });

// Favicons
await renderOnBg({ size: 32, scale: 0.8, out: path.join(OUT, "favicon-32.png") });
await renderOnBg({ size: 16, scale: 0.8, out: path.join(OUT, "favicon-16.png") });

console.log("done");
