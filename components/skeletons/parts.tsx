import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/utils/cx";

/**
 * Building blocks for page skeletons. Each page skeleton repeats its real page's markup (same wrappers, gaps and
 * breakpoints) with these in place of text and images, so the content replaces it without anything moving.
 */

/** The root of one skeleton: one pulse for the whole tree, announced once to screen readers. */
export function SkeletonRoot({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={cx("animate-sama-pulse", className)}>
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

/** A grey bar. */
export function Bar({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span className={cx("block shrink-0 rounded-md bg-surface-3", className)} style={style} />;
}

/** One line of text: a box as tall as the real line-height (`lh`), with a bar of height `h` centred in it. */
export function Line({ lh, h, w, className }: { lh: number; h?: number; w: number | string; className?: string }) {
  return (
    <span className={cx("flex items-center", className)} style={{ height: lh }}>
      <Bar style={{ height: h ?? Math.round(lh * 0.62), width: w }} />
    </span>
  );
}

/** A circle (avatar, token logo, round button). */
export function Disc({ size, className }: { size: number; className?: string }) {
  return <span className={cx("block shrink-0 rounded-full bg-surface-3", className)} style={{ width: size, height: size }} />;
}

/** A pill (button, filter, badge). */
export function Pill({ w, h, className }: { w: number | string; h: number; className?: string }) {
  return <span className={cx("block shrink-0 rounded-full bg-surface-3", className)} style={{ width: w, height: h }} />;
}

/** Top of the wallet pages (WalletHeader): avatar, short address, copy button. */
export function WalletHeaderSkeleton() {
  return (
    <header className="mb-6 flex items-center gap-4 pt-2 md:mb-8 md:pt-0">
      <div className="flex min-w-0 items-center gap-3">
        <Disc size={48} />
        <Line lh={28} h={18} w={128} />
        <Disc size={32} />
      </div>
    </header>
  );
}

/**
 * The token list (TokenTable): a plain list on phones, a table from `sm`. `compact` is Home's version, which drops the
 * price and allocation columns and shows the balance only on very wide screens.
 */
export function TokenListSkeleton({ rows = 6, compact = false }: { rows?: number; compact?: boolean }) {
  const items = Array.from({ length: rows }, (_, i) => i);
  return (
    <>
      <ul className="grid sm:hidden">
        {items.map((i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <Disc size={44} />
            <span className="min-w-0 flex-1">
              <Line lh={24} h={14} w={`${52 + ((i * 11) % 24)}%`} />
              <Line lh={20} h={11} w={`${34 + ((i * 7) % 18)}%`} />
            </span>
            <span className="grid justify-items-end">
              <Line lh={24} h={14} w={72} />
              <Line lh={20} h={11} w={44} />
            </span>
          </li>
        ))}
      </ul>

      <div className="hidden sm:block">
        <div className="flex h-11 items-center gap-4 rounded-2xl bg-surface-2 px-4">
          <Bar className="h-3 w-14" />
          <span className="flex-1" />
          {!compact && <Col w="w-24" show="hidden md:flex"><Bar className="h-3 w-12" /></Col>}
          <Col w="w-28" show={compact ? "hidden 2xl:flex" : "hidden sm:flex"}><Bar className="h-3 w-14" /></Col>
          <Col w="w-24" show="flex"><Bar className="h-3 w-12" /></Col>
          {!compact && <Col w="w-40" show="hidden md:flex"><Bar className="h-3 w-20" /></Col>}
        </div>
        <ul>
          {items.map((i) => (
            <li key={i} className="flex items-center gap-4 border-b border-line px-4 py-4 last:border-0">
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <Disc size={36} />
                <span className="min-w-0 flex-1">
                  <Line lh={24} h={14} w={`${30 + ((i * 13) % 26)}%`} />
                  <Line lh={20} h={11} w={52} />
                </span>
              </span>
              {!compact && <Col w="w-24" show="hidden md:flex"><Bar className="h-3.5 w-16" /></Col>}
              <Col w="w-28" show={compact ? "hidden 2xl:flex" : "hidden sm:flex"}><Bar className="h-3.5 w-24" /></Col>
              <Col w="w-24" show="flex" className="flex-col items-end">
                <Line lh={24} h={14} w={76} />
                <Line lh={20} h={11} w={40} className={compact ? "" : "md:hidden"} />
              </Col>
              {!compact && (
                <Col w="w-40" show="hidden md:flex" className="gap-3">
                  <Bar className="h-3.5 w-12" />
                  <Bar className="h-1.5 w-16 rounded-full" />
                </Col>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** A right-aligned table column of fixed width, so the header and every row line up. */
function Col({ w, show, className, children }: { w: string; show: string; className?: string; children: ReactNode }) {
  return <span className={cx("shrink-0 items-center justify-end", w, show, className)}>{children}</span>;
}
