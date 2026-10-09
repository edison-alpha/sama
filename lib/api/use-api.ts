"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { friendlyError } from "@/lib/errors";

/**
 * Loads data and optionally polls it. Polling stops when `stopWhen` returns true (for example once a round is terminal),
 * as with the 4 s round polling (PRD §19.4.6).
 */
export function useApi<T>(load: () => Promise<T>, deps: unknown[], options: { pollMs?: number; stopWhen?: (data: T) => boolean } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef(load);
  loadRef.current = load;
  const { pollMs, stopWhen } = options;

  const refresh = useCallback(async () => {
    try {
      setData(await loadRef.current());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const stopped = data !== null && stopWhen ? stopWhen(data) : false;

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!pollMs || stopped) return;
    // A hidden tab does not poll: it would spend RPC quota on a screen nobody is looking at. It catches up when shown again.
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(tick, pollMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [pollMs, stopped, refresh]);

  return { data, error, refresh };
}

/** Runs a user action with a live progress line and a human error message. */
export function useAction() {
  const { d } = useI18n();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = (fn: (say: (s: string) => void) => Promise<void>) =>
    start(async () => {
      setError(null);
      try {
        await fn(setStatus);
      } catch (e) {
        setError(friendlyError(e, d));
      } finally {
        setStatus(null);
      }
    });
  return { pending, status, error, run };
}
