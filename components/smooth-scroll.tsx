"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Smooth scrolling for the marketing pages only. Lenis overrides any native scroll that happens mid-animation, which
 * fights browser scroll anchoring and Next.js route scrolls; app pages re-render live data constantly, so they keep
 * native scrolling. A fresh instance per route avoids carrying old inertia or page height across navigations.
 */
const SMOOTH_ROUTES = new Set(["/", "/learn", "/proof", "/demo"]);

let current: Lenis | null = null;

/** Scrolls the page to `top`, through Lenis when it is running so the two never fight. */
export function scrollToY(top: number) {
  if (current) current.scrollTo(top);
  else window.scrollTo({ top, behavior: "smooth" });
}

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (!SMOOTH_ROUTES.has(pathname) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: true, duration: 1.1, stopInertiaOnNavigate: true });
    current = lenis;
    return () => {
      lenis.destroy();
      if (current === lenis) current = null;
    };
  }, [pathname]);

  return null;
}
