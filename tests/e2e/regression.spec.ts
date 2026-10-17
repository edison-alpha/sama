import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function fixture(page: Page, screen: string, symbol = "-") {
  await page.goto(`/qa-fixture/${screen}/${symbol}`);
  await expect(page.locator("main")).toBeVisible();
}

async function containedFocus(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  for (let i = 0; i < 15; i++) {
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Tab");
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
}

for (const fail of [false, true]) test(`a late weekly ${fail ? "failure" : "response"} cannot replace the monthly chart`, async ({ page }) => {
  let releaseWeek: (() => void) | undefined;
  let weekRequested = false;
  const week = new Promise<void>(resolve => { releaseWeek = resolve; });
  await page.route("**/api/market/**", async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/history")) {
      const range = url.searchParams.get("range");
      if (range === "1W") { weekRequested = true; await week; }
      if (range === "1W" && fail) {
        await route.fulfill({ status: 503, json: { error: "Weekly history unavailable" } });
        return;
      }
      await route.fulfill({ json: { points: [{ t: 1700000000000, usd: 100 }, { t: 1700003600000, usd: range === "1M" ? 300 : 200 }] } });
    } else if (url.pathname.endsWith("/trades")) await route.fulfill({ json: { trades: [] } });
    else await route.fulfill({ json: { priceUsd: 150, marketCapUsd: 1000000, fdvUsd: 1000000, volume24hUsd: 1000, liquidityUsd: 50000, supply: 10000, poolAddress: "0x2222222222222222222222222222222222222222", poolName: "QA" } });
  });
  await fixture(page, "market", "NVDAB");
  const chart = page.locator('[role="img"][tabindex]');
  await expect(chart).toHaveAttribute("aria-label", /200\.00/);
  await page.getByRole("radio", { name: "1W", exact: true }).click();
  await expect.poll(() => weekRequested).toBe(true);
  await page.getByRole("radio", { name: "1M", exact: true }).click();
  await expect(chart).toHaveAttribute("aria-label", /past month.*300\.00/);
  releaseWeek!();
  await page.waitForTimeout(250);
  await expect(chart).toHaveAttribute("aria-label", /past month.*300\.00/);
  await expect(page.getByText("Weekly history unavailable")).not.toBeVisible();
});

for (const name of ["Receive", "Send", "Convert BNB"]) {
  test(`${name} keeps keyboard focus inside and restores the trigger`, async ({ page }) => {
    await fixture(page, "portfolio");
    const trigger = page.getByRole("button", { name, exact: true });
    await trigger.click();
    await containedFocus(page);
    await expect(trigger).toBeFocused();
  });
}

test("wallet dialogs yield to the SDK prompt without discarding inputs", async ({ page }) => {
  await fixture(page, "portfolio");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  const recipient = page.locator('dialog input').first();
  await recipient.fill("0x2222222222222222222222222222222222222222");
  await page.evaluate(() => window.dispatchEvent(new Event("qa:walletprompt")));
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Close wallet prompt" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(recipient).toHaveValue("0x2222222222222222222222222222222222222222");
  await page.keyboard.press("Escape");
});

test("Circle wizard and reusable sheet contain focus", async ({ page }) => {
  await fixture(page, "circles");
  const trigger = page.getByRole("button", { name: "Create", exact: true });
  await trigger.click();
  await containedFocus(page);
  await expect(trigger).toBeFocused();
  await fixture(page, "sheet");
  await page.getByRole("button", { name: "Open test sheet" }).click();
  await containedFocus(page);
});

test("activity detail closes when its mobile layout becomes desktop", async ({ page }) => {
  await fixture(page, "activity");
  const row = page.locator('section[aria-labelledby="history-title"] li button').first();
  await row.click();
  await containedFocus(page);
  await row.click();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

for (const locale of ["en", "id"]) {
  test(`portfolio fits 320px in ${locale}`, async ({ page, context }) => {
    await context.addCookies([{ name: "sama_locale", value: locale, url: "http://127.0.0.1:43210" }]);
    await page.setViewportSize({ width: 320, height: 740 });
    await fixture(page, "portfolio");
    await expect(page.getByRole("button", { name: locale === "en" ? "Receive" : "Terima", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  });
}

test("landing statistics fit tablets and carousel is keyboard accessible", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("http://127.0.0.1:43200/");
  await expect(page.getByText("0% custody", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(768);
  const carousel = page.locator("ul.snap-x");
  await carousel.focus();
  await expect(carousel).toBeFocused();
});

test("offline navigation displays an HTML recovery page", async ({ page, context }) => {
  await page.goto("http://127.0.0.1:43200/docs");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.goto("http://127.0.0.1:43200/docs/quickstart");
  await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reload / Muat ulang" })).toHaveAttribute("href", "");
  await context.setOffline(false);
  await page.getByRole("link", { name: "Reload / Muat ulang" }).click();
  await expect(page.getByRole("heading", { name: "Quickstart", exact: true })).toBeVisible();
});

test("Proof fallback uses the evidence network and fixtures are unavailable in production", async ({ page, request }) => {
  await page.goto("http://127.0.0.1:43200/proof");
  await expect(page.locator('a[href*="/address/0x7811"]').first()).toHaveAttribute("href", /^https:\/\/bscscan\.com\/address\//);
  const response = await request.get("http://127.0.0.1:43200/qa-fixture/portfolio/-");
  expect(response.status()).toBe(404);
  await page.goto("http://127.0.0.1:43200/home");
  await expect(page).toHaveURL(/\/start\?next=/);
});

test("settings failures show feedback instead of an endless skeleton or rejected promise", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await fixture(page, "settings", "load-error");
  await expect(page.getByText("QA settings unavailable")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await fixture(page, "settings", "save-error");
  await page.getByRole("switch").first().click();
  await expect(page.getByText("QA save failed")).toBeVisible();
  expect(errors).toEqual([]);
});

for (const theme of ["light", "dark"]) {
  test(`accessibility regression on solid surfaces in ${theme}`, async ({ page, context }) => {
    await context.addInitScript(value => localStorage.setItem("sama_theme", value), theme);
    for (const screen of ["portfolio", "settings", "circles"]) {
      await fixture(page, screen);
      await expect(page.locator("main").getByRole("button").first()).toBeVisible();
      await page.waitForTimeout(300);
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(result.violations, `${screen}: ${JSON.stringify(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })))}`).toEqual([]);
    }
    await page.goto("http://127.0.0.1:43200/docs/concepts/assistant");
    await expect(page.locator(".tiptap").first()).toBeVisible();
    await expect(page.locator('.tiptap[role="textbox"]')).toHaveCount(0);
  });
}

for (const width of [320, 390, 768, 1024, 1280, 1440]) test(`responsive routes fit ${width}px`, async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width, height: 900 });
  for (const path of ["/", "/proof", "/docs", "/docs/concepts/assistant"]) {
    await page.goto(`http://127.0.0.1:43200${path}`);
    await expect(page.locator("main")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBe(width);
  }
  for (const screen of ["home", "portfolio", "circles", "activity", "settings"]) {
    await fixture(page, screen);
    await expect(page.locator("main").getByRole("button").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth), screen).toBe(width);
  }
});

test("docs menu and search retain keyboard focus on small screens", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("http://127.0.0.1:43200/docs");
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await menu.click();
  await containedFocus(page);
  await expect(menu).toBeFocused();
  const search = page.getByRole("button", { name: /Search/ });
  await search.click();
  await containedFocus(page);
  await expect(search).toBeFocused();
  await search.click();
  await page.getByRole("combobox").fill("matching");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/docs\/concepts\/matching/);
});

test("Receive content fits 320px and exposes the complete address", async ({ page, context }) => {
  await context.addCookies([{ name: "sama_locale", value: "id", url: "http://127.0.0.1:43210" }]);
  await page.setViewportSize({ width: 320, height: 740 });
  await fixture(page, "portfolio");
  await page.getByRole("button", { name: "Terima", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  const address = dialog.getByText("0x1111111111111111111111111111111111111111", { exact: true });
  await expect(address).toBeVisible();
  expect(await address.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  const audit = await new AxeBuilder({ page }).include("dialog[open]").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(audit.violations).toEqual([]);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await dialog.getByRole("button", { name: "Salin alamat", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Alamat disalin", exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("0x1111111111111111111111111111111111111111");
});

test("slow polling responses arrive without overlapping requests", async ({ page }) => {
  let active = 0;
  let peak = 0;
  let completed = 0;
  await page.route("**/qa-poll", async route => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise(resolve => setTimeout(resolve, 250));
    active -= 1;
    await route.fulfill({ body: "Polling response received" });
    completed += 1;
  });
  await fixture(page, "poll");
  await expect(page.getByRole("status")).toHaveText("Polling response received");
  // Development Strict Mode repeats the initial effect; measure subsequent polling cycles.
  await expect.poll(() => active).toBe(0);
  peak = 0;
  const checkpoint = completed;
  await expect.poll(() => completed).toBeGreaterThanOrEqual(checkpoint + 2);
  expect(peak).toBe(1);
});
