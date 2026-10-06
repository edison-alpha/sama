"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { AssetIcon } from "@/components/asset-icon";
import { sama } from "@/lib/api";
import type { Asset, HistoryPoint } from "@/lib/api/types";
import { useApi } from "@/lib/api/use-api";
import { percent, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { fetchMarketStats, fetchPriceHistory } from "@/lib/market";
import { cx } from "@/utils/cx";

let assetsOnce: Promise<Asset[]> | undefined;
const assetList = () => (assetsOnce ??= sama.assets().catch((e) => { assetsOnce = undefined; throw e; }));

/** Today's price path as a line over a soft fill, scaled to its own range. */
function Spark({ points, up }: { points: HistoryPoint[]; up: boolean }) {
  const W = 160;
  const H = 44;
  const gradient = useId();
  const { line, area } = useMemo(() => {
    const lo = Math.min(...points.map((p) => p.usd));
    const hi = Math.max(...points.map((p) => p.usd));
    const t0 = points[0]!.t;
    const span = points[points.length - 1]!.t - t0 || 1;
    const xy = points.map((p) => `${(((p.t - t0) / span) * W).toFixed(1)},${(H - 3 - ((p.usd - lo) / (hi - lo || 1)) * (H - 6)).toFixed(1)}`);
    const line = `M${xy.join("L")}`;
    return { line, area: `${line}L${W},${H}L0,${H}Z` };
  }, [points]);
  const color = up ? "var(--ok)" : "var(--danger)";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-11 w-full" aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradient})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * A token as a compact card with its real 24-hour chart, like a link preview on X: logo, name, price and change on
 * the left, the sparkline on the right. The whole card opens the token's market page. Shows the price alone when the
 * token has no on-chain market to chart.
 */
export function TokenCard({ symbol, name, priceUsd, onNavigate, className }: { symbol: string; name?: string; priceUsd?: number; onNavigate?: () => void; className?: string }) {
  const { locale } = useI18n();
  const { data } = useApi(async () => {
    const asset = (await assetList()).find((a) => a.symbol === symbol);
    if (!asset) return null;
    const stats = await fetchMarketStats(asset.address);
    const points = stats.poolAddress ? await fetchPriceHistory(stats.poolAddress, asset.address, "1D") : [];
    return { asset, stats, points };
  }, [symbol]);

  const points = data?.points ?? [];
  const price = data?.stats.priceUsd ?? priceUsd ?? data?.asset.priceUsd ?? 0;
  const first = points[0]?.usd ?? 0;
  const change = points.length > 1 && first > 0 ? ((points[points.length - 1]!.usd - first) / first) * 100 : null;
  const up = (change ?? 0) >= 0;

  return (
    <Link
      href={`/markets/${symbol}`}
      onClick={onNavigate}
      className={cx("group flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface px-3.5 py-3 transition-colors hover:bg-surface-2", className)}
    >
      <AssetIcon symbol={symbol} size={36} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{name ?? data?.asset.name ?? symbol}</span>
        <span className="flex flex-wrap items-baseline gap-x-1.5 text-xs">
          <span className="text-ink-3">{symbol}</span>
          <span className="tabular-nums font-semibold text-ink">{price > 0 ? usd(price, locale, price < 1 ? 4 : 2) : "—"}</span>
          {change !== null && <span className={cx("tabular-nums font-medium", up ? "text-ok" : "text-danger")}>{up ? "+" : "−"}{percent(Math.abs(change), locale, 2)}</span>}
        </span>
      </span>
      <span className="w-[38%] max-w-40 shrink-0">
        {points.length > 1 ? <Spark points={points} up={up} /> : data ? null : <span className="animate-sama-pulse block h-8 rounded-lg bg-surface-3" aria-hidden="true" />}
      </span>
    </Link>
  );
}
