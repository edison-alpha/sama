"use client";

import { m, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { AssetStack } from "@/components/asset-icon";
import { IconChevronRight, IconRound, IconUsers } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { Circle } from "@/lib/api/types";
import { cadence, duration } from "@/lib/circle-words";
import { EASE_OUT } from "@/lib/ease";
import { clock, dateTime, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

/**
 * A Circle as a plain app card: name and live status on top; the current round with one clear action and, while it is
 * open, how long is left; then the members and what past rounds matched. The whole card opens the Circle. Nothing on
 * it looks like a price or a bet: the copy and controls describe joining and rebalancing, not odds.
 */
export function CircleCard({ circle }: { circle: Circle }) {
  const { d, fmt, locale } = useI18n();
  const router = useRouter();
  const titleId = useId();
  const reduce = useReducedMotion();
  const now = useNow(Boolean(circle.liveRound));

  const round = circle.liveRound;
  const live = Boolean(round && ["OPEN", "COLLECTING"].includes(round.state));
  const left = round ? round.freezesAt - now : 0;
  const elapsed = live ? Math.min(1, Math.max(0, 1 - left / circle.durationSec)) : 0;
  const c = d.circles.card;

  // One action per card: join a Circle you're not in, open the live round you are in, otherwise look inside.
  const action = !circle.role ? { label: c.join, href: `/circles/${circle.id}` } : round ? { label: c.open, href: `/rounds/${round.id}` } : { label: c.view, href: `/circles/${circle.id}` };

  // What past rounds matched in total, for the footer.
  const history = circle.history.map((h) => h.crossedUsd);
  const matched = history.reduce((s, v) => s + v, 0);

  // The round line: the state and, while the round is open, the time left. The button carries only its verb.
  const roundStatus = round
    ? live
      ? `${d.states[round.state]} · ${fmt(d.circles.closesIn, { time: clock(left) })}`
      : d.states[round.state]
    : circle.nextRoundAt
      ? fmt(d.circles.nextRound, { when: dateTime(circle.nextRoundAt, locale) })
      : `${cadence(circle.cadenceSec, d, locale)} · ${duration(circle.durationSec, locale)}`;

  return (
    <article aria-labelledby={titleId} className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-line bg-surface text-ink transition-transform duration-300 hover:-translate-y-0.5">
      <header className="flex shrink-0 items-center gap-3 px-5 pt-5">
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="truncate text-[17px] font-semibold leading-snug tracking-tight">
            {/* Stretched link: the whole card opens the Circle; the action button sits above it. */}
            <Link href={`/circles/${circle.id}`} className="outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:outline-2 focus-visible:after:outline-ring">{circle.name}</Link>
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
            {live && (
              <>
                <span className="inline-flex items-center gap-1.5 font-medium text-accent">
                  <span className="size-1.5 animate-sama-pulse rounded-full bg-current" aria-hidden="true" />
                  {d.circles.liveNow}
                </span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>{cadence(circle.cadenceSec, d, locale)}</span>
            <span aria-hidden="true">·</span>
            <span>{d.circles.visibility[circle.visibility]}</span>
          </p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-5 py-4">
        {/* Current round: what it is, where it stands, and the one action. */}
        <div className="space-y-2">
          <div className="flex min-h-10 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true"><IconRound size={17} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{round ? fmt(d.round.crumb, { seq: round.sequence }) : c.noRound}</span>
              <span className="block truncate text-xs text-ink-3">{roundStatus}</span>
            </span>
            <Button
              size="sm"
              variant={live || !circle.role ? "primary" : "secondary"}
              onClick={() => router.push(action.href)}
              className="relative z-10 shrink-0"
            >
              {action.label}
            </Button>
          </div>
          {live && (
            <div aria-hidden="true" className="ml-12 h-1 overflow-hidden rounded-full bg-surface-2">
              <m.div initial={false} animate={{ scaleX: elapsed }} transition={reduce ? { duration: 0 } : { duration: 0.25, ease: EASE_OUT }} className="h-full origin-left rounded-full bg-accent" />
            </div>
          )}
        </div>

        {/* Members. */}
        <div className="flex min-h-10 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2" aria-hidden="true"><IconUsers size={17} /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">{fmt(d.circles.members, { n: circle.memberCount })}</span>
            <span className="block truncate text-xs text-ink-3">{fmt(c.minPer, { n: circle.minParticipants })}</span>
          </span>
          <AssetStack symbols={circle.assetSymbols} size={22} max={5} />
        </div>
      </div>

      <footer className="mx-5 flex shrink-0 items-center gap-2 border-t border-line py-3.5 text-xs text-ink-3">
        <span className="num shrink-0">{history.length ? fmt(d.circles.crossed, { amount: usd(matched, locale, 0) }) : c.noHistory}</span>
        <IconChevronRight size={16} className="ml-auto shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </footer>
    </article>
  );
}

/** Ticks once a second only while there is a round to count down. */
function useNow(ticking: boolean) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    if (!ticking) return;
    const t = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(t);
  }, [ticking]);
  return now;
}
