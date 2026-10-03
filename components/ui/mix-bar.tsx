"use client";

import { m } from "motion/react";
import { cx } from "@/utils/cx";

export type MixPart = { key: string; label: string; value: number; color: string; detail?: string };

/**
 * One row of rounded segments sized by share, with a fine diagonal sheen, and a legend below that carries the numbers.
 * Empty parts are dropped from the bar but kept in the legend so the categories stay put.
 */
export function MixBar({ parts, label, className }: { parts: MixPart[]; label: string; className?: string }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div className={className}>
      <div className="flex h-7 gap-1" role="img" aria-label={`${label}: ${parts.map((p) => `${p.label} ${p.detail ?? p.value}`).join(", ")}`}>
        {parts.filter((p) => p.value > 0).map((p) => (
          <m.span
            key={p.key}
            className="min-w-2 rounded-lg shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]"
            initial={{ flexGrow: 0 }}
            animate={{ flexGrow: p.value / total }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
            style={{
              backgroundColor: p.color,
              backgroundImage: "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.16) 0 2px, transparent 2px 6px)",
            }}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {parts.map((p) => (
          <li key={p.key} className={cx("flex items-center gap-2", p.value === 0 ? "text-ink-3" : "text-ink-2")}>
            <span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden="true" />
            {p.label}
            {p.detail && <span className="num font-medium text-ink">{p.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
