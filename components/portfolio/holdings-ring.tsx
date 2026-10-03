"use client";

import type { ReactNode } from "react";
import type { Position } from "@/lib/api/types";
import { percent } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { colorFor } from "./allocation-donut";

/**
 * Donut of what the wallet holds with a figure in the middle and a legend beside it. Colours come from colorFor()
 * in holding order, so they match the target editor's donuts. The legend carries the numbers; colour is never the only cue.
 */
export function HoldingsRing({ positions, center, label, max = 5 }: { positions: Position[]; center: ReactNode; label: string; max?: number }) {
  const { locale } = useI18n();
  const sorted = [...positions].filter((p) => p.pct > 0).sort((a, b) => b.pct - a.pct);
  const order = sorted.map((p) => p.symbol);
  const r = 62;
  const c = 2 * Math.PI * r;
  const gap = sorted.length > 1 ? 4 : 0;
  let offset = 0;
  const arcs = sorted.map((p) => {
    const len = (p.pct / 100) * c;
    const arc = { symbol: p.symbol, len: Math.max(0.5, len - gap), offset };
    offset += len;
    return arc;
  });
  const shown = sorted.slice(0, max);
  const rest = sorted.slice(max).reduce((s, p) => s + p.pct, 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
      <figure className="relative grid size-40 shrink-0 place-items-center">
        <svg viewBox="0 0 160 160" className="absolute inset-0 size-full -rotate-90" role="img" aria-label={`${label}: ${sorted.map((p) => `${p.symbol} ${percent(p.pct, locale, 0)}`).join(", ")}`}>
          <circle cx="80" cy="80" r={r} fill="none" stroke="var(--heat-0)" strokeWidth="14" />
          {arcs.map((a) => (
            <circle key={a.symbol} cx="80" cy="80" r={r} fill="none" stroke={colorFor(a.symbol, order)} strokeWidth="14" strokeDasharray={`${a.len} ${c}`} strokeDashoffset={-a.offset} />
          ))}
        </svg>
        <figcaption className="relative text-center">{center}</figcaption>
      </figure>
      <ul className="grid w-full gap-2.5">
        {shown.map((p) => (
          <li key={p.symbol} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2.5">
              <span className="size-2.5 rounded-full" style={{ background: colorFor(p.symbol, order) }} aria-hidden="true" />
              <span className="font-medium text-ink">{p.symbol}</span>
            </span>
            <span className="num text-ink-2">{percent(p.pct, locale)}</span>
          </li>
        ))}
        {rest > 0 && (
          <li className="flex items-center justify-between gap-3 text-sm text-ink-3">
            <span className="flex items-center gap-2.5"><span className="size-2.5 rounded-full bg-ink-3" aria-hidden="true" />+{sorted.length - max}</span>
            <span className="num">{percent(rest, locale)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
