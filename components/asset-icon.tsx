"use client";

import { Icon } from "@iconify/react";
import { BSTOCK_LOGOS } from "@/lib/api/bstocks.generated";
import { cx } from "@/utils/cx";

/**
 * Asset logos. bStocks use the issuer's logo from /assets/<SYMBOL>.png (downloaded by
 * sama-packages/scripts/assets/build-allowlist.mjs). Otherwise Iconify: crypto uses the full-colour `cryptocurrency-color` set;
 * stocks use `simple-icons` marks on a round chip in the brand colour, as in the landing design. Tokenized-stock
 * symbols ("NVDAB") map to their underlying ticker. Unknown symbols fall back to a monogram.
 */
type Spec = { icon: string | null; bg?: string; fg?: string; text?: string };

const CRYPTO: Record<string, Spec> = {
  BNB: { icon: "cryptocurrency-color:bnb" },
  WBNB: { icon: "cryptocurrency-color:bnb" },
  BTC: { icon: "cryptocurrency-color:btc" },
  BTCB: { icon: "cryptocurrency-color:btc" },
  ETH: { icon: "cryptocurrency-color:eth" },
  USDT: { icon: "cryptocurrency-color:usdt" },
  USDC: { icon: "cryptocurrency-color:usdc" },
};

const STOCKS: Record<string, Spec> = {
  NVDA: { icon: "simple-icons:nvidia", bg: "#111", fg: "#76b900" },
  NFLX: { icon: "simple-icons:netflix", bg: "#111", fg: "#e50914" },
  AMZN: { icon: "simple-icons:amazon", bg: "#111", fg: "#fff" },
  TSLA: { icon: "simple-icons:tesla", bg: "#e31937", fg: "#fff" },
  AAPL: { icon: "simple-icons:apple", bg: "#111", fg: "#fff" },
  X: { icon: "simple-icons:x", bg: "#111", fg: "#fff" },
  AMD: { icon: "simple-icons:amd", bg: "#111", fg: "#fff" },
  // Iconify has no TSMC mark; a wordmark chip matches the design.
  TSM: { icon: null, bg: "#e60012", fg: "#fff", text: "tsmc" },
  META: { icon: "simple-icons:meta", bg: "#eef3ff", fg: "#0866ff" },
  GOOGL: { icon: "simple-icons:google", bg: "#fff", fg: "#4285f4" },
  MSFT: { icon: "simple-icons:microsoft", bg: "#fff", fg: "#00a4ef" },
};

function specFor(symbol: string): Spec | null {
  const s = symbol.toUpperCase();
  return CRYPTO[s] ?? STOCKS[s] ?? STOCKS[s.replace(/B$/, "")] ?? null;
}

export function AssetIcon({ symbol, size = 28, className }: { symbol: string; size?: number; className?: string }) {
  // Some issuer PNGs have no alpha channel (white corners), so the round clip is required, not decorative.
  if (BSTOCK_LOGOS.has(symbol)) {
    return (
      <span className={cx("inline-block shrink-0 overflow-hidden rounded-full", className)} style={{ width: size, height: size }} aria-hidden="true">
        <img src={`/assets/${symbol}.png`} width={size} height={size} alt="" className="size-full object-cover" loading="lazy" />
      </span>
    );
  }
  const spec = specFor(symbol);
  if (spec?.icon && !spec.bg) return <Icon icon={spec.icon} width={size} height={size} className={className} aria-hidden="true" />;
  return (
    <span className={cx("inline-grid shrink-0 place-items-center rounded-full", className)} style={{ width: size, height: size, background: spec?.bg ?? "var(--surface-3)", color: spec?.fg ?? "var(--ink-2)" }} aria-hidden="true">
      {spec?.icon ? <Icon icon={spec.icon} width={size * 0.55} height={size * 0.55} /> : <span style={{ fontSize: size * 0.3 }} className="font-bold">{spec?.text ?? symbol.replace(/^t/, "").slice(0, 4)}</span>}
    </span>
  );
}

/**
 * Overlapping asset logos ("token stack"): just the logos, no ring, each in an exactly sized box so they overlap
 * evenly. The leftmost logo sits on top. Logos past `max` fold into a "+N" disc.
 */
export function AssetStack({ symbols, size = 32, max = 3, className }: { symbols: string[]; size?: number; max?: number; className?: string }) {
  const shown = symbols.slice(0, max);
  const extra = symbols.length - shown.length;
  const overlap = Math.round(size * 0.28);
  const disc = (i: number) => ({ width: size, height: size, marginLeft: i === 0 ? 0 : -overlap, zIndex: shown.length + 1 - i });
  return (
    <span className={cx("flex shrink-0 items-center", className)} role="img" aria-label={symbols.join(", ")}>
      {shown.map((s, i) => (
        <span key={s} className="relative grid shrink-0 place-items-center rounded-full" style={disc(i)}>
          <AssetIcon symbol={s} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span className="relative grid shrink-0 place-items-center rounded-full font-semibold text-ink-2" style={{ ...disc(shown.length), zIndex: 0 }}>
          <span className="grid size-full place-items-center rounded-full bg-surface-2" style={{ fontSize: Math.max(10, size * 0.32) }}>+{extra}</span>
        </span>
      )}
    </span>
  );
}
