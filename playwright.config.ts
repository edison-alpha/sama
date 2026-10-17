import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:43210",
    viewport: { width: 390, height: 844 },
    contextOptions: { reducedMotion: "reduce" },
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    { command: "node tests/start-server.mjs", url: "http://127.0.0.1:43210/sama-logo.svg", timeout: 120_000 },
    { command: "node tests/start-server.mjs --production", url: "http://127.0.0.1:43200/sama-logo.svg", timeout: 60_000 },
  ],
});
