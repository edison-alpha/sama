/**
 * Frame-accurate screen capture for the demo: Chrome's screencast hands over every painted frame (JPEG, q=95) with its
 * timestamp, and stop() turns them into a constant-60fps MP4 with Remotion's bundled ffmpeg. Alongside the video it
 * writes <name>.json: the cursor path, clicks and named marks (with element boxes), all in video seconds, so Remotion
 * can draw a smooth cursor and aim the camera without guessing.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const OUT_DIR = path.join(here, "..", "public", "rec");
const FFMPEG = path.join(here, "..", "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");
const SCALE = 1.2; // CSS px → video px (rec-browser.mjs: 1600x900 at 1.2x)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Hides dev-only chrome (Next.js badge) and the native caret blink so frames stay clean. */
export async function cleanPage(page) {
  await page.addStyleTag({ content: "nextjs-portal{display:none!important} *{scrollbar-width:none!important}" }).catch(() => {});
}

export async function startCapture(page, name) {
  const cdp = await page.context().newCDPSession(page);
  const tmp = fs.mkdtempSync(path.join(OUT_DIR, `.${name}-`));
  const frames = [];
  let t0 = null;
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    const ts = metadata.timestamp;
    if (t0 === null) t0 = ts;
    const file = path.join(tmp, `${String(frames.length).padStart(6, "0")}.jpg`);
    fs.writeFileSync(file, Buffer.from(data, "base64"));
    frames.push({ file, t: ts - t0 });
    await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 95, everyNthFrame: 1 });
  while (t0 === null) await sleep(20);
  // Screencast timestamps are epoch seconds, so log times share the video's clock.
  const now = () => Date.now() / 1000 - t0;

  const log = { name, cursor: [], clicks: [], marks: [] };
  let cursor = { x: 800, y: 450 };

  const api = {
    now,
    /** Records a named moment, optionally with an element's box (video px), for the camera to aim at. */
    async mark(label, locator) {
      const m = { label, t: now() };
      if (locator) {
        const b = await locator.boundingBox({ timeout: 4000 }).catch(() => null);
        if (b) m.box = { x: b.x * SCALE, y: b.y * SCALE, w: b.width * SCALE, h: b.height * SCALE };
      }
      log.marks.push(m);
    },
    /** Glides the real mouse to an element (eased), so hover states play, and logs the path for the drawn cursor. */
    async moveTo(locator, { ms = 700 } = {}) {
      await locator.scrollIntoViewIfNeeded().catch(() => {});
      const b = await locator.boundingBox();
      if (!b) throw new Error(`No box for ${locator}`);
      const to = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      const from = { ...cursor };
      const steps = Math.max(8, Math.round(ms / 16));
      for (let i = 1; i <= steps; i++) {
        const k = ease(i / steps);
        const p = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
        await page.mouse.move(p.x, p.y);
        log.cursor.push({ t: now(), x: p.x * SCALE, y: p.y * SCALE });
        await sleep(ms / steps);
      }
      cursor = to;
      return b;
    },
    async click(locator, opts) {
      await api.moveTo(locator, opts);
      await sleep(180);
      log.clicks.push({ t: now(), x: cursor.x * SCALE, y: cursor.y * SCALE });
      await page.mouse.down();
      await sleep(90);
      await page.mouse.up();
    },
    /** Types like a person: a steady rhythm with a little variation. */
    async type(text, { cps = 16 } = {}) {
      for (const ch of text) {
        await page.keyboard.type(ch);
        await sleep(1000 / cps + (Math.random() - 0.5) * 30);
      }
    },
    wait: sleep,
    async stop() {
      await cdp.send("Page.stopScreencast").catch(() => {});
      await sleep(300);
      log.duration = now();
      // Constant 60 fps: output frame k shows the newest captured frame at k/60 s (hard links, so no copies), and the
      // last frame holds until stop() because Chrome sends nothing while the page doesn't repaint.
      const seq = path.join(tmp, "seq");
      fs.mkdirSync(seq);
      const total = Math.round(log.duration * 60);
      let j = 0;
      for (let k = 0; k < total; k++) {
        while (j + 1 < frames.length && frames[j + 1].t <= k / 60) j++;
        fs.linkSync(frames[j].file, path.join(seq, `${String(k).padStart(6, "0")}.jpg`));
      }
      const mp4 = path.join(OUT_DIR, `${name}.mp4`);
      execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-framerate", "60", "-i", path.join(seq, "%06d.jpg"), "-pix_fmt", "yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-bf", "0", "-g", "30", "-movflags", "+faststart", mp4]);
      fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(log, null, 1));
      fs.rmSync(tmp, { recursive: true, force: true });
      console.log(`${name}: ${frames.length} frames, ${log.duration.toFixed(1)}s → ${mp4}`);
    },
  };
  return api;
}
