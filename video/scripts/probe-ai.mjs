/** Dev helper: asks the live assistant one question and screenshots the answer. Sends nothing on-chain; confirms nothing. */
import { launch } from "./rec-browser.mjs";
import { cleanPage } from "./capture.mjs";
const [out, q] = process.argv.slice(2);
const ctx = await launch();
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto("https://app.samafi.xyz/home", { waitUntil: "networkidle" });
await cleanPage(page);
await page.waitForTimeout(3000);
await page.screenshot({ path: `${out}/live-home.png` });
const show = page.getByRole("button", { name: "Open assistant" });
if (await show.isVisible().catch(() => false)) { await show.click(); await page.waitForTimeout(800); }
const input = page.locator('input[maxlength="500"]');
console.log("input placeholder:", await input.getAttribute("placeholder"));
await input.click();
await input.fill(q);
await page.keyboard.press("Enter");
const t = Date.now();
await page.waitForTimeout(1000);
await page.screenshot({ path: `${out}/live-ai-1.png` });
await page.waitForFunction(() => !document.querySelector('input[maxlength="500"]')?.disabled, null, { timeout: 90000 });
console.log("answered in", (Date.now() - t) / 1000, "s");
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/live-ai-2.png` });
await ctx.close();
