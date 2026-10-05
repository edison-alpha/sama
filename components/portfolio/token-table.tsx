"use client";

import { AssetIcon } from "@/components/asset-icon";
import { Money } from "@/components/ui/money";
import type { Asset, Drift, Position } from "@/lib/api/types";
import { percent, tokens, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

type Row = { symbol: string; name: string | null; amount: number; value: number; price: number | null; pct: number; target: number | null; logo: string | null; priced: boolean };

/** Registry tokens get Sama's logo; any other held token shows the PancakeSwap logo it came with. */
function RowIcon({ row, size }: { row: Row; size: number }) {
  if (row.logo) return <img src={row.logo} width={size} height={size} alt="" className="shrink-0 rounded-full" loading="lazy" />;
  return <AssetIcon symbol={row.symbol} size={size} />;
}

/** Under one point of difference counts as on target, so rounding noise never asks you to trade. */
const ON_TARGET_PCT = 1;

/** Holdings plus any asset the target asks for that the wallet doesn't hold yet (shown with a zero balance). */
function rows(positions: Position[], drift: Drift[] | null, assets: Asset[] | undefined): Row[] {
  const bySymbol = new Map((assets ?? []).map((a) => [a.symbol, a]));
  const targetOf = new Map((drift ?? []).map((r) => [r.symbol, r.targetPct]));
  const held = positions.map((p) => ({
    symbol: p.symbol,
    name: bySymbol.get(p.symbol)?.name ?? null,
    amount: p.amountTokens,
    value: p.valueUsd,
    price: bySymbol.get(p.symbol)?.priceUsd ?? (p.amountTokens > 0 ? p.valueUsd / p.amountTokens : null),
    pct: p.pct,
    target: drift ? (targetOf.get(p.symbol) ?? 0) : null,
    logo: p.logo?.startsWith("https://") ? p.logo : null,
    priced: p.priced !== false,
  }));
  const missing = (drift ?? [])
    .filter((r) => r.targetPct > 0 && !positions.some((p) => p.symbol === r.symbol))
    .map((r) => ({ symbol: r.symbol, name: bySymbol.get(r.symbol)?.name ?? null, amount: 0, value: 0, price: bySymbol.get(r.symbol)?.priceUsd ?? null, pct: 0, target: r.targetPct, logo: null, priced: true }));
  return [...held, ...missing].sort((a, b) => b.value - a.value);
}

/**
 * Token list in the style of a wallet/DEX portfolio: one row per token with balance, value and share of the
 * wallet. When a target is set, the last column says in plain words what it takes to reach it ("Sell $120").
 * `compact` drops the price column for the overview.
 */
export function TokenTable({ positions, totalUsd, drift, assets, compact = false, limit }: { positions: Position[]; totalUsd: number; drift: Drift[] | null; assets?: Asset[]; compact?: boolean; limit?: number }) {
  const { d, fmt, locale } = useI18n();
  const t = d.portfolio.table;
  const all = rows(positions, drift, assets);
  const list = limit ? all.slice(0, limit) : all;
  const hasTarget = drift !== null;
  // Compact (Home overview) drops the allocation column (the share goes under the value) and shows balance only on
  // very wide screens, so the table always fits its column without a horizontal scrollbar.
  const balanceCls = compact ? "hidden 2xl:table-cell" : "hidden sm:table-cell";
  const shareUnderValue = compact ? "" : "md:hidden";
  const th = "bg-surface-2 px-3 sm:px-4 py-3 text-right text-sm font-medium text-ink-3 first:rounded-l-2xl first:text-left last:rounded-r-2xl";

  /** What reaching the target takes for one row, in words: "Sell $120", "Buy $40" or "On target". */
  const todo = (r: Row) => {
    const gap = r.target === null ? 0 : r.target - r.pct;
    if (r.target === null) return null;
    if (Math.abs(gap) < ON_TARGET_PCT) return { text: t.hold, tone: "text-ink-3" };
    return { text: fmt(gap < 0 ? t.sell : t.buy, { amount: usd((Math.abs(gap) / 100) * totalUsd, locale, 0) }), tone: gap < 0 ? "text-danger" : "text-ok" };
  };

  return (
    <>
    {/* Phones: a plain token list like a wallet app, no table header. */}
    <ul className="grid sm:hidden">
      {list.map((r) => {
        const action = todo(r);
        return (
          <li key={r.symbol} className={cx("flex items-center gap-3 py-3", r.amount === 0 && "opacity-60")}>
            <RowIcon row={r} size={44} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold text-ink">{r.name ?? r.symbol}</span>
              <span className="tabular-nums block truncate text-sm text-ink-3">{tokens(r.amount, locale)} {r.symbol} · {percent(r.pct, locale)}</span>
            </span>
            <span className="shrink-0 text-right">
              {r.priced ? <Money value={r.value} locale={locale} className="tabular-nums block text-base font-semibold text-ink" /> : <span className="block text-sm text-ink-3">No price</span>}
              {action ? <span className={cx("block text-sm font-medium", action.tone)}>{action.text}</span> : null}
            </span>
          </li>
        );
      })}
    </ul>
    <div className="hidden overflow-x-auto sm:block">
    <table className="w-full border-separate border-spacing-0">
      <thead>
        <tr>
          <th scope="col" className={th}>{t.token}</th>
          {!compact && <th scope="col" className={cx(th, "hidden md:table-cell")}>{t.price}</th>}
          <th scope="col" className={cx(th, balanceCls)}>{t.balance}</th>
          <th scope="col" className={th}>{t.value}</th>
          {!compact && <th scope="col" className={cx(th, "hidden md:table-cell")}>{t.allocation}</th>}
          {hasTarget && <th scope="col" className={th}>{t.target}</th>}
        </tr>
      </thead>
      <tbody>
        {list.map((r) => {
          const gap = r.target === null ? 0 : r.target - r.pct;
          const tradeUsd = Math.abs(gap / 100) * totalUsd;
          return (
            <tr key={r.symbol} className={cx("[&>td]:border-b [&>td]:border-line last:[&>td]:border-0", r.amount === 0 && "opacity-60")}>
              <td className="w-full max-w-0 px-3 py-4 sm:px-4">
                <span className="flex min-w-0 items-center gap-3">
                  <RowIcon row={r} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{r.name ?? r.symbol}</span>
                    {r.name && <span className="block truncate text-sm text-ink-3">{r.symbol}</span>}
                  </span>
                </span>
              </td>
              {!compact && <td className="tabular-nums hidden px-3 py-4 sm:px-4 text-right text-ink md:table-cell">{r.price === null ? "—" : usd(r.price, locale, r.price < 1 ? 4 : 2)}</td>}
              <td className={cx("tabular-nums whitespace-nowrap px-3 py-4 text-right text-ink sm:px-4", balanceCls)}>{tokens(r.amount, locale)} <span className="text-ink-3">{r.symbol}</span></td>
              <td className="whitespace-nowrap px-3 py-4 text-right sm:px-4">
                {r.priced ? <Money value={r.value} locale={locale} className="tabular-nums whitespace-nowrap font-medium text-ink" /> : <span className="text-sm text-ink-3">No price</span>}
                <span className={cx("tabular-nums block text-sm text-ink-3", shareUnderValue)}>{percent(r.pct, locale)}</span>
              </td>
              {!compact && <td className="hidden whitespace-nowrap px-3 py-4 sm:px-4 md:table-cell">
                <span className="flex items-center justify-end gap-3">
                  <span className="tabular-nums w-14 text-right text-ink">{percent(r.pct, locale)}</span>
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
                    <span className="block h-full rounded-full bg-ink" style={{ width: `${Math.min(100, r.pct)}%` }} />
                  </span>
                </span>
              </td>}
              {hasTarget && (
                <td className="whitespace-nowrap px-3 py-4 text-right sm:px-4">
                  <span className="tabular-nums block text-ink">{percent(r.target ?? 0, locale, 0)}</span>
                  <span className={cx("block whitespace-nowrap text-sm", Math.abs(gap) < ON_TARGET_PCT ? "text-ink-3" : gap < 0 ? "text-danger" : "text-ok")}>
                    {Math.abs(gap) < ON_TARGET_PCT ? t.hold : fmt(gap < 0 ? t.sell : t.buy, { amount: usd(tradeUsd, locale, 0) })}
                  </span>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
    </>
  );
}

/** How many rows the table would show, so headers can say "5 tokens" including target-only assets. */
export function tokenCount(positions: Position[], drift: Drift[] | null): number {
  return rows(positions, drift, undefined).length;
}
