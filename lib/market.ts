import type { HistoryPoint, HistoryRange } from "@/lib/api/types";

/**
 * Market data for one token from GeckoTerminal (on-chain PancakeSwap pools), through /api/market, which caches it for everyone.
 * Sama's own prices come from Binance; this is only for the token page: chart, market cap, volume, liquidity.
 */
const BASE = "/api/market";

export type MarketStats = {
  priceUsd: number | null;
  /** Percent change over the last 24 h in the deepest pool. */
  change24h: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  supply: number | null;
  poolAddress: string | null;
  poolName: string | null;
};

type Json = { data?: any; included?: any[] };

const cache = new Map<string, { at: number; value: Promise<unknown> }>();

/** One request per URL per `ttl` in this tab; the server caches across visitors (app/api/market). */
function get<T>(path: string, ttl: number): Promise<T> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < ttl) return hit.value as Promise<T>;
  const value = fetch(BASE + path).then(async (r) => {
    if (r.status === 404) return { data: null } as T;
    if (!r.ok) throw new Error(r.status === 429 ? "Market data is busy, try again in a moment." : `Market data unavailable (${r.status}).`);
    return (await r.json()) as T;
  });
  cache.set(path, { at: Date.now(), value });
  value.catch(() => cache.delete(path));
  return value;
}

const num = (v: unknown): number | null => {
  const n = typeof v === "string" || typeof v === "number" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

export async function fetchMarketStats(address: string): Promise<MarketStats> {
  const [token, pools] = await Promise.all([get<Json>(`/tokens/${address}`, 30_000), get<Json>(`/tokens/${address}/pools?page=1`, 30_000)]);
  const t = token.data?.attributes;
  const pool = (pools.data as any[] | null)?.[0]?.attributes;
  const poolAddress: string | null = pool?.address ?? null;
  return {
    priceUsd: num(t?.price_usd) ?? num(pool?.base_token_price_usd),
    change24h: num(pool?.price_change_percentage?.h24),
    marketCapUsd: num(t?.market_cap_usd),
    fdvUsd: num(t?.fdv_usd),
    volume24hUsd: num(t?.volume_usd?.h24),
    liquidityUsd: num(t?.total_reserve_in_usd),
    supply: num(t?.normalized_total_supply),
    poolAddress,
    poolName: pool?.name ?? null,
  };
}

/** Candle size and count per window, so each range lands on roughly 60–360 points. */
const WINDOW: Record<HistoryRange, { frame: "minute" | "hour" | "day"; aggregate: number; limit: number }> = {
  "1H": { frame: "minute", aggregate: 1, limit: 60 },
  "1D": { frame: "minute", aggregate: 5, limit: 288 },
  "1W": { frame: "hour", aggregate: 1, limit: 168 },
  "1M": { frame: "hour", aggregate: 4, limit: 180 },
  "1Y": { frame: "day", aggregate: 1, limit: 365 },
  ALL: { frame: "day", aggregate: 1, limit: 1000 },
};

/** Closing prices of `token` (not of the pool's base side: USDT/WBNB would otherwise chart USDT) over the window, oldest first. Empty when the pool has no trades in it. */
export async function fetchPriceHistory(pool: string, token: string, range: HistoryRange): Promise<HistoryPoint[]> {
  const w = WINDOW[range];
  const res = await get<Json>(`/pools/${pool}/ohlcv/${w.frame}?aggregate=${w.aggregate}&limit=${w.limit}&currency=usd&token=${token}`, 60_000);
  const rows: number[][] = res.data?.attributes?.ohlcv_list ?? [];
  return rows.map((r) => ({ t: r[0]! * 1000, usd: r[4]! })).sort((a, b) => a.t - b.t);
}

/** $44.0M, $3.3M, $13K: how market pages quote size. */
export function compactUsd(value: number | null, locale: "id" | "en"): string {
  if (value === null) return "—";
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(value);
}
