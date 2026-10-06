"use client";

import { m } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Stagger, rise, spring } from "@/components/motion";
import { AssetIcon } from "@/components/asset-icon";
import { IconArrowLeft } from "@/components/icons";
import { Plot } from "@/components/portfolio/value-chart";
import { ChartSkeleton } from "@/components/market/chart-skeleton";
import { Trades } from "@/components/market/trades";
import { EmptyState, ErrorNote, PageSkeleton, Skeleton } from "@/components/ui/states";
import { sama } from "@/lib/api";
import type { HistoryRange } from "@/lib/api/types";
import { useApi } from "@/lib/api/use-api";
import { percent, short, tokens, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { compactUsd } from "@/lib/market";
import { cx } from "@/utils/cx";

const RANGES: HistoryRange[] = ["1H", "1D", "1W", "1M", "1Y", "ALL"];

/** One token's market page in the style of a DEX: price and change over the chosen window, a real chart, and the numbers under it. */
export default function MarketPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const { d, fmt, locale } = useI18n();
  const c = d.home.chart;
  const t = d.portfolio.marketPage;
  const [range, setRange] = useState<HistoryRange>("1D");
  const [hover, setHover] = useState<number | null>(null);

  const { data: assets, error: assetsError } = useApi(() => sama.assets(), []);
  const wanted = decodeURIComponent(symbol).toUpperCase();
  const asset = assets?.find((a) => a.symbol === (wanted === "BNB" ? "WBNB" : wanted));

  // Not blocking: the page renders at once and the balance fills in when the wallet has been read.
  const { data: wallet } = useApi(() => sama.portfolio(), []);
  const { data: stats, error: statsError } = useApi(() => (asset ? sama.marketStats(asset.address) : Promise.resolve(null)), [asset?.address]);
  const pool = stats?.poolAddress ?? null;
  // The result carries the pool it belongs to: before the pool is known the first load resolves to [], and without the tag
  // that empty list would flash as "no chart" in the render between "stats arrived" and "history requested".
  const { data: loaded, error: historyError } = useApi(async () => ({ pool, points: pool ? await sama.marketHistory(asset!.address, range) : [] }), [pool, asset?.address, range]);
  // A new range keeps the previous line on screen until its own data lands, so switching windows never blanks the plot.
  const history = loaded && loaded.pool === pool ? loaded.points : null;

  if (!assets) return assetsError ? <ErrorNote>{assetsError}</ErrorNote> : <PageSkeleton />;
  if (!asset) return <EmptyState title={t.unknown} action={<Link href="/portfolio" className="text-sm font-medium text-ink underline">{t.back}</Link>} />;

  const points = history ?? [];
  const live = stats?.priceUsd ?? asset.priceUsd;
  const shown = hover !== null ? points[hover] : null;
  const first = points[0]?.usd ?? live;
  const price = shown?.usd ?? live;
  const change = price - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  const up = change >= 0;

  const compact = (n: number) => new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
  const rows: Array<[string, string]> = [
    [t.mcap, compactUsd(stats?.marketCapUsd ?? stats?.fdvUsd ?? null, locale)],
    [t.fdv, compactUsd(stats?.fdvUsd ?? null, locale)],
    [t.volume, compactUsd(stats?.volume24hUsd ?? null, locale)],
    [t.liquidity, compactUsd(stats?.liquidityUsd ?? null, locale)],
    [t.supply, stats?.supply == null ? "—" : compact(stats.supply)],
  ];

  return (
    <Stagger>
      <m.div variants={rise}>
        <Link href="/portfolio" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 transition-colors hover:text-ink">
          <IconArrowLeft size={16} /> {t.back}
        </Link>
      </m.div>

      <m.header variants={rise} className="flex items-center gap-3">
        <AssetIcon symbol={asset.symbol} size={44} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-ink sm:text-2xl">{asset.name}</h1>
          <p className="text-sm text-ink-3">{asset.symbol} · {d.portfolio.classes[asset.class]}{asset.tier ? ` · ${fmt(t.tier, { tier: asset.tier })}` : ""}</p>
        </div>
        <Balance symbol={asset.symbol} wallet={wallet} label={t.balance} />
      </m.header>

      <m.section variants={rise} className="mt-6 min-w-0" aria-label={asset.name}>
        <p className="tabular-nums text-[44px] font-semibold leading-none tracking-[-0.03em] text-ink sm:text-6xl">{usd(price, locale, price < 1 ? 4 : 2)}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-sm font-medium sm:text-base">
          {points.length > 1 ? (
            <>
              <span className={cx("inline-flex items-center gap-1", up ? "text-ok" : "text-danger")}>
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={up ? "" : "rotate-180"}><path d="M5 1.5 9 8.5H1Z" fill="currentColor" /></svg>
                <span className="tabular-nums">{percent(Math.abs(changePct), locale, 2)}</span>
              </span>
              <span className="text-ink-3">{c.period[range]}</span>
            </>
          ) : (
            <span className="text-ink-3">&nbsp;</span>
          )}
        </p>

        <div className="mt-6">
          {statsError || historyError ? (
            <ErrorNote>{statsError ?? historyError ?? t.loadFailed}</ErrorNote>
          ) : !stats || (pool && !history) ? (
            <ChartSkeleton />
          ) : !pool ? (
            <EmptyState title={t.noPool} />
          ) : points.length > 1 ? (
            <Plot points={points} up={up} hover={hover} onHover={setHover} range={range} label={`${asset.symbol}, ${c.period[range]}`} />
          ) : (
            <EmptyState title={c.empty} />
          )}
        </div>

        <div role="radiogroup" aria-label={asset.symbol} className="mt-4 inline-flex rounded-full border border-line p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={r === range}
              onClick={() => { setRange(r); setHover(null); }}
              className={cx("relative h-8 min-w-10 rounded-full px-2.5 text-sm font-semibold transition-colors sm:min-w-11 sm:px-3", r === range ? "text-ink" : "text-ink-3 hover:text-ink")}
            >
              {r === range && <m.span layoutId="market-range" transition={spring} className="absolute inset-0 rounded-full bg-surface-3" aria-hidden="true" />}
              <span className="relative">{c.ranges[r]}</span>
            </button>
          ))}
        </div>
      </m.section>

      <m.section variants={rise} className="mt-10" aria-label={t.about}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-ink-3">{label}</dt>
              <dd className="tabular-nums mt-1 text-lg font-semibold text-ink">{stats ? value : <Skeleton className="h-6 w-20" />}</dd>
            </div>
          ))}
        </dl>

        <dl className="mt-8 grid gap-3 border-t border-line pt-5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-3">{t.contract}</dt>
            <dd><a href={`https://bscscan.com/token/${asset.address}`} target="_blank" rel="noreferrer" className="tabular-nums font-medium text-ink underline decoration-line-strong underline-offset-4">{short(asset.address)}</a></dd>
          </div>
          {stats?.poolName && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-3">{t.pool}</dt>
              <dd className="font-medium text-ink">{stats.poolName}</dd>
            </div>
          )}
        </dl>
        <p className="mt-5 text-xs text-ink-3">{t.source}</p>
      </m.section>

      {pool && <Trades pool={pool} token={asset.address} symbol={asset.symbol} />}
    </Stagger>
  );
}

/** The wallet's balance of this token, top right: amount and value. For WBNB the BNB in the wallet is listed too. */
function Balance({ symbol, wallet, label }: { symbol: string; wallet: Awaited<ReturnType<typeof sama.portfolio>> | null; label: string }) {
  const { locale } = useI18n();
  if (!wallet) return <div className="shrink-0 text-right" aria-hidden="true"><Skeleton className="ml-auto h-3.5 w-16" /><Skeleton className="ml-auto mt-2 h-5 w-24" /></div>;
  if (!wallet.portfolio.ok) return null;
  const find = (s: string) => wallet.portfolio.ok ? wallet.portfolio.positions.find((p) => p.symbol === s) : undefined;
  const main = find(symbol);
  const native = symbol === "WBNB" ? find("BNB") : undefined;
  const amount = main?.amountTokens ?? 0;
  const value = (main?.valueUsd ?? 0) + (native?.valueUsd ?? 0);
  return (
    <div className="shrink-0 text-right">
      <p className="text-xs text-ink-3 sm:text-sm">{label}</p>
      <p className="tabular-nums text-base font-semibold text-ink sm:text-lg">{usd(value, locale)}</p>
      <p className="tabular-nums text-xs text-ink-3 sm:text-sm">
        {tokens(amount, locale)} {symbol}
        {native && native.amountTokens > 0 ? ` + ${tokens(native.amountTokens, locale)} BNB` : ""}
      </p>
    </div>
  );
}
