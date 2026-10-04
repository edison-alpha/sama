"use client";

import { m } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AssetIcon } from "@/components/asset-icon";
import { GROUP, RANGE_DAYS, circleOf, flow, loadActivity, txOf, type Amount, type Filter, type Range } from "@/components/activity/history-data";
import { MobileHistory } from "@/components/activity/history-mobile";
import { Dropdown, DropdownChevron } from "@/components/ui/dropdown";
import { IconArrowRight, IconCalendar, IconExternal } from "@/components/icons";
import { Stagger, rise } from "@/components/motion";
import { WalletHeader } from "@/components/portfolio/wallet-header";
import { EmptyState, ErrorNote, PageSkeleton } from "@/components/ui/states";
import { useApi } from "@/lib/api/use-api";
import { activityGroup, activityLine } from "@/lib/activity";
import { EXPLORER } from "@/lib/chain";
import { short, tokens, usd } from "@/lib/format";
import type { Locale } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

/** Activity laid out like a DEX history table on desktop (time · type · amount · address), and as a wallet-app history list on phones. */
export default function ActivityPage() {
  const { d, locale } = useI18n();
  const router = useRouter();
  const { data, error } = useApi(loadActivity, []);
  const [filter, setFilter] = useState<Filter>("all");
  const [range, setRange] = useState<Range>("all");
  const [query, setQuery] = useState("");
  if (!data) return error ? <ErrorNote>{error}</ErrorNote> : <PageSkeleton />;

  const ad = d.activity;
  const types = ad.types as Record<string, string>;
  const days = RANGE_DAYS[range];
  const since = days ? Date.now() - days * 86_400_000 : 0;
  const q = query.trim().toLowerCase();
  const rows = data.list.filter((a) => {
    if (filter !== "all" && activityGroup(a.kind) !== filter) return false;
    if (new Date(a.createdAt).getTime() < since) return false;
    if (!q) return true;
    const r = a.roundId ? data.rounds.get(a.roundId) : undefined;
    const f = flow(a, r);
    const hay = [activityLine(a, d), types[a.kind] ?? "", r?.circle.name ?? "", ...f.out.map((x) => x.symbol), ...f.in.map((x) => x.symbol)].join(" ").toLowerCase();
    return hay.includes(q);
  });

  const tag = locale === "id" ? "id-ID" : "en-US";
  const day = new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" });
  const full = new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeStyle: "short" });
  const th = "bg-surface-2 px-4 py-3.5 text-left text-sm font-medium text-ink-3 first:rounded-l-2xl last:rounded-r-2xl";

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
            options={[{ value: "all", label: ad.allTypes }, ...(["rounds", "circles", "targets", "leftovers"] as const).map((k) => ({ value: k, label: ad.filters[k] }))]}
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th scope="col" className={cx(th, "w-28")}>{ad.table.time}</th>
                  <th scope="col" className={cx(th, "w-44")}>{ad.table.type}</th>
                  <th scope="col" className={th}>{ad.table.amount}</th>
                  <th scope="col" className={cx(th, "w-56")}>{ad.table.address}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const group = activityGroup(a.kind);
                  const { Icon, tone } = GROUP[group];
                  const r = a.roundId ? data.rounds.get(a.roundId) : undefined;
                  const f = flow(a, r);
                  const at = new Date(a.createdAt);
                  const tx = txOf(a, r);
                  const circle = circleOf(a, r);
                  const open = a.roundId ? () => router.push(`/rounds/${a.roundId}`) : undefined;
                  return (
                    <tr key={a.id} onClick={open} className={cx("[&>td]:border-b [&>td]:border-line last:[&>td]:border-0", open && "cursor-pointer transition-colors hover:bg-surface-2/60")}>
                      <td className="px-4 py-4 text-sm font-medium text-ink-2" title={full.format(at)}>{day.format(at)}</td>
                      <td className="px-4 py-4">
                        <span className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                          <Icon size={18} className={tone} />
                          {types[a.kind] ?? a.kind}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {f.out.length || f.in.length ? (
                          <span className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
                            <TokenAmounts items={f.out} locale={locale} />
                            {f.out.length > 0 && f.in.length > 0 ? <IconArrowRight size={18} className="text-ink-3" /> : <span />}
                            <TokenAmounts items={f.in} locale={locale} />
                          </span>
                        ) : (
                          <span className="text-sm text-ink-2">{activityLine(a, d)}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {tx ? (
                          <>
                            <span className="block text-xs text-ink-3">{ad.addr.tx}</span>
                            <a href={`${EXPLORER}/tx/${tx}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="tabular-nums inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline">
                              {short(tx)}
                              <IconExternal size={14} className="text-ink-3" />
                            </a>
                          </>
                        ) : circle ? (
                          <>
                            <span className="block text-xs text-ink-3">{ad.addr.circle}</span>
                            {a.roundId ? (
                              <Link href={`/rounds/${a.roundId}`} onClick={(e) => e.stopPropagation()} className="block truncate text-sm font-semibold text-ink hover:underline">{circle}</Link>
                            ) : (
                              <span className="block truncate text-sm font-semibold text-ink">{circle}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-ink-3">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </m.section>
      </div>
    </Stagger>
  );

}

/** First token with its USD value under it; extra tokens in the same direction collapse into "+N". */
function TokenAmounts({ items, locale }: { items: Amount[]; locale: Locale }) {
  const first = items[0];
  if (!first) return <span />;
  return (
    <span className="flex min-w-0 items-center gap-3">
      <AssetIcon symbol={first.symbol} size={36} />
      <span className="min-w-0">
        <span className="tabular-nums block truncate text-sm font-semibold text-ink">
          {tokens(first.amountTokens, locale)} {first.symbol}
          {items.length > 1 && <span className="ml-1.5 text-ink-3">+{items.length - 1}</span>}
        </span>
        <span className="tabular-nums block text-sm text-ink-3">{usd(first.valueUsd, locale)}</span>
      </span>
    </span>
  );
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
