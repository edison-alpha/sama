/**
 * Opens the app in a visible window so you can sign in once; closes itself when the app reaches /home.
 * Usage: node scripts/login.mjs [appUrl]   (defaults to SAMA_APP_URL or http://localhost:3200)
 */
import { APP, launch } from "./rec-browser.mjs";

const app = process.argv[2] ?? APP;
const ctx = await launch({ headless: false });
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto(`${app}/start?next=%2Fhome`);
console.log(`Sign in at ${app} in the browser window. Waiting for /home…`);
await page.waitForURL(/\/home/, { timeout: 15 * 60_000 });
await page.waitForTimeout(3000);
console.log("Signed in. Session saved.");
await ctx.close();
