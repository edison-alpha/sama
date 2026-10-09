/**
 * Records the real AI assistant on the live app (app.samafi.xyz, signed in via login.mjs). It only asks questions:
 * it never presses "Apply" or any other action button, so nothing is saved, signed or sent.
 * Usage: node scripts/record-ai.mjs "question one" ["question two" …]
 */
import { launch } from "./rec-browser.mjs";
import { cleanPage, startCapture } from "./capture.mjs";

const APP = "https://app.samafi.xyz";
const questions = process.argv.slice(2);
const ctx = await launch();
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto(`${APP}/home`, { waitUntil: "networkidle" });
// Start from a clean conversation so the assistant answers in the language of these questions.
await page.evaluate(() => {
  localStorage.removeItem("sama:ai:chat-id");
  localStorage.setItem("sama:ai:hidden", "0");
});
await page.reload({ waitUntil: "networkidle" });
await cleanPage(page);
await page.waitForTimeout(2500);

const input = page.locator('input[maxlength="500"]');
const rec = await startCapture(page, "ai");
await rec.wait(1500);
for (const q of questions) {
  await rec.click(input);
  await rec.wait(500);
  await rec.type(q);
  await rec.wait(400);
  await rec.mark(`ask:${q}`);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => !document.querySelector('input[maxlength="500"]')?.disabled, null, { timeout: 90000 });
  await rec.mark("answer");
  await rec.wait(4500);
}
await rec.stop();
await ctx.close();
