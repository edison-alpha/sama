import { useId, useState } from "react";
import { continueRender, delayRender } from "remotion";

/**
 * lib/api/use-api.ts for the video. Each load runs once (through the real mock API), the frame waits for it with
 * delayRender, and every later frame reads the cached result synchronously, so renders are deterministic. No polling.
 */
type Entry = { done: boolean; value?: unknown; error?: string };
const cache = new Map<string, Entry>();

export function useApi<T>(load: () => Promise<T>, deps: unknown[], _options: { pollMs?: number; stopWhen?: (data: T) => boolean } = {}) {
  const [, rerender] = useState(0);
  // One cache slot per call site (useId is stable for a component across frames) and per deps.
  const key = `${useId()}|${load.toString()}|${JSON.stringify(deps)}`;
  let entry = cache.get(key);
  if (!entry) {
    const created: Entry = { done: false };
    entry = created;
    cache.set(key, created);
    const handle = delayRender(`Loading demo data ${JSON.stringify(deps)}`);
    load().then(
      (value) => {
        created.done = true;
        created.value = value;
        rerender((n) => n + 1);
        continueRender(handle);
      },
      (e: Error) => {
        created.done = true;
        created.error = e.message;
        rerender((n) => n + 1);
        continueRender(handle);
      },
    );
  }
  return { data: entry.done && !entry.error ? (entry.value as T) : null, error: entry.error ?? null, refresh: async () => {} };
}

export function useAction() {
  return { pending: false, status: null as string | null, error: null as string | null, run: (_fn: (say: (s: string) => void) => Promise<void>) => {} };
}
