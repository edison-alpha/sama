"use client";

import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

/**
 * Radio card ported from BoardUI (MIT, boardui.com/components/radio-card): a bordered selectable card with title,
 * description and the gradient radio dot, built on a native radio input so arrow keys move within the group.
 */

export function RadioCardGroup({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("grid gap-2.5", className)}>
      {children}
    </div>
  );
}

export function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid size-5 shrink-0 place-items-center rounded-full transition-[background,box-shadow] duration-200",
        checked ? "board-selected" : "bg-surface shadow-[inset_0_0_0_1px_var(--line-strong)]",
      )}
    >
      <span className={cx("size-2 rounded-full bg-white transition-transform duration-200", checked ? "scale-100" : "scale-0")} />
    </span>
  );
}

export function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  badge,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <label
      className={cx(
        "relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition-[border-color,background-color,box-shadow] duration-200",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]",
        checked ? "border-accent bg-accent-soft/60 shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]" : "border-line bg-surface/70 hover:border-line-strong",
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          {title}
          {badge}
        </span>
        {description && <span className="mt-0.5 block text-sm text-ink-2">{description}</span>}
        {children && <span className="mt-3 block">{children}</span>}
      </span>
      <RadioDot checked={checked} />
    </label>
  );
}
