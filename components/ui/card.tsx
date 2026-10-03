import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/utils/cx";

/** Panels are frosted glass over the shell's ambient light (see .glass-panel); the tinted tones stay solid enough to read. */
export function Card({ className, tone = "plain", ...rest }: HTMLAttributes<HTMLElement> & { tone?: "plain" | "soft" | "accent" | "match" }) {
  const tones = {
    plain: "glass-panel",
    soft: "border border-[var(--glass-edge)] bg-[color-mix(in_srgb,var(--surface-2)_62%,transparent)] backdrop-blur-xl",
    accent: "bg-accent-soft border border-accent/40",
    match: "bg-match-soft border border-match/30",
  } as const;
  return <section className={cx("rounded-[var(--radius-card)] p-5 sm:p-6", tones[tone], className)} {...rest} />;
}

export function CardHeader({ title, aside, sub, id }: { title: ReactNode; aside?: ReactNode; sub?: ReactNode; id?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 id={id} className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-sm text-ink-3">{sub}</p>}
      </div>
      {aside}
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-ink-2">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** Small icon chip used on stat tiles and list rows: a lit white square with a hairline edge. */
export function IconChip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface/80 text-ink-2 shadow-[inset_0_1px_0_var(--glass-hi)]", className)} aria-hidden="true">{children}</span>;
}

/** KPI tile: icon, label, one big number and an optional chip beside it (e.g. a change or a status). */
export function StatTile({ icon, label, value, chip, className }: { icon: ReactNode; label: ReactNode; value: ReactNode; chip?: ReactNode; className?: string }) {
  return (
    <div className={cx("glass-panel flex min-w-0 flex-col rounded-[24px] p-4 sm:p-5", className)}>
      <IconChip>{icon}</IconChip>
      <p className="mt-4 truncate text-sm text-ink-2">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="truncate text-2xl font-semibold tabular-nums tracking-tight text-ink sm:text-[28px]">{value}</span>
        {chip}
      </div>
    </div>
  );
}
