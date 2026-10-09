/**
 * Shared Chromium setup for the screen recordings: a persistent profile in video/.rec-profile so the Privy session from
 * `login.mjs` carries over, and a 1600x900 viewport at 1.2x so every captured frame is exactly 1920x1080.
 */
import { chromium } from "playwright-core";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PROFILE = path.join(here, "..", ".rec-profile");
export const APP = process.env.SAMA_APP_URL ?? "http://localhost:3200";
const CHROME = path.join(os.homedir(), "AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe");

export function launch({ headless = true } = {}) {
  return chromium.launchPersistentContext(PROFILE, {
    executablePath: CHROME,
    headless,
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1.2,
    colorScheme: "dark",
    locale: "en-US",
    args: ["--hide-scrollbars", "--force-color-profile=srgb"],
  });
}
