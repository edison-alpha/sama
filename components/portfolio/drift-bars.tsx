"use client";

import { m } from "motion/react";
import type { Drift } from "@/lib/api/types";
import { percent } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

/** Dark bar = where you are; coral marker = your target. Text carries the numbers so colour is never the only cue. Bars grow in and glide on refresh. */
export function DriftBars({ drift }: { drift: Drift[] }) {
  const { d, locale } = useI18n();
  return (
    <div className="grid gap-4">
      {drift.map((r) => (
        <div key={r.symbol} className="grid grid-cols-[60px_1fr_auto] items-center gap-3 text-sm">
          <span className="font-medium">{r.symbol}</span>
          <span className="relative h-2.5 rounded-full bg-surface-2" aria-hidden="true">
            <m.span className="absolute inset-y-0 left-0 rounded-full bg-ink" initial={{ width: 0 }} animate={{ width: `${Math.min(100, r.currentPct)}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
            <m.span className="absolute -top-1 h-[18px] w-1 rounded-full bg-accent" initial={{ left: "calc(0% - 2px)", opacity: 0 }} animate={{ left: `calc(${Math.min(100, r.targetPct)}% - 2px)`, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 22, delay: 0.15 }} />
          </span>
          <span className="num text-xs text-ink-3">{percent(r.currentPct, locale, 0)} → {percent(r.targetPct, locale, 0)}</span>
        </div>
      ))}
      <p className="text-xs text-ink-3">{d.home.driftLegend}</p>
    </div>
  );
}
