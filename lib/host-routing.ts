/**
 * Which host serves what. Pure functions with no Next.js imports, so proxy.ts stays a thin wrapper and the rules can be
 * tested on their own.
 *
 *   samafi.xyz       landing, /proof, /demo
 *   app.samafi.xyz   /start (sign-in) and everything behind it
 *   docs.samafi.xyz  the guide, from the root of the host (served from /docs/* inside the app)
 */

export type Origins = { site?: string; app?: string; docs?: string };

export type Decision =
  | { kind: "next" }
  | { kind: "rewrite"; pathname: string }
  | { kind: "redirect"; url: string; status: 307 | 308 };

/** The routes that live behind login, plus sign-in itself. Matches the folders under app/(app)/, /start and /invite. */
const APP_PATH = /^\/(start|home|portfolio|circles|rounds|activity|settings|markets|invite)(\/|$)/;
/** Public pages that belong to the landing host. */
const SITE_PATH = /^\/(proof|demo)(\/|$)/;

export const isAppPath = (pathname: string) => APP_PATH.test(pathname);
export const isSitePath = (pathname: string) => SITE_PATH.test(pathname);
export const isDocsPath = (pathname: string) => pathname === "/docs" || pathname.startsWith("/docs/");

const hostOf = (origin: string | undefined) => (origin ? new URL(origin).host : null);
const stripDocs = (pathname: string) => pathname.slice("/docs".length) || "/";

export function routeHost(host: string, pathname: string, search: string, origins: Origins): Decision {
  const { site, app, docs } = origins;
  if (!site && !app && !docs) return { kind: "next" };

  const docsHost = hostOf(docs);
  const appHost = hostOf(app);
  const siteHost = hostOf(site);
  // With no site origin set (a docs-only rollout) every host that is not docs or app counts as the site. With one set,
  // any other host (a Vercel preview, localhost) is left alone, so previews never bounce to production.
  const kind = host === docsHost ? "docs" : host === appHost ? "app" : siteHost === null || host === siteHost ? "site" : "other";
  if (kind === "other") return { kind: "next" };

  if (kind === "docs") {
    if (isDocsPath(pathname)) return { kind: "redirect", url: `${docs}${stripDocs(pathname)}${search}`, status: 308 };
    return { kind: "rewrite", pathname: pathname === "/" ? "/docs" : `/docs${pathname}` };
  }

  if (isDocsPath(pathname) && docs) return { kind: "redirect", url: `${docs}${stripDocs(pathname)}${search}`, status: 308 };

  if (kind === "app") {
    if (pathname === "/") return { kind: "redirect", url: `${app}/home${search}`, status: 307 };
    if (isSitePath(pathname) && site) return { kind: "redirect", url: `${site}${pathname}${search}`, status: 307 };
    return { kind: "next" };
  }

  if (isAppPath(pathname) && app) return { kind: "redirect", url: `${app}${pathname}${search}`, status: 307 };
  return { kind: "next" };
}
