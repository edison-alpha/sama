"use client";

import { m } from "motion/react";
import { useEffect, useState } from "react";
import { Stagger, rise, spring } from "@/components/motion";
import { TargetEditor } from "@/components/portfolio/target-editor";
import { TokenTable, tokenCount } from "@/components/portfolio/token-table";
import { WalletHeader } from "@/components/portfolio/wallet-header";
import { Money } from "@/components/ui/money";
import { ErrorNote, PageSkeleton } from "@/components/ui/states";
import { sama } from "@/lib/api";
import type { Drift } from "@/lib/api/types";
import { useApi } from "@/lib/api/use-api";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

type Tab = "tokens" | "target";

/** Portfolio in the style of a DEX wallet page: total on top, then a plain token table; the target lives in its own tab. */
export default function PortfolioPage() {
  const { d, fmt, locale } = useI18n();
  const { data, error, refresh } = useApi(() => Promise.all([sama.portfolio(), sama.assets()]), []);
  const [tab, setTab] = useState<Tab>("tokens");

  // Home's "Set target" tile links to ?tab=target. Read once on mount so the page needs no Suspense boundary.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "target") setTab("target");
  }, []);

  if (!data) return error ? <ErrorNote>{error}</ErrorNote> : <PageSkeleton />;
  const [{ portfolio, target }, assets] = data;

  // Same shape as Home's drift, built from the saved target, so the table can say what each token needs.
  const drift: Drift[] | null =
    target && portfolio.ok
      ? Object.entries(target.weights).map(([symbol, targetPct]) => ({ symbol, targetPct, currentPct: portfolio.positions.find((p) => p.symbol === symbol)?.pct ?? 0 }))
      : null;

  return (
    <Stagger>
      <WalletHeader />

      <m.nav variants={rise} aria-label={d.portfolio.title} className="mb-8 flex gap-6 border-b border-line">
        {(["tokens", "target"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-current={tab === k ? "page" : undefined}
            onClick={() => setTab(k)}
            className={cx("relative pb-3 text-lg font-medium transition-colors", tab === k ? "text-ink" : "text-ink-3 hover:text-ink")}
          >
            {d.portfolio.tabs[k]}
            {tab === k && <m.span layoutId="portfolio-tab" transition={spring} className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-ink" aria-hidden="true" />}
          </button>
        ))}
      </m.nav>

      {tab === "tokens" ? (
        <m.section variants={rise} aria-label={d.portfolio.tabs.tokens}>
          {!portfolio.ok ? (
            <ErrorNote>{d.portfolio.readError} {portfolio.detail}</ErrorNote>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-5xl font-semibold tracking-[-0.03em] text-ink">
                  <Money value={portfolio.totalUsd} locale={locale} className="tabular-nums" />
                </p>
                <p className="mt-2 text-sm font-medium text-ink-2">
                  {fmt(d.home.tokensCount, { n: tokenCount(portfolio.positions, drift) })}
                  <span className="mx-2 text-ink-3" aria-hidden="true">•</span>
                  <span className="text-ink-3">{fmt(d.portfolio.subtitle, { time: new Date(portfolio.readAt).toLocaleTimeString(locale) })}</span>
                </p>
              </div>
              <TokenTable positions={portfolio.positions} totalUsd={portfolio.totalUsd} drift={drift} assets={assets} />
              {assets.some((a) => a.disclosure && portfolio.positions.some((p) => p.symbol === a.symbol)) && (
                <p className="mt-4 text-xs text-ink-3">{assets.find((a) => a.disclosure && portfolio.positions.some((p) => p.symbol === a.symbol))?.disclosure}</p>
              )}
            </>
          )}
        </m.section>
      ) : (
        <m.section variants={rise} aria-label={d.portfolio.tabs.target}>
          <TargetEditor assets={assets} portfolio={portfolio} target={target} onSaved={() => void refresh()} />
        </m.section>
      )}
    </Stagger>
  );
}
