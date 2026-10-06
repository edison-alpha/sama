"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bar, Line, SkeletonRoot } from "@/components/skeletons/parts";
import { EmptyState, ErrorNote } from "@/components/ui/states";
import { useApi } from "@/lib/api/use-api";
import { short, tokens, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { sama } from "@/lib/api";
import type { Trade } from "@/lib/api/types";
import { cx } from "@/utils/cx";

/** Rows shown at first, and added each time the end of the list scrolls into view. */
const PAGE = 25;
/** How often the list asks again (the server shares one answer for 20 s, so this costs nothing per visitor). */
const REFRESH_MS = 30_000;

const SCAN = "https://bscscan.com";

/**
 * Latest trades in the token's pool, from every wallet, newest first. The source returns the last 300 trades of the
 * past 24 hours in one go, so "infinite scroll" reveals them 25 at a time as the list nears its end, and a refresh
 * every 30 s slots new trades in on top without moving what you are reading.
 */
export function Trades({ pool, token, symbol }: { pool: string; token: string; symbol: string }) {
  const { d, fmt, locale } = useI18n();
  const t = d.portfolio.marketPage;
  const { data, error } = useApi(() => sama.marketTrades(token), [pool, token], { pollMs: REFRESH_MS });
  const [shown, setShown] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);
  const total = data?.length ?? 0;

  // A different pool or token starts again from the first page.
  useEffect(() => setShown(PAGE), [pool, token]);

  const more = useCallback(() => setShown((n) => (n < total ? Math.min(total, n + PAGE) : n)), [total]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && more(), { rootMargin: "320px" });
    io.observe(el);
    return () => io.disconnect();
  }, [more, shown, total]);

  const rows = data?.slice(0, shown) ?? [];
  const tag = locale === "id" ? "id-ID" : "en-US";
  const rel = new Intl.RelativeTimeFormat(tag, { numeric: "auto", style: "short" });
  const full = new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeStyle: "medium" });
  const ago = (ms: number) => {
    const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
    return s < 60 ? rel.format(-s, "second") : s < 3600 ? rel.format(-Math.round(s / 60), "minute") : rel.format(-Math.round(s / 3600), "hour");
  };
  const digits = (p: number) => (p < 1 ? 4 : 2);

  return (
    <section className="mt-12" aria-labelledby="trades-title">
      <h2 id="trades-title" className="text-xl font-semibold tracking-tight text-ink">{t.trades}</h2>
      <p className="mt-0.5 text-sm text-ink-3">{t.tradesLead}</p>

      <div className="mt-4">
        {error && !data ? (
          <ErrorNote>{t.tradesFailed}</ErrorNote>
        ) : !data ? (
          <TradesSkeleton />
        ) : total === 0 ? (
          <EmptyState title={t.noTrades} />
        ) : (
          <>
            {/* Phones: one line per trade, type and amount on the left, total on the right. */}
            <ul className="grid divide-y divide-line sm:hidden">
              {rows.map((r) => (
                <li key={r.id}>
                  <a href={`${SCAN}/tx/${r.tx}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        <span className={r.side === "buy" ? "text-ok" : "text-danger"}>{r.side === "buy" ? t.buy : t.sell}</span>{" "}
                        <span className="tabular-nums">{tokens(r.amount, locale)} {symbol}</span>
                      </span>
                      <span className="tabular-nums block truncate text-xs text-ink-3" title={full.format(r.at)}>{ago(r.at)} · {short(r.trader)}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="tabular-nums block text-sm font-semibold text-ink">{usd(r.valueUsd, locale)}</span>
                      <span className="tabular-nums block text-xs text-ink-3">@ {usd(r.priceUsd, locale, digits(r.priceUsd))}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[620px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    {[t.tradeTime, t.tradeType, t.tradeAmount, t.tradePrice, t.tradeTotal, t.tradeTrader].map((h, i) => (
                      <th key={h} scope="col" className={cx("bg-surface-2 px-4 py-3 text-sm font-medium text-ink-3 first:rounded-l-2xl last:rounded-r-2xl", i === 0 || i === 1 ? "text-left" : "text-right")}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => <Row key={r.id} r={r} symbol={symbol} time={ago(r.at)} title={full.format(r.at)} />)}
                </tbody>
              </table>
            </div>

            <div ref={sentinel} className="h-px" aria-hidden="true" />
            {shown < total ? (
              <p className="py-4 text-center text-sm text-ink-3">{t.loadingMore}</p>
            ) : (
              <p className="pt-4 text-xs text-ink-3">{fmt(t.tradesNote, { n: total })}</p>
            )}
          </>
        )}
      </div>
    </section>
  );

  function Row({ r, symbol, time, title }: { r: Trade; symbol: string; time: string; title: string }) {
    return (
      <tr className="[&>td]:border-b [&>td]:border-line last:[&>td]:border-0">
        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-ink-2" title={title}>{time}</td>
        <td className={cx("px-4 py-3.5 text-sm font-semibold", r.side === "buy" ? "text-ok" : "text-danger")}>{r.side === "buy" ? t.buy : t.sell}</td>
        <td className="tabular-nums whitespace-nowrap px-4 py-3.5 text-right text-sm text-ink">{tokens(r.amount, locale)} <span className="text-ink-3">{symbol}</span></td>
        <td className="tabular-nums whitespace-nowrap px-4 py-3.5 text-right text-sm text-ink">{usd(r.priceUsd, locale, digits(r.priceUsd))}</td>
        <td className="tabular-nums whitespace-nowrap px-4 py-3.5 text-right text-sm font-medium text-ink">{usd(r.valueUsd, locale)}</td>
        <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm">
          <a href={`${SCAN}/tx/${r.tx}`} target="_blank" rel="noreferrer" className="tabular-nums text-ink-2 hover:text-ink hover:underline" title={r.trader}>{short(r.trader)}</a>
        </td>
      </tr>
    );
  }
}

/** The list while its first page loads: the same rows (phone list, desktop table) as bars. */
function TradesSkeleton() {
  return (
    <SkeletonRoot>
      <ul className="grid divide-y divide-line sm:hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <span className="min-w-0 flex-1">
              <Line lh={20} h={12} w={`${46 + ((i * 9) % 24)}%`} />
              <Line lh={16} h={9} w="38%" />
            </span>
            <span className="grid justify-items-end">
              <Line lh={20} h={12} w={60} />
              <Line lh={16} h={9} w={48} />
            </span>
          </li>
        ))}
      </ul>
      <div className="hidden sm:block">
        <div className="flex h-11 items-center gap-6 rounded-2xl bg-surface-2 px-4">
          {[40, 36, 52, 44, 44, 48].map((w, i) => <Bar key={i} className="h-3" style={{ width: w }} />)}
        </div>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex h-[53px] items-center gap-6 border-b border-line px-4 last:border-0">
            {[56, 32, 92, 64, 64, 80].map((w, j) => <Bar key={j} className="h-3.5" style={{ width: w }} />)}
          </div>
        ))}
      </div>
    </SkeletonRoot>
  );
}
