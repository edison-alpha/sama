"use client";

import { AssetIcon } from "@/components/asset-icon";
import { IconLayers, IconPie, IconShield, IconWallet } from "@/components/icons";
import { colorFor } from "@/components/portfolio/allocation-donut";
import { HoldingsRing } from "@/components/portfolio/holdings-ring";
import { TargetEditor } from "@/components/portfolio/target-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, PageHeader, StatTile } from "@/components/ui/card";
import { MixBar } from "@/components/ui/mix-bar";
import { ErrorNote, PageSkeleton } from "@/components/ui/states";
import { sama } from "@/lib/api";
import type { AssetClass } from "@/lib/api/types";
import { useApi } from "@/lib/api/use-api";
import { percent, tokens, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { Stagger } from "@/components/motion";

const CLASS_COLOR: Record<AssetClass, string> = { CRYPTO: "#f0b90b", STABLE: "var(--ok)", RWA: "var(--accent)" };

export default function PortfolioPage() {
  const { d, fmt, locale } = useI18n();
  const { data, error } = useApi(() => Promise.all([sama.portfolio(), sama.assets()]), []);
  if (!data) return error ? <ErrorNote>{error}</ErrorNote> : <PageSkeleton />;
  const [{ portfolio, target }, assets] = data;
  const bySymbol = new Map(assets.map((a) => [a.symbol, a]));
  const s = d.portfolio.stats;

  const positions = portfolio.ok ? [...portfolio.positions].sort((a, b) => b.valueUsd - a.valueUsd) : [];
  const order = positions.filter((p) => p.pct > 0).map((p) => p.symbol);
  const largest = positions[0];
  const byClass = (c: AssetClass) => positions.filter((p) => bySymbol.get(p.symbol)?.class === c).reduce((sum, p) => sum + p.pct, 0);

  return (
    <Stagger>
      <PageHeader title={d.portfolio.title} sub={portfolio.ok ? fmt(d.portfolio.subtitle, { time: new Date(portfolio.readAt).toLocaleTimeString(locale) }) : undefined} />

      {portfolio.ok && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile icon={<IconWallet size={18} />} label={s.total} value={usd(portfolio.totalUsd, locale)} />
          <StatTile icon={<IconLayers size={18} />} label={s.assets} value={positions.length} />
          <StatTile icon={<IconPie size={18} />} label={s.largest} value={largest?.symbol ?? "—"} chip={largest ? <Badge tone="accent">{percent(largest.pct, locale, 0)}</Badge> : null} />
          <StatTile icon={<IconShield size={18} />} label={s.stable} value={percent(byClass("STABLE"), locale)} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="grid content-start gap-6">
          {!portfolio.ok ? (
            <Card>
              <CardHeader title={d.portfolio.holdings} />
              <ErrorNote>{d.portfolio.readError} {portfolio.detail}</ErrorNote>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader title={d.portfolio.allocation} />
                <HoldingsRing
                  positions={positions}
                  label={d.portfolio.allocation}
                  center={
                    <>
                      <span className="num block text-lg font-semibold tracking-tight text-ink">{usd(portfolio.totalUsd, locale, 0)}</span>
                      <span className="block text-xs text-ink-3">{d.portfolio.total}</span>
                    </>
                  }
                />
                <div className="mt-6 border-t border-line pt-5">
                  <h3 className="mb-3 text-sm font-semibold text-ink">{d.portfolio.mix}</h3>
                  <MixBar
                    label={d.portfolio.mix}
                    parts={(["CRYPTO", "STABLE", "RWA"] as const).map((c) => ({ key: c, label: d.portfolio.classes[c], value: byClass(c), color: CLASS_COLOR[c], detail: percent(byClass(c), locale, 0) }))}
                  />
                </div>
              </Card>

              <Card>
                <CardHeader title={d.portfolio.holdings} />
                <ul className="grid grid-cols-1 gap-1">
                  {positions.map((p) => {
                    const asset = bySymbol.get(p.symbol);
                    return (
                      <li key={p.symbol} className="-mx-2 rounded-2xl px-2 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-3">
                            <AssetIcon symbol={p.symbol} size={36} />
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="font-medium">{p.symbol}</span>
                                {asset && <Badge tone={asset.class === "RWA" ? "accent" : asset.class === "STABLE" ? "ok" : "neutral"}>{d.portfolio.classes[asset.class]}</Badge>}
                              </span>
                              <span className="num block truncate text-xs text-ink-3">{tokens(p.amountTokens, locale)} {p.symbol}</span>
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="num block">{usd(p.valueUsd, locale)}</span>
                            <span className="num text-xs text-ink-3">{percent(p.pct, locale)}</span>
                          </span>
                        </div>
                        <span className="mt-2.5 ml-12 block h-1.5 overflow-hidden rounded-full bg-[var(--heat-0)]" aria-hidden="true">
                          <span className="block h-full rounded-full" style={{ width: `${Math.min(100, p.pct)}%`, background: colorFor(p.symbol, order) }} />
                        </span>
                        {asset?.disclosure && <p className="mt-2 ml-12 text-xs text-ink-3">{asset.disclosure}</p>}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </>
          )}
        </div>
        <Card className="self-start">
          <CardHeader title={d.portfolio.target} />
          <TargetEditor assets={assets} portfolio={portfolio} target={target} />
        </Card>
      </div>
    </Stagger>
  );
}
