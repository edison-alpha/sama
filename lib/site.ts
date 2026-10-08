import { isAppPath } from "@/lib/host-routing";

/**
 * Where each part of Sama lives. All three are optional: with none set (local dev, Vercel previews, a single-domain
 * deploy) every link stays relative and nothing here changes behaviour.
 *
 *   NEXT_PUBLIC_SITE_URL  https://samafi.xyz        landing, /proof, /demo
 *   NEXT_PUBLIC_APP_URL   https://app.samafi.xyz    sign-in and the app; falls back to SITE_URL while they share a host
 *   NEXT_PUBLIC_DOCS_URL  https://docs.samafi.xyz   the guide, served from the root of that host
 *
 * proxy.ts rewrites every path on the docs host into /docs/*, so links leaving the docs must be absolute: set SITE_URL
 * (and APP_URL) wherever DOCS_URL is set. Each variable is read as a literal so Next inlines it into client bundles.
 */
const trim = (url: string | undefined) => (url ?? "").replace(/\/+$/, "");

export const DOCS_URL = trim(process.env.NEXT_PUBLIC_DOCS_URL);
export const SITE_URL = trim(process.env.NEXT_PUBLIC_SITE_URL);
export const APP_URL = trim(process.env.NEXT_PUBLIC_APP_URL) || SITE_URL;

/** The origins exactly as configured, for host routing (no fallback: an unset app origin must stay unset there). */
export const ORIGINS = { site: SITE_URL || undefined, app: trim(process.env.NEXT_PUBLIC_APP_URL) || undefined, docs: DOCS_URL || undefined };

/** "/docs" or "/docs/concepts/rounds#x" -> the docs host ("/" or "/concepts/rounds#x" there); unchanged when no docs host is set. */
export function docsUrl(path: string): string {
  if (!DOCS_URL || (path !== "/docs" && !path.startsWith("/docs/") && !path.startsWith("/docs#"))) return path;
  return `${DOCS_URL}${path.slice("/docs".length) || "/"}`;
}

/** A path on the landing host (landing, /proof, /demo). */
export const siteUrl = (path: string) => (SITE_URL ? `${SITE_URL}${path}` : path);

/** A path on the app host (/start and everything behind login). */
export const appUrl = (path: string) => (APP_URL ? `${APP_URL}${path}` : path);

/**
 * Resolves a site path to the host that serves it: "/docs/…" to the docs, sign-in and app routes to the app, anything
 * else ("/", "/proof", "/demo") to the landing host. Absolute URLs pass through. Used by the docs content, where links
 * are written as plain site paths, and by the footer.
 */
export function resolveHref(href: string): string {
  if (!href.startsWith("/")) return href;
  if (href === "/docs" || href.startsWith("/docs/") || href.startsWith("/docs#")) return docsUrl(href);
  if (isAppPath(href.split(/[?#]/)[0] ?? href)) return appUrl(href);
  return siteUrl(href);
}
