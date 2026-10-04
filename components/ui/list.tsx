"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { IconArrowLeft, IconCheck, IconChevronRight, IconExternal } from "@/components/icons";
import { cx } from "@/utils/cx";
import { Dropdown, DropdownChevron } from "./dropdown";

/**
 * Settings-style lists, as in wallet apps: a quiet section label, then rows of icon · label · value · chevron.
 * Shared by Settings and the Circle detail so both pages read the same way.
 */

/** Back button · centred title · optional right slot. Back uses history, falling back to `fallback`. */
export function ScreenHeader({ title, fallback = "/home", right }: { title: ReactNode; fallback?: string; right?: ReactNode }) {
  const router = useRouter();
  return (
    <header className="mb-6 grid grid-cols-[44px_1fr_44px] items-center">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
        aria-label="Back"
        className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-surface-2"
      >
        <IconArrowLeft size={22} />
      </button>
      <h1 className="truncate text-center text-lg font-semibold tracking-tight text-ink">{title}</h1>
      <span className="justify-self-end">{right}</span>
    </header>
  );
}

export function ListSection({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("mt-8 first:mt-0", className)}>
      {title && <h2 className="mb-1 px-1 text-sm font-medium text-ink-3">{title}</h2>}
      <ul className="grid grid-cols-1">{children}</ul>
    </section>
  );
}

type RowProps = {
  icon?: ReactNode;
  label: ReactNode;
  sub?: ReactNode;
  value?: ReactNode;
  /** Internal link, external link (opens in a new tab) or button. Without any of them the row is static. */
  href?: string;
  external?: boolean;
  onClick?: () => void;
  /** Replaces the chevron, e.g. a toggle. */
  trailing?: ReactNode;
  tone?: "default" | "danger";
};

export function ListRow({ icon, label, sub, value, href, external, onClick, trailing, tone = "default" }: RowProps) {
  const interactive = !!(href || onClick);
  const body = (
    <>
      {icon && <span className={cx("grid size-7 shrink-0 place-items-center", tone === "danger" ? "text-danger" : "text-ink-2")}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className={cx("block truncate text-base font-medium", tone === "danger" ? "text-danger" : "text-ink")}>{label}</span>
        {sub && <span className="block truncate text-sm text-ink-3">{sub}</span>}
      </span>
      {value !== undefined && <span className="max-w-[50%] shrink-0 truncate text-right text-[15px] text-ink-3">{value}</span>}
      {trailing ?? (interactive ? external ? <IconExternal size={16} className="shrink-0 text-ink-3" /> : <IconChevronRight size={18} className="shrink-0 text-ink-3" /> : null)}
    </>
  );
  const cls = cx("flex min-h-14 w-full items-center gap-3.5 rounded-2xl px-1 py-2 text-left", interactive && "transition-colors hover:bg-surface-2/60 active:bg-surface-2");
  return (
    <li>
      {href ? (
        external ? <a href={href} target="_blank" rel="noreferrer" className={cls}>{body}</a> : <Link href={href} className={cls}>{body}</Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={cls}>{body}</button>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </li>
  );
}

/** A row whose value is picked from a short list: looks like a row, opens the app's dropdown under its value. */
export function SelectRow<T extends string>({ icon, label, value, options, onChange }: { icon?: ReactNode; label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void }) {
  return (
    <li>
      <Dropdown value={value} options={options} onChange={onChange} label={label} align="end" triggerClassName="flex min-h-14 w-full items-center gap-3.5 rounded-2xl px-1 py-2 text-left transition-colors hover:bg-surface-2/60 aria-expanded:bg-surface-2/60">
        {(selected, open) => (
          <>
            {icon && <span className="grid size-7 shrink-0 place-items-center text-ink-2">{icon}</span>}
            <span className="min-w-0 flex-1 truncate text-base font-medium text-ink">{label}</span>
            <span className="shrink-0 text-[15px] text-ink-3">{selected?.label}</span>
            <DropdownChevron open={open} className="text-ink-3" />
          </>
        )}
      </Dropdown>
    </li>
  );
}

/** On/off switch in the accent colour with a check in the knob when on. */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx("relative h-8 w-[52px] shrink-0 rounded-full transition-colors", checked ? "bg-accent" : "bg-surface-3")}
    >
      <span className={cx("absolute top-1 grid size-6 place-items-center rounded-full bg-white shadow transition-[left]", checked ? "left-[24px] text-accent" : "left-1 text-transparent")}>
        <IconCheck size={14} />
      </span>
    </button>
  );
}
