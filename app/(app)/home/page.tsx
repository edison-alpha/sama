"use client";

import Link from "next/link";
import { ActivityRow } from "@/components/activity/activity-row";
import { NextStepCard } from "@/components/home/next-step-card";
import { CountUp, Stagger } from "@/components/motion";
import { IconCalendar, IconChevronRight, IconCircles, IconSwap, IconTarget, IconWallet } from "@/components/icons";
import { DriftBars } from "@/components/portfolio/drift-bars";
import { HoldingsRing } from "@/components/portfolio/holdings-ring";
import { Badge, stateTone } from "@/components/ui/badge";
import { Card, CardHeader, IconChip, PageHeader, StatTile } from "@/components/ui/card";
import { EmptyState, ErrorNote, PageSkeleton } from "@/components/ui/states";
import { ButtonLink } from "@/components/ui/button";
import { sama } from "@/lib/api";
import type { PendingRound } from "@/lib/api/types";
import { useApi } from "@/lib/api/use-api";
import { percent, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

/** A round asks something of you when it's collecting and you haven't joined, wants your approval, or has undecided leftovers. */
function needsYou(r: PendingRound): boolean {
  if (["OPEN", "COLLECTING"].includes(r.state) && !r.signed) return true;
  if (["PROPOSED", "APPROVING"].includes(r.state) && r.inPlan && !r.approved) return true;
  return r.residualUndecidedUsd > 0;
}

export default function HomePage() {
  const { d, fmt, locale } = useI18n();
  const { data: h, error, refresh } = useApi(() => sama.home(), [], { pollMs: 4_000 });

  if (!h) return error ? <ErrorNote action={<button className="underline" onClick={() => void refresh()}>{d.common.retry}</button>}>{error}</ErrorNote> : <PageSkeleton />;

  const s = d.home.stats;
  const waiting = h.pending.filter(needsYou).length;
  const offTarget = h.totalDriftPct > 2;
  const when = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <Stagger>
      <PageHeader
        title={d.home.hello}
        actions={
          <span className="hidden h-10 items-center gap-2 rounded-full border border-[var(--glass-edge)] bg-[var(--glass-bg)] px-4 text-sm font-medium text-ink-2 backdrop-blur-xl sm:inline-flex">
            <IconCalendar size={18} />
            {new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", { dateStyle: "long" }).format(new Date())}
          </span>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={<IconWallet size={18} />} label={s.value} value={h.portfolio.ok ? <CountUp value={h.portfolio.totalUsd} format={(n) => usd(n, locale)} /> : "—"} />
        <StatTile
          icon={<IconTarget size={18} />}
          label={s.drift}
          value={h.target ? <CountUp value={h.totalDriftPct} format={(n) => percent(n, locale)} /> : "—"}
          chip={h.target ? <Badge tone={offTarget ? "accent" : "ok"}>{offTarget ? s.offTarget : s.onTarget}</Badge> : <Badge>{s.noTarget}</Badge>}
        />
        <StatTile icon={<IconSwap size={18} />} label={s.rounds} value={<CountUp value={h.pending.length} format={(n) => String(Math.round(n))} />} chip={waiting > 0 ? <Badge tone="accent" dot>{fmt(s.needsYou, { n: waiting })}</Badge> : null} />
        <StatTile icon={<IconCircles size={18} />} label={s.circles} value={<CountUp value={h.circles.length} format={(n) => String(Math.round(n))} />} />
      </div>

      <NextStepCard home={h} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader title={d.home.allocation} aside={<Link href="/portfolio" className="inline-flex items-center gap-1 text-sm font-medium text-accent">{d.home.openPortfolio}<IconChevronRight size={16} /></Link>} />
          {h.portfolio.ok ? (
            <>
              <HoldingsRing
                positions={h.portfolio.positions}
                label={d.home.allocation}
                center={
                  <>
                    <span className="num block text-2xl font-semibold tracking-tight text-ink">{h.portfolio.positions.length}</span>
                    <span className="block text-xs text-ink-3">{d.home.assetsLabel}</span>
                  </>
                }
              />
              <div className="mt-6 border-t border-line pt-5">
                {h.target ? <DriftBars drift={h.drift} /> : <EmptyState title={d.home.next.target.title} body={d.home.next.target.body} action={<ButtonLink href="/portfolio" size="sm">{d.home.next.target.cta}</ButtonLink>} />}
              </div>
            </>
          ) : (
            <ErrorNote>{d.portfolio.readError} {h.portfolio.detail}</ErrorNote>
          )}
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader title={d.home.activeRounds} />
            {h.pending.length === 0 ? (
              <EmptyState title={d.home.noActiveRounds} action={<ButtonLink href="/circles" size="sm" variant="secondary">{d.home.next.circle.cta}</ButtonLink>} />
            ) : (
              <ul className="grid grid-cols-1 gap-1">
                {h.pending.map((r) => (
                  <li key={r.roundId}>
                    <Link href={`/rounds/${r.roundId}`} className="-mx-2 flex min-w-0 items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-surface/70">
                      <IconChip className="text-match"><IconSwap size={18} /></IconChip>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{r.circleName}</span>
                        <span className="block text-xs text-ink-3">{fmt(d.round.crumb, { seq: r.roundId.replace(/\D/g, "") })}</span>
                      </span>
                      <Badge tone={stateTone(r.state)} dot={!["COMPLETE", "NO_CROSS", "EXPIRED"].includes(r.state)}>{d.states[r.state]}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
  
          <Card>
            <CardHeader title={d.home.recent} aside={<Link href="/activity" className="inline-flex items-center gap-1 text-sm font-medium text-accent">{d.home.allActivity}<IconChevronRight size={16} /></Link>} />
            {h.activity.length === 0 ? (
              <p className="text-ink-2">{d.home.noActivity}</p>
            ) : (
              <div className="grid grid-cols-1 gap-0.5">
                {h.activity.map((a) => <ActivityRow key={a.id} a={a} time={when.format(new Date(a.createdAt))} />)}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Stagger>
  );
}
