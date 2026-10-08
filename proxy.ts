import { NextResponse, type NextRequest } from "next/server";
import { routeHost } from "@/lib/host-routing";
import { ORIGINS } from "@/lib/site";

/**
 * Splits one deployment across hostnames (see lib/host-routing.ts for the rules). Does nothing when the
 * NEXT_PUBLIC_*_URL variables are unset, which is how local dev and Vercel previews run.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const decision = routeHost(host, pathname, search, ORIGINS);

  if (decision.kind === "redirect") return NextResponse.redirect(decision.url, decision.status);
  if (decision.kind === "rewrite") {
    const url = request.nextUrl.clone();
    url.pathname = decision.pathname;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

/** Skips Next internals and anything with a file extension (/sama-logo.svg, /sw.js, /assets/NVDAB.png). */
export const config = { matcher: ["/((?!_next/|.*\\..*).*)"] };
