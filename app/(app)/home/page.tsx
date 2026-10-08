"use client";

import { m } from "motion/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

const TOKENS_PER_PAGE = 20;
import { ActivityRow } from "@/components/activity/activity-row";
import { NextStepCard } from "@/components/home/next-step-card";
import { IconAddFill, IconArrowRight, IconGroupFill, IconPlayFill, IconSend, IconSwap, IconTargetFill } from "@/components/icons";
import { docsUrl } from "@/lib/site";
import { cx } from "@/utils/cx";
import { Stagger, rise } from "@/components/motion";
import { TokenTable, tokenCount } from "@/components/portfolio/token-table";
import { ValueChart } from "@/components/portfolio/value-chart";
import { WalletHeader } from "@/components/portfolio/wallet-header";
import { Badge, stateTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { IconChip } from "@/components/ui/card";
import { HomeSkeleton } from "@/components/skeletons/home-skeleton";
import { EmptyState, ErrorNote } from "@/components/ui/states";
import { sama } from "@/lib/api";
import { useApi } from "@/lib/api/use-api";
import { percent } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

/**
 * Home is the wallet overview, laid out like a DEX portfolio page: total value and quick actions on top, the one
 * next step under it, then tokens on the left and rounds + recent activity on the right.
 */
export default function HomePage() {
  const { d, fmt, locale } = useI18n();
  const { data: h, error, refresh } = useApi(() => sama.home(), [], { pollMs: 4_000 });
  const { data: assets } = useApi(() => sama.assets(), []);
  // Home shows 20 tokens; "Show more" adds 20 at a time, only while there are more to show.
  const [tokenLimit, setTokenLimit] = useState(TOKENS_PER_PAGE);

  if (!h) return error ? <ErrorNote action={<button className="underline" onClick={() => void refresh()}>{d.common.retry}</button>}>{error}</ErrorNote> : <HomeSkeleton />;

  const drift = h.target ? h.drift : null;
  const offTarget = h.totalDriftPct > 2;
  const weekAgo = Date.now() - 7 * 86_400_000;
  const lastWeek = h.activity.filter((x) => new Date(x.createdAt).getTime() >= weekAgo).length;
  const day = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short" });
  const count = h.portfolio.ok ? fmt(d.home.tokensCount, { n: tokenCount(h.portfolio.positions, drift) }) : undefined;
  const a = d.home.actions;

  return (
    <Stagger>
      <WalletHeader />

      <m.section variants={rise} className="grid gap-6 sm:gap-8 xl:grid-cols-[1fr_340px]">
        {h.portfolio.ok ? (
          <ValueChart
            live={h.portfolio.totalUsd}
            below={
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                {h.target ? (
                  <span className={offTarget ? "text-accent" : "text-ok"}>
                    {offTarget ? fmt(d.home.offTarget, { pct: percent(h.totalDriftPct, locale) }) : d.home.onTarget}
                  </span>
                ) : (
                  <span className="text-ink-3">{d.home.stats.noTarget}</span>
                )}
                <span className="text-ink-3" aria-hidden="true">•</span>
                <span className="text-ink-2">{count}</span>
              </p>
            }
          />
        ) : (
          <ErrorNote>{d.portfolio.readError} {h.portfolio.detail}</ErrorNote>
        )}

        <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible xl:mt-36 xl:grid-cols-2 xl:content-start [&::-webkit-scrollbar]:hidden">
          {/* Real spacer elements, not container padding: Chromium drops the leading edge of a flex scroll
              container's own padding, so the first tile sits flush against the screen without one. scroll-px-4
              keeps snap stops 16px in so the scrolled-to tile lands on the same gutter as the balance. Hidden (and
              out of flow) once the row stops scrolling, at sm:, where grid columns must stay exactly four. */}
          <span className="w-4 shrink-0 sm:hidden" aria-hidden="true" />
          <ActionTile href="/portfolio?tab=target" icon={<IconTargetFill size={22} />}>{a.target}</ActionTile>
          <ActionTile href="/circles" icon={<IconGroupFill size={22} />}>{a.circles}</ActionTile>
          <ActionTile href="/circles?create=1" icon={<IconAddFill size={22} />}>{a.create}</ActionTile>
          {/* Desktop shows four tiles, so Send takes the place of How it works there; phones keep all five in the scroller. */}
          <ActionTile href={docsUrl("/docs")} icon={<IconPlayFill size={22} />} className="sm:hidden">{a.learn}</ActionTile>
          <ActionTile href="/portfolio?send=1" icon={<IconSend size={22} />}>{a.send}</ActionTile>
          <span className="w-4 shrink-0 sm:hidden" aria-hidden="true" />
        </div>
      </m.section>

      <div className="mt-6 sm:mt-8">
        <NextStepCard home={h} />
      </div>

      <div className="mt-8 grid gap-10 sm:mt-10 sm:border-t sm:border-line sm:pt-10 xl:grid-cols-[1fr_340px]">
        <m.section variants={rise} aria-labelledby="tokens-title" className="min-w-0">
          <SectionTitle id="tokens-title" title={d.portfolio.tabs.tokens} sub={count} />
          {h.portfolio.ok && (
            <>
              <TokenTable positions={h.portfolio.positions} totalUsd={h.portfolio.totalUsd} drift={drift} assets={assets ?? undefined} compact limit={tokenLimit} />
              {h.portfolio.positions.length > tokenLimit && (
                <button type="button" onClick={() => setTokenLimit((n) => n + TOKENS_PER_PAGE)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2">
                  {d.home.showMore}
                </button>
              )}
            </>
          )}
        </m.section>

        {/* Phones keep Home to value, actions, next step and tokens; rounds and history live in their own tabs. */}
        <div className="hidden content-start gap-10 sm:grid">
          <m.section variants={rise} aria-labelledby="rounds-title">
            <SectionTitle id="rounds-title" title={d.home.activeRounds} />
            {h.pending.length === 0 ? (
              <EmptyState title={d.home.noActiveRounds} action={<ButtonLink href="/circles" size="sm" variant="secondary">{d.home.next.circle.cta}</ButtonLink>} />
            ) : (
              <ul className="grid gap-1">
                {h.pending.map((r) => (
                  <li key={r.roundId}>
                    <Link href={`/rounds/${r.roundId}`} className="-mx-2 flex min-w-0 items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-surface-2">
                      <IconChip className="text-match"><IconSwap size={18} /></IconChip>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{r.circleName}</span>
                        <span className="block text-xs text-ink-3">{fmt(d.round.crumb, { seq: r.sequence })}</span>
                      </span>
                      <Badge tone={stateTone(r.state)} dot={!["COMPLETE", "NO_CROSS", "EXPIRED"].includes(r.state)}>{d.states[r.state]}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </m.section>

          <m.section variants={rise} aria-labelledby="recent-title">
            <SectionTitle id="recent-title" title={d.home.recent} sub={h.activity.length ? fmt(d.home.recentSub, { n: lastWeek }) : undefined} />
            {h.activity.length === 0 ? (
              <p className="text-sm text-ink-3">{d.home.noActivity}</p>
            ) : (
              <>
                <div className="grid gap-0.5">
                  {h.activity.slice(0, 4).map((x) => <ActivityRow key={x.id} a={x} time={day.format(new Date(x.createdAt))} />)}
                </div>
                <PillLink href="/activity">{d.home.allActivity}</PillLink>
              </>
            )}
          </m.section>
        </div>
      </div>
    </Stagger>
  );
}

function SectionTitle({ id, title, sub }: { id: string; title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 id={id} className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-ink-3">{sub}</p>}
    </div>
  );
}

/** Quick action in the brand tint, like the Send/Receive tiles in wallet apps. */
function ActionTile({ href, icon, children, className }: { href: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cx("flex h-24 w-32 shrink-0 snap-start flex-col justify-between rounded-[20px] bg-accent-soft p-4 sm:h-28 sm:w-auto text-accent transition-[filter,transform] hover:brightness-110 active:scale-[0.98]", className)}>
      {icon}
      <span className="text-base font-semibold">{children}</span>
    </Link>
  );
}

function PillLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2">
      {children}
      <IconArrowRight size={16} />
    </Link>
  );
}
