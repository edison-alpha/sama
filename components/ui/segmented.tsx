"use client";

import { cx } from "@/utils/cx";

/** A row of mutually exclusive options; arrow keys move between them like a native radio group. */
export function Segmented<T extends string>({ value, options, onChange, label, className }: { value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("inline-flex rounded-xl border border-[var(--glass-edge)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)] p-1 backdrop-blur-xl", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => {
            const i = options.findIndex((x) => x.value === value);
            if (e.key === "ArrowRight" || e.key === "ArrowDown") onChange(options[(i + 1) % options.length]!.value);
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") onChange(options[(i - 1 + options.length) % options.length]!.value);
          }}
          className={cx("min-h-9 rounded-lg px-3 text-sm font-medium transition-colors", o.value === value ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
