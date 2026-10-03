import type { ReactNode } from "react";
import { IconAlert } from "@/components/icons";
import { cx } from "@/utils/cx";

/** Every empty or failed state carries a way forward (PRD §19.2 "no dead ends"). */
export function EmptyState({ title, body, action, className }: { title: ReactNode; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-col items-start gap-2 rounded-2xl border border-dashed border-line-strong p-5", className)}>
      <h3 className="font-semibold text-ink">{title}</h3>
      {body && <p className="text-sm text-ink-2">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorNote({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">
      <IconAlert size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1">{children}</div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-sama-pulse rounded-xl bg-surface-2", className)} aria-hidden="true" />;
}

export function PageSkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-40" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
