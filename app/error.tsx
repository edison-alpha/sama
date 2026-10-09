"use client";

import { useEffect } from "react";
import { Mark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

/** A page that was open across a deploy asks for scripts that no longer exist; one reload fetches the new ones. */
const STALE_BUNDLE = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;
const RELOADED = "sama:reloaded-for-stale-bundle";

/**
 * Catches anything that throws while a page renders. Without it Next.js shows its generic "This page couldn't load" and
 * the real cause is lost; here the message stays on screen (and in the console) so it can be reported and fixed.
 */
export default function RouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { d } = useI18n();

  useEffect(() => {
    console.error(error);
    if (!STALE_BUNDLE.test(`${error.name} ${error.message}`)) return;
    try {
      if (sessionStorage.getItem(RELOADED)) return;
      sessionStorage.setItem(RELOADED, "1");
      window.location.reload();
    } catch {
      // Storage blocked: the buttons below still work.
    }
  }, [error]);

  return (
    <main className="grid min-h-[60dvh] place-items-center px-4 text-center">
      <div className="grid max-w-md justify-items-center gap-4">
        <Mark size={48} />
        <h1 className="text-2xl font-semibold">{d.errors.generic}</h1>
        <p className="break-words font-mono text-xs text-ink-3 [overflow-wrap:anywhere]">
          {error.message || error.name}
          {error.digest ? ` · ${error.digest}` : ""}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => retry()}>{d.common.retry}</Button>
          <Button variant="secondary" onClick={() => window.history.back()}>
            {d.common.back}
          </Button>
        </div>
      </div>
    </main>
  );
}
