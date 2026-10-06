"use client";

import { m } from "motion/react";
import { useEffect, useState } from "react";
import { Stagger, rise, spring } from "@/components/motion";
import { TargetEditor } from "@/components/portfolio/target-editor";
import { APPLY_TARGET_EVENT } from "@/components/ai/apply-target";
import { TokenTable, tokenCount } from "@/components/portfolio/token-table";
import { ReceiveModal } from "@/components/wallet/receive-modal";
import { SendTokenModal } from "@/components/wallet/send-token";
import { WrapBnbModal } from "@/components/wallet/wrap-bnb";
import { WalletHeader } from "@/components/portfolio/wallet-header";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { PortfolioSkeleton } from "@/components/skeletons/portfolio-skeleton";
import { ErrorNote } from "@/components/ui/states";
import { sama } from "@/lib/api";
import type { Drift } from "@/lib/api/types";
import { useApi } from "@/lib/api/use-api";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

type Tab = "tokens" | "target";

/** Portfolio in the style of a DEX wallet page: total on top, then a plain token table; the target lives in its own tab. */
export default function PortfolioPage() {
  const { d, fmt, locale } = useI18n();
  const [sending, setSending] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [wrapping, setWrapping] = useState(false);
  // The home tile links here as /portfolio?send=1, so the Send dialog opens straight away.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("send") === "1") setSending(true);
  }, []);
  const { data, error, refresh } = useApi(() => Promise.all([sama.portfolio(), sama.assets()]), []);
  const [tab, setTab] = useState<Tab>("tokens");

  // Home's "Set target" tile links to ?tab=target. Read once on mount so the page needs no Suspense boundary.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "target") setTab("target");
  }, []);

  // The AI assistant's "Apply to my target" opens the Target tab (the editor then picks the weights up itself).
  useEffect(() => {
    const open = () => setTab("target");
    window.addEventListener(APPLY_TARGET_EVENT, open);
    return () => window.removeEventListener(APPLY_TARGET_EVENT, open);
  }, []);

  if (!data) return error ? <ErrorNote>{error}</ErrorNote> : <PortfolioSkeleton />;
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
              <div className="mb-6 flex items-end justify-between gap-4">
                <div className="min-w-0">
                <p className="text-5xl font-semibold tracking-[-0.03em] text-ink">
                  <Money value={portfolio.totalUsd} locale={locale} className="tabular-nums" />
                </p>
                <p className="mt-2 text-sm font-medium text-ink-2">
                  {fmt(d.home.tokensCount, { n: tokenCount(portfolio.positions, drift) })}
                </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {assets.some((a) => a.symbol === "WBNB") && <Button size="lg" variant="ghost" onClick={() => setWrapping(true)}>{d.wrap.open}</Button>}
                  <Button size="lg" variant="ghost" onClick={() => setReceiving(true)}>{d.send.receive.open}</Button>
                  <Button size="lg" onClick={() => setSending(true)}>{d.send.open}</Button>
                </div>
              </div>
              <TokenTable positions={portfolio.positions} totalUsd={portfolio.totalUsd} drift={drift} assets={assets} />
              {sending && <SendTokenModal assets={assets} positions={portfolio.positions} onClose={() => setSending(false)} onSent={() => void refresh()} />}
              {receiving && <ReceiveModal onClose={() => setReceiving(false)} />}
              {wrapping && <WrapBnbModal assets={assets} positions={portfolio.positions} onClose={() => setWrapping(false)} onDone={() => void refresh()} />}
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
