"use client";

import { m } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { circleOf, flow, iconOf, isFailed, loadActivityPage, transferOf, txOf, type ActivityData, type Amount, type Filter, type Range } from "@/components/activity/history-data";
import { MobileHistory } from "@/components/activity/history-mobile";
import { Dropdown, DropdownChevron } from "@/components/ui/dropdown";
import { IconCalendar, IconChevronRight } from "@/components/icons";
import { Stagger, rise } from "@/components/motion";
import { WalletHeader } from "@/components/portfolio/wallet-header";
import { ActivitySkeleton } from "@/components/skeletons/activity-skeleton";
import { EmptyState, ErrorNote } from "@/components/ui/states";
import { activityLine } from "@/lib/activity";
import type { Activity } from "@/lib/api/types";
import { txUrl } from "@/lib/chain";
import { AssetIcon } from "@/components/asset-icon";
import { tokens, usd } from "@/lib/format";
import type { Locale } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

/** Activity as a wallet-style history (MetaMask-like, grouped by date) on desktop, and as a wallet-app list on phones. */
export default function ActivityPage() {
  const { d, locale } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const [range, setRange] = useState<Range>("all");
  const [query, setQuery] = useState("");
  // Pages loaded so far for the current filter, the cursor for the next one, and the request that is allowed to land.
  const [data, setData] = useState<ActivityData | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const group = filter === "all" ? null : filter;

  // A new filter starts again from the newest page; answers to the old filter are dropped.
  useEffect(() => {
    const id = ++latest.current;
    setData(null);
    setNextCursor(null);
    setError(null);
    setLoading(true);
    loadActivityPage({ cursor: null, group, range }, null).then(
      (page) => id === latest.current && (setData(page), setNextCursor(page.nextCursor)),
      (e: unknown) => id === latest.current && setError(e instanceof Error ? e.message : String(e)),
    ).finally(() => id === latest.current && setLoading(false));
  }, [group, range]);

  const loadMore = useCallback(() => {
    if (!data || !nextCursor || loading) return;
    const id = ++latest.current;
    setLoading(true);
    loadActivityPage({ cursor: nextCursor, group, range }, data).then(
      (page) => id === latest.current && (setData(page), setNextCursor(page.nextCursor)),
      (e: unknown) => id === latest.current && setError(e instanceof Error ? e.message : String(e)),
    ).finally(() => id === latest.current && setLoading(false));
  }, [data, nextCursor, loading, group, range]);

  // The sentinel under the list asks for the next page as it scrolls into view (a little before the end).
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && loadMore(), { rootMargin: "240px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  if (!data) return error ? <ErrorNote>{error}</ErrorNote> : <ActivitySkeleton />;

  const ad = d.activity;
  const types = ad.types as Record<string, string>;
  const q = query.trim().toLowerCase();
  // The filter and range are on the server; the search only looks through the pages already loaded.
  const rows = data.list.filter((a) => {
    if (!q) return true;
    const r = a.roundId ? data.rounds.get(a.roundId) : undefined;
    const f = flow(a, r);
    const hay = [activityLine(a, d, locale), String(a.detail.counterparty ?? ""), String(a.detail.tx ?? ""), types[a.kind] ?? "", r?.circle.name ?? "", ...f.out.map((x) => x.symbol), ...f.in.map((x) => x.symbol)].join(" ").toLowerCase();
    return hay.includes(q);
  });

  const tag = locale === "id" ? "id-ID" : "en-US";
  const day = new Intl.DateTimeFormat(tag, { day: "numeric", month: "short", year: "numeric" });
  const full = new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeStyle: "short" });

  return (
    <Stagger>
      <MobileHistory data={data} rows={rows} filter={filter} onFilter={setFilter} range={range} onRange={setRange} />

      <div className="hidden md:block">
      <WalletHeader />

      <m.div variants={rise} className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-3">
          <PillSelect
            icon={<FilterIcon />}
            label={ad.allTypes}
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            options={[{ value: "all", label: ad.allTypes }, ...(["rounds", "circles", "targets", "leftovers", "transfers"] as const).map((k) => ({ value: k, label: ad.filters[k] }))]}
          />
          <PillSelect icon={<IconCalendar size={18} />} label={ad.range.all} value={range} onChange={(v) => setRange(v as Range)} options={(["all", "week", "month"] as const).map((k) => ({ value: k, label: ad.range[k] }))} />
        </div>
        <label className="flex h-12 w-full items-center gap-3 rounded-2xl border border-line px-4 text-ink-3 focus-within:border-line-strong md:w-80">
          <SearchIcon />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ad.search} aria-label={ad.search} className="h-full w-full bg-transparent text-ink outline-none placeholder:text-ink-3" />
        </label>
      </m.div>

      <m.section variants={rise} aria-label={ad.title}>
        {rows.length === 0 ? (
          <EmptyState title={ad.empty} />
        ) : (
          // Like MetaMask: rows grouped under their date, each one icon · what happened · status, amount on the right.
          // Addresses live on the explorer page a row opens, not in the list.
          byDay(rows, day).map(([label, items]) => (
            <div key={label} className="mb-6 last:mb-0">
              <h3 className="mb-2 px-1 text-sm font-semibold text-ink-3">{label}</h3>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
                {items.map((a) => {
                  const r = a.roundId ? data.rounds.get(a.roundId) : undefined;
                  const { Icon, tone, fill } = iconOf(a);
                  const f = flow(a, r);
                  const tr = transferOf(a);
                  const tx = txOf(a, r);
                  const circle = circleOf(a, r);
                  const failed = isFailed(a);
                  const title = tr ? `${types[a.kind] ?? a.kind} ${tr.symbol}` : activityLine(a, d, locale);
                  const lead = tr ? { text: `${tr.sign}${tokens(tr.amount, locale)} ${tr.symbol}`, usd: null } : amountOf(f, locale);
                  const body = (
                    <>
                      <span className="relative shrink-0">
                        {tr?.logo ? <img src={tr.logo} alt="" width={40} height={40} className="rounded-full object-cover" loading="lazy" />
                          : tr ? <AssetIcon symbol={tr.symbol} size={40} />
                          : <span className={cx("grid size-10 place-items-center rounded-full text-white", fill)}><Icon size={18} bold /></span>}
                        {tr && (
                          <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-[var(--app-bg)] bg-surface-2">
                            <Icon size={11} className={tone} />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">{title}</span>
                        <span className="block truncate text-sm">
                          {failed ? <span className="text-danger">{ad.status.failed}</span>
                            : tx ? <span className="text-ok">{ad.status.confirmed}</span>
                            : <span className="text-ink-3">{[types[a.kind], circle].filter(Boolean).join(" · ")}</span>}
                          {tx && circle && <span className="text-ink-3"> · {circle}</span>}
                        </span>
                      </span>
                      {lead && (
                        <span className="shrink-0 text-right">
                          <span className={cx("tabular-nums block font-semibold", failed ? "text-ink-3 line-through" : "text-ink")}>{lead.text}</span>
                          {lead.usd && <span className="tabular-nums block text-sm text-ink-3">{lead.usd}</span>}
                        </span>
                      )}
                      <IconChevronRight size={16} className="shrink-0 text-ink-3" />
                    </>
                  );
                  const row = "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2/60";
                  return (
                    <li key={a.id} title={full.format(new Date(a.createdAt))}>
                      {a.roundId ? <Link href={`/rounds/${a.roundId}`} className={row}>{body}</Link>
                        : tx ? <a href={txUrl(tx)} target="_blank" rel="noreferrer" className={row}>{body}</a>
                        : <div className={row}>{body}</div>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </m.section>
      </div>

      <div ref={sentinel} className="h-px" aria-hidden="true" />
      {loading && <p className="py-4 text-center text-sm text-ink-3">{ad.loadingMore}</p>}
      {error && <ErrorNote>{error}</ErrorNote>}
    </Stagger>
  );

}

/** Rows split under their date label, newest first (the list already arrives in that order). */
function byDay(rows: Activity[], day: Intl.DateTimeFormat): Array<[string, Activity[]]> {
  const groups = new Map<string, Activity[]>();
  for (const a of rows) {
    const label = day.format(new Date(a.createdAt));
    groups.set(label, [...(groups.get(label) ?? []), a]);
  }
  return [...groups];
}

/** The amount a row leads with, as a wallet shows it: what arrived (+), else what left (−), with its USD value. */
function amountOf(f: { out: Amount[]; in: Amount[] }, locale: Locale): { text: string; usd: string | null } | null {
  const [sign, x] = f.in[0] ? ["+", f.in[0]] : f.out[0] ? ["−", f.out[0]] : [null, null];
  if (!x) return null;
  const more = (sign === "+" ? f.in : f.out).length - 1;
  return { text: `${sign}${tokens(x.amountTokens, locale)} ${x.symbol}${more > 0 ? ` +${more}` : ""}`, usd: x.valueUsd ? usd(x.valueUsd, locale) : null };
}

/** A filter that looks like a pill button but is a native select, so keyboard and screen readers just work. */
/** Bordered filter pill that opens the app's dropdown menu. */
function PillSelect({ icon, label, value, options, onChange }: { icon: ReactNode; label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (v: string) => void }) {
  return (
    <Dropdown value={value} options={options} onChange={onChange} label={label} triggerClassName="inline-flex h-12 items-center gap-2.5 rounded-2xl border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 aria-expanded:bg-surface-2">
      {(selected, open) => (
        <>
          <span className="text-ink-2">{icon}</span>
          <span>{selected?.label}</span>
          <DropdownChevron open={open} className="text-ink-2" />
        </>
      )}
    </Dropdown>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M7 12h10M10 17h4" />
    </svg>
  );
}
