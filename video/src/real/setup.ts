import { DEMO_ACTIVITY, DEMO_CIRCLES, DEMO_TARGET } from "@/lib/api/demo-data";
import { continueRender, delayRender, staticFile } from "remotion";
import "./app.css";

/**
 * Seeds the real mock API (lib/api/mock.ts) before its first read, so each app scene shows a fixed round state.
 * The mock derives a round's state from how long ago the user signed / approved / settled, so the clock is frozen
 * (Remotion only reads Date.now for log timings) and these timestamps pin:
 *   r-81    Matching (signed 4.5 s ago → SOLVING)
 *   r-081   Approving (matched, waiting for approvals)
 *   r-0081  Settling (settlement sent 1 s ago)
 *   r-00081 Done & verified, leftovers carried forward
 * All four read as "Round 81" (the mock takes the digits of the id). Countdowns in the app stand still too.
 */
const now = Date.now();
Date.now = () => now;
const ago = (s: number) => now - s * 1000;
const circles = structuredClone(DEMO_CIRCLES);
// US Big Tech Weekly, organised by the demo wallet, with no round open yet: its page shows "Start a round now".
circles[0]!.liveRound = null;
circles[0]!.role = "ORGANIZER";

const store = {
  target: DEMO_TARGET,
  circles,
  activity: structuredClone(DEMO_ACTIVITY),
  settings: { notify: { email: true, telegram: false, inApp: true }, residualStyle: "ECONOMIC", costCapBps: 100, gasSponsorship: true },
  rounds: {
    "r-81": { opensAt: ago(300), signedAt: ago(4.5) },
    "r-081": { opensAt: ago(300), signedAt: ago(60) },
    "r-0081": { opensAt: ago(300), signedAt: ago(120), approvedAt: ago(60), settledAt: ago(1) },
    "r-00081": { opensAt: ago(300), signedAt: ago(180), approvedAt: ago(120), settledAt: ago(60), decision: "CARRY_FORWARD" },
    "r-41": { opensAt: Date.parse("2026-09-28T09:00:00.000Z"), signedAt: 1, approvedAt: 1, settledAt: 1, decision: "CARRY_FORWARD" },
  },
};

try {
  window.localStorage.setItem("sama_demo_store_v2", JSON.stringify(store));
} catch {
  // The mock falls back to its own fresh demo store.
}

// The app scenes use Sama's dark theme (styles/tokens.css :root[data-theme="dark"]).
document.documentElement.dataset.theme = "dark";

/**
 * The app's components point <img> at its public folder ("/sama-logo.svg", "/assets/NVDAB.png"). Those files are
 * copied to video/public; point each such image at staticFile() and hold the frame until it has loaded.
 */
const PUBLIC = staticFile("x").slice(0, -1);

function fixImage(img: HTMLImageElement) {
  const src = img.getAttribute("src");
  if (!src || !src.startsWith("/") || src.startsWith(PUBLIC) || !img.closest(".sama-app")) return;
  const handle = delayRender(`App image ${src}`);
  const done = () => continueRender(handle);
  img.addEventListener("load", done, { once: true });
  img.addEventListener("error", done, { once: true });
  img.setAttribute("src", staticFile(src.slice(1)));
}

new MutationObserver((records) => {
  for (const r of records) {
    if (r.type === "attributes" && r.target instanceof HTMLImageElement) fixImage(r.target);
    r.addedNodes.forEach((n) => {
      if (n instanceof HTMLImageElement) fixImage(n);
      else if (n instanceof Element) n.querySelectorAll("img").forEach(fixImage);
    });
  }
}).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
