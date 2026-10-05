"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Which tokens the target editor lists, as the user set it: `true` shows a token the editor would otherwise hide,
 * `false` hides one it would otherwise show. A token missing from the map keeps the editor's default. Stored per browser,
 * like the theme and sidebar, so it never needs an API.
 */
export type TokenVisibility = Record<string, boolean>;

const KEY = "sama_token_visibility_v1";

function read(): TokenVisibility {
  try {
    const raw = window.localStorage.getItem(KEY);
    const value: unknown = raw ? JSON.parse(raw) : {};
    return value && typeof value === "object" && !Array.isArray(value) ? (value as TokenVisibility) : {};
  } catch {
    return {};
  }
}

function write(next: TokenVisibility) {
  try {
    if (Object.keys(next).length === 0) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private windows and blocked storage: the choice still applies for this visit.
  }
}

/** Reads the saved choices after mount (never during render, so server and client markup match). */
export function useTokenVisibility() {
  const [visibility, setVisibility] = useState<TokenVisibility>({});

  useEffect(() => setVisibility(read()), []);

  const setShown = useCallback((symbol: string, shown: boolean | null) => {
    setVisibility((v) => {
      const next = { ...v };
      if (shown === null) delete next[symbol];
      else next[symbol] = shown;
      write(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    write({});
    setVisibility({});
  }, []);

  return { visibility, setShown, reset };
}
