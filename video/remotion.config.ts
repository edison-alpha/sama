/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import fs from "fs";
import path from "path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

/**
 * The app scenes render the real Sama screens from ../components and ../app. They import "@/…" like the Next app does;
 * the few Next- and wallet-only modules are swapped for video stubs in src/real/stubs, and React resolves to this
 * project's copy so the app's components and Remotion share one React.
 * Works whether Remotion is started from sama-frontend/ or from sama-frontend/video/.
 */
const VIDEO = fs.existsSync(path.join(process.cwd(), "video", "remotion.config.ts")) ? path.join(process.cwd(), "video") : process.cwd();
const ROOT = path.resolve(VIDEO, "..");
const stub = (file: string) => path.join(VIDEO, "src", "real", "stubs", file);

type Rule = { test?: RegExp; use?: Array<string | { loader: string; options?: Record<string, unknown> }> };

Config.overrideBundlerConfig((current) => {
  const config = enableTailwind(current);
  // The app's CSS points at files in its own public/ ("/footer-bg.png"); leave root-relative URLs alone.
  for (const rule of (config.module?.rules ?? []) as Rule[]) {
    if (!rule?.test?.toString().includes(".css")) continue;
    for (const use of rule.use ?? []) {
      if (typeof use === "object" && use.loader.includes("css-loader")) use.options = { ...use.options, url: { filter: (url: string) => !url.startsWith("/") } };
    }
  }
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias as Record<string, string> | undefined),
        "@/components/wallet/session$": stub("session.tsx"),
        "@/lib/api/use-api$": stub("use-api.ts"),
        "next/link$": stub("next-link.tsx"),
        "next/navigation$": stub("next-navigation.ts"),
        "motion/react$": stub("motion.tsx"),
        "@": ROOT,
        react: path.join(VIDEO, "node_modules", "react"),
        "react-dom": path.join(VIDEO, "node_modules", "react-dom"),
      },
    },
  };
});
