"use client";

import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AssetIcon } from "@/components/asset-icon";
import { IconArrowLeft, IconChevronRight, IconExternal } from "@/components/icons";
import { LocaleButton } from "@/components/shell/preferences";
import { Dropdown, DropdownChevron } from "@/components/ui/dropdown";
import type { Activity, RoundView } from "@/lib/api/types";
import { activityGroup, activityLine } from "@/lib/activity";
import { EXPLORER, isTestnet } from "@/lib/chain";
import { short, tokens } from "@/lib/format";
import type { Locale } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";
import { circleOf, flow, iconOf, partiesOf, transferOf, txOf, type ActivityData, type Amount, type Filter, type Party, type Range, type Transfer } from "./history-data";

/**
 * Activity on phones, styled as a wallet app's history: a centred title, two compact filters, then one rounded card of
 * rows (solid icon disc · what happened · amount and date). Tapping a row opens a full-screen detail.
 */
export function MobileHistory({ data, rows, filter, onFilter, range, onRange }: { data: ActivityData; rows: Activity[]; filter: Filter; onFilter: (f: Filter) => void; range: Range; onRange: (r: Range) => void }) {
  const { d, fmt, locale } = useI18n();
  const ad = d.activity;
  const [open, setOpen] = useState<Activity | null>(null);
  const date = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", { day: "numeric", month: "numeric", year: "numeric" });

  return (
    <div className="md:hidden">
      <header className="grid grid-cols-[44px_1fr_44px] items-center pt-2">
        <span />
        <h1 className="text-center text-xl font-bold tracking-tight text-ink">{ad.title}</h1>
        <span className="justify-self-end"><LocaleButton /></span>
      </header>

      <div className="mt-5 flex items-center gap-2">
        <Dropdown
          value={filter}
          onChange={onFilter}
          label={ad.allTypes}
          options={(["all", "rounds", "circles", "targets", "leftovers", "transfers"] as const).map((k) => ({ value: k, label: k === "all" ? ad.allTypes : ad.filters[k] }))}
          triggerClassName="inline-flex h-10 items-center gap-1.5 rounded-full bg-surface-2 pl-4 pr-3 text-sm font-semibold text-ink"
        >
          {(selected, open) => (
            <>
              {filter === "all" ? ad.filters.all : selected?.label}
              <DropdownChevron open={open} className="text-ink-2" />
            </>
          )}
        </Dropdown>
        <Dropdown
          value={range}
          onChange={onRange}
          label={ad.range.all}
          options={(["all", "week", "month"] as const).map((k) => ({ value: k, label: ad.range[k] }))}
          triggerClassName="relative grid size-10 place-items-center rounded-full bg-surface-2 text-ink-2"
        >
          {() => (
            <>
              <SlidersIcon />
              {range !== "all" && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent" aria-hidden="true" />}
            </>
          )}
        </Dropdown>
      </div>

      <section aria-labelledby="history-title" className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="history-title" className="text-lg font-bold tracking-tight text-ink">{ad.mine.title}</h2>
            <p className="text-sm text-ink-3">{ad.mine.sub}</p>
          </div>
          <span className="tabular-nums shrink-0 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-ink-2">{fmt(ad.mine.items, { n: rows.length })}</span>
        </div>

        {rows.length === 0 ? (
          <div className="mt-4 rounded-[24px] bg-surface-2/60 px-6 py-12 text-center">
            <p className="font-semibold text-ink">{ad.empty}</p>
            <p className="mt-1 text-sm text-ink-3">{d.home.noActivity}</p>
            <Link href="/circles" className="mt-4 inline-block text-sm font-semibold text-accent">{d.home.next.circle.cta}</Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[24px] bg-surface-2/60">
            {rows.map((a) => {
              const r = a.roundId ? data.rounds.get(a.roundId) : undefined;
              const { Icon, fill } = iconOf(a.kind);
              const f = flow(a, r);
              const tr = transferOf(a);
              const shown = shownAmount(f, tr, locale);
              const sub = [f.out[0] && f.in[0] ? `${f.out[0].symbol} → ${f.in[0].symbol}` : (f.out[0] ?? f.in[0])?.symbol, circleOf(a, r) ?? ad.filters[activityGroup(a.kind)]].filter(Boolean).join(" · ");
              return (
                <li key={a.id}>
                  <button type="button" onClick={() => setOpen(a)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-surface-3/60">
                    <TokenDisc symbol={shown?.symbol ?? null} logo={tr?.logo ?? null} size={44} fill={fill} Icon={Icon} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{activityLine(a, d)}</span>
                      <span className="block truncate text-sm text-ink-3">{sub}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      {shown && <span className="tabular-nums block text-sm font-semibold text-ink">{shown.text}</span>}
                      <span className="tabular-nums block text-xs text-ink-3">{date.format(new Date(a.createdAt))}</span>
                    </span>
                    <IconChevronRight size={16} className="shrink-0 text-ink-3" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AnimatePresence>{open && <Detail a={open} r={open.roundId ? data.rounds.get(open.roundId) : undefined} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}

/** The one amount a row leads with: what arrived (+), or else what left (−). */
function headline(f: { out: Amount[]; in: Amount[] }): { sign: string; x: Amount } | null {
  if (f.in[0]) return { sign: "+", x: f.in[0] };
  if (f.out[0]) return { sign: "−", x: f.out[0] };
  return null;
}

/** The token and amount a row shows: a transfer's own token, else the round's headline amount. */
function shownAmount(f: { out: Amount[]; in: Amount[] }, tr: Transfer | null, locale: Locale): { symbol: string; text: string } | null {
  if (tr) return { symbol: tr.symbol, text: `${tr.sign}${tokens(tr.amount, locale)} ${tr.symbol}` };
  const h = headline(f);
  return h ? { symbol: h.x.symbol, text: `${h.sign}${tokens(h.x.amountTokens, locale)} ${h.x.symbol}` } : null;
}

/** The token's own logo when the row moves one (a transfer's PancakeSwap logo, or the bStock or USDT artwork); otherwise the kind's disc. */
function TokenDisc({ symbol, logo, size, fill, Icon }: { symbol: string | null; logo: string | null; size: number; fill: string; Icon: ReturnType<typeof iconOf>["Icon"] }) {
  if (logo) return <img src={logo} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" loading="lazy" />;
  if (symbol) return <AssetIcon symbol={symbol} size={size} className="shrink-0" />;
  return (
    <span className={cx("grid shrink-0 place-items-center rounded-full text-white", fill)} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.45)} bold />
    </span>
  );
}

/** A counterparty in the detail: its address opens the explorer, anything else is plain text. */
function PartyLink({ party }: { party: Party }) {
  if (!party.href) return <>{party.label}</>;
  return <a href={party.href} target="_blank" rel="noreferrer" className="tabular-nums text-accent">{short(party.label)}</a>;
}

function Detail({ a, r, onClose }: { a: Activity; r: RoundView | undefined; onClose: () => void }) {
  const { d, locale } = useI18n();
  const ad = d.activity;
  const dd = ad.detail;
  const { Icon, fill } = iconOf(a.kind);
  const f = flow(a, r);
  const tr = transferOf(a);
  const shown = shownAmount(f, tr, locale);
  const parties = partiesOf(a, r, dd.you);
  const tx = txOf(a, r);
  const circle = circleOf(a, r);
  const time = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(a.createdAt));

  // Full-screen sheet: Escape closes it and the page underneath doesn't scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <m.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-detail-title"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 380, damping: 36 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-[var(--app-bg)] px-4 pb-10 pt-[max(16px,env(safe-area-inset-top))] md:hidden"
    >
      <header className="grid grid-cols-[44px_1fr_44px] items-center">
        <button type="button" onClick={onClose} aria-label={dd.back} className="grid size-11 place-items-center rounded-full bg-surface-2 text-ink">
          <IconArrowLeft size={20} />
        </button>
        <h2 className="text-center text-lg font-bold text-ink">{dd.title}</h2>
        <span />
      </header>

      <div className="mt-6 rounded-[28px] bg-surface-2/70 px-5 py-7 text-center">
        <span className="mx-auto block w-fit"><TokenDisc symbol={shown?.symbol ?? null} logo={tr?.logo ?? null} size={64} fill={fill} Icon={Icon} /></span>
        <p className="mt-4 text-sm text-ink-3">{dd.label}</p>
        <p id="activity-detail-title" className="mt-1 text-2xl font-bold tracking-tight text-ink">{activityLine(a, d)}</p>
        <p className="mt-1 text-sm text-ink-3">{[(ad.types as Record<string, string>)[a.kind], circle].filter(Boolean).join(" · ")}</p>
        {shown && <p className="tabular-nums mt-5 text-3xl font-bold tracking-tight text-ink">{shown.text}</p>}
        {f.out[0] && f.in[0] && <p className="tabular-nums mt-1 text-sm text-ink-3">−{tokens(f.out[0].amountTokens, locale)} {f.out[0].symbol}</p>}
      </div>

      <dl className="mt-4 divide-y divide-line overflow-hidden rounded-[24px] bg-surface-2/70 text-sm">
        <Row label={dd.status}>{r ? d.states[r.round.state] : dd.done}</Row>
        <Row label={dd.network}>{isTestnet ? d.network.testnet : d.network.label}</Row>
        {parties.from && <Row label={dd.from}><PartyLink party={parties.from} /></Row>}
        {parties.to && <Row label={dd.to}><PartyLink party={parties.to} /></Row>}
        {tr?.token && <Row label={dd.token}><a href={`${EXPLORER}/token/${tr.token}`} target="_blank" rel="noreferrer" className="tabular-nums text-accent">{short(tr.token)}</a></Row>}
        <Row label={dd.reference}><span className="tabular-nums">{tx ? short(tx) : a.roundId ?? "—"}</span></Row>
        <Row label={dd.time}>{time}</Row>
        {tx ? (
          <a href={`${EXPLORER}/tx/${tx}`} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 px-5 py-4">
            <span className="font-semibold text-ink-2">{dd.viewTx}</span>
            <span className="inline-flex items-center gap-1 font-bold text-accent">{dd.open}<IconExternal size={14} /></span>
          </a>
        ) : a.roundId ? (
          <Link href={`/rounds/${a.roundId}`} className="flex items-center justify-between gap-3 px-5 py-4">
            <span className="font-semibold text-ink-2">{dd.viewRound}</span>
            <span className="inline-flex items-center gap-1 font-bold text-accent">{dd.open}<IconChevronRight size={14} /></span>
          </Link>
        ) : null}
      </dl>
    </m.div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <dt className="text-ink-3">{label}</dt>
      <dd className="text-right font-semibold text-ink">{children}</dd>
    </div>
  );
}

function SlidersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );
}
