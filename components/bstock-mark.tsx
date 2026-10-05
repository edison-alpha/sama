import { BSTOCK_LOGOS } from "@/lib/api/bstocks.generated";

/** True for tokens from the bStocks allowlist, so UI can tell them apart from other assets. */
export function isBStock(symbol: string): boolean {
  return BSTOCK_LOGOS.has(symbol);
}

/** The bStock wordmark (public/bstock.png) as a small badge, shown next to bStock tokens. */
export function BStockMark({ height = 10, className }: { height?: number; className?: string }) {
  return <img src="/bstock.png" alt="bStock" height={height} className={`w-auto shrink-0 opacity-80 ${className ?? ""}`} style={{ height }} />;
}
