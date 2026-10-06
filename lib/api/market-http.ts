import type { SamaApi } from "./contract";
import type { HistoryPoint, MarketStats, Trade } from "./types";

/**
 * Token market data, from sama-backend's open /api/market routes (charts, size and trades from on-chain pools, cached on
 * the server). No session is needed, so the same code serves live and mock mode, as /proof does.
 */
const BASE = process.env.NEXT_PUBLIC_SAMA_API_URL ?? "";

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { credentials: "omit" });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? `Market data unavailable (${response.status}).`);
  return data;
}

export const marketApi: Pick<SamaApi, "marketStats" | "marketHistory" | "marketTrades"> = {
  marketStats: (token) => get<MarketStats>(`/api/market/${token}`),
  marketHistory: async (token, range) => (await get<{ points: HistoryPoint[] }>(`/api/market/${token}/history?range=${range}`)).points,
  marketTrades: async (token) => (await get<{ trades: Trade[] }>(`/api/market/${token}/trades`)).trades,
};
