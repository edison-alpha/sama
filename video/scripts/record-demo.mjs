/**
 * Records the real app on demo data (localhost, NEXT_PUBLIC_SAMA_API_MODE=demo): nothing is signed or sent, the demo
 * signer returns fake hashes. One clip per scene → public/rec/<clip>.mp4 + .json.
 * Usage: node scripts/record-demo.mjs [clip …]   (default: all)
 */
import { launch } from "./rec-browser.mjs";
import { cleanPage, startCapture } from "./capture.mjs";

const APP = "http://localhost:3200";
const only = process.argv.slice(2);
const ctx = await launch();
const page = ctx.pages()[0] ?? (await ctx.newPage());

// Fresh demo round: forget earlier clicks so round 42 starts at "Join".
await page.goto(`${APP}/home`, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.removeItem("sama_demo_store_v2"));
// Keep the assistant bar out of the demo clips; the AI gets its own clip on the live app.
await page.evaluate(() => localStorage.setItem("sama:ai:hidden", "1"));

async function open(path) {
  await page.goto(APP + path, { waitUntil: "networkidle" });
  await cleanPage(page);
  await page.addStyleTag({ content: '[aria-label="Open assistant"]{display:none!important}' });
  await page.waitForTimeout(1500);
}

const clips = {
  async home() {
    await open("/home");
    const rec = await startCapture(page, "home");
    await rec.wait(1800);
    await rec.mark("balance", page.getByText(/\$[\d,]+\.\d\d/).first());
    await rec.moveTo(page.locator("button", { hasText: /^1W$/ }));
    await rec.click(page.locator("button", { hasText: /^1W$/ }));
    await rec.wait(1600);
    await rec.mark("next-step", page.getByText("Your next step", { exact: false }).locator("..").locator(".."));
    await rec.moveTo(page.locator('a[href="/rounds/r-42"]', { hasText: /^Join round$/ }), { ms: 900 });
    await rec.wait(1500);
    await rec.stop();
  },

  async target() {
    await open("/portfolio");
    const rec = await startCapture(page, "target");
    await rec.wait(1200);
    await rec.click(page.getByRole("button", { name: "Target", exact: true }));
    await rec.wait(2200);
    await rec.mark("editor", page.locator("main"));
    await page.mouse.wheel(0, 380);
    await rec.wait(2500);
    await rec.stop();
  },

  async circle() {
    await open("/circles");
    const rec = await startCapture(page, "circle");
    await rec.wait(1200);
    await rec.click(page.getByRole("link", { name: "US Big Tech Weekly" }).first());
    await page.waitForURL(/circles\/c-/);
    await cleanPage(page);
    await rec.wait(2600);
    await rec.mark("circle", page.locator("main"));
    await page.mouse.wheel(0, 300);
    await rec.wait(2200);
    await rec.stop();
  },

  async round() {
    await open("/rounds/r-42");
    const rec = await startCapture(page, "round");
    const btn = (name) => page.getByRole("button", { name, exact: true });
    await rec.wait(1500);
    await rec.mark("plan", page.getByText("Your rebalance").first().locator(".."));
    await rec.wait(1200);
    await rec.click(btn("Sign & join"));
    await rec.mark("signed");
    // Depending on the round, the demo either waits for "Close now" or starts matching on its own.
    await Promise.race([btn("Close now and match").waitFor({ timeout: 30000 }), btn("Approve & allow").waitFor({ timeout: 30000 })]);
    if (await btn("Close now and match").isVisible().catch(() => false)) {
      await rec.wait(1200);
      await rec.click(btn("Close now and match"));
    }
    await rec.mark("matching");
    await btn("Approve & allow").waitFor({ timeout: 30000 });
    await rec.mark("paired", page.getByText("You've been paired").locator("..").locator(".."));
    await rec.wait(2600);
    await rec.click(btn("Approve & allow"));
    await btn("Submit settlement").waitFor({ timeout: 30000 });
    await rec.mark("ready");
    await rec.wait(1400);
    await rec.click(btn("Submit settlement"));
    await rec.mark("settling");
    await page.getByText("One last choice").waitFor({ timeout: 40000 }).catch(() => {});
    await rec.mark("leftover");
    await rec.wait(1800);
    const confirm = btn("Confirm");
    if (await confirm.isVisible().catch(() => false)) {
      await rec.click(page.getByText("Roll into the next round").first());
      await rec.wait(600);
      await rec.click(confirm);
    }
    await page.getByText("All done").first().waitFor({ timeout: 30000 });
    await rec.mark("done", page.getByText("All done").first().locator("..").locator(".."));
    await rec.wait(3500);
    await rec.stop();
  },
};

for (const [name, fn] of Object.entries(clips)) {
  if (only.length && !only.includes(name)) continue;
  try {
    await fn();
  } catch (e) {
    await page.screenshot({ path: `public/rec/FAILED-${name}.png` });
    console.error(`${name} failed:`, e.message.split("\n")[0]);
  }
}
await ctx.close();
