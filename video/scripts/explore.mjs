/** Dev helper: screenshots each route and lists its buttons/links, to plan the recorded demo. */
import { APP, launch } from "./rec-browser.mjs";
const out = process.argv[2];
const routes = process.argv.slice(3);
const ctx = await launch();
const page = ctx.pages()[0] ?? (await ctx.newPage());
for (const r of routes) {
  await page.goto(APP + r, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(2500);
  const name = r.replace(/[^a-z0-9]+/gi, "_") || "root";
  await page.screenshot({ path: `${out}/${name}.png` });
  const items = await page.$$eval("a,button", (els) => els.map((e) => `${e.tagName} ${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 50)} ${e.getAttribute("href") ?? ""}`));
  console.log(`\n## ${r} -> ${page.url()}\n` + items.join("\n"));
}
await ctx.close();
