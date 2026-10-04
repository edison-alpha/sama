"use client";

import { m, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { AssetStack } from "@/components/asset-icon";
import { ActionSwapText } from "@/components/motion/action-swap";
import { IconChevronRight, IconRound, IconUsers } from "@/components/icons";
import type { Circle } from "@/lib/api/types";
import { cadence, duration } from "@/lib/circle-words";
import { EASE_OUT, SPRING_PRESS } from "@/lib/ease";
import { useHoverCapable } from "@/lib/hooks/use-hover-capable";
import { clock, dateTime, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

/**
 * A Circle as a market-style card (adapted from beui.dev's prediction market card): just the name and live status on
 * top (the asset logos move to the members row below, where they annotate who rebalances what); inside, the round row
 * with one action button and a time-left bar, then members, then what past rounds matched in the footer. The whole
 * card opens the Circle; the action button goes straight to the next step.
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

  return (
    <article aria-labelledby={titleId} className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl bg-card text-foreground transition-transform duration-300 hover:-translate-y-0.5">
      <header className="flex shrink-0 items-center gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="truncate font-display text-base font-semibold leading-snug tracking-tight">
            {/* Stretched link: the whole card opens the Circle; the action button sits above it. */}
            <Link href={`/circles/${circle.id}`} className="outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:outline-2 focus-visible:after:outline-ring">{circle.name}</Link>
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
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

      <div className="mx-2 mb-2 flex flex-1 flex-col rounded-3xl bg-background px-4 py-3">
        <div className="flex flex-1 flex-col justify-center gap-3">
          {/* Round row: what's happening now and the one action. */}
          <div className="space-y-1.5">
            <div className="flex min-h-10 items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true"><IconRound size={16} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{round ? fmt(d.round.crumb, { seq: round.sequence }) : c.noRound}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {round ? d.states[round.state] : circle.nextRoundAt ? fmt(d.circles.nextRound, { when: dateTime(circle.nextRoundAt, locale) }) : `${cadence(circle.cadenceSec, d, locale)} · ${duration(circle.durationSec, locale)}`}
                </span>
              </span>
              <ActionButton label={action.label} idle={live ? clock(left) : action.label} accent={live || !circle.role} onClick={() => router.push(action.href)} />
            </div>
            {live && (
              <div aria-hidden="true" className="ml-[42px] h-0.5 overflow-hidden rounded-full bg-muted">
                <m.div initial={false} animate={{ scaleX: elapsed }} transition={reduce ? { duration: 0 } : { duration: 0.25, ease: EASE_OUT }} className="h-full origin-left rounded-full bg-accent" />
              </div>
            )}
          </div>

          {/* Members row. */}
          <div className="flex min-h-10 items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground" aria-hidden="true"><IconUsers size={16} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{fmt(d.circles.members, { n: circle.memberCount })}</span>
              <span className="block truncate text-xs text-muted-foreground">{fmt(c.minPer, { n: circle.minParticipants })}</span>
            </span>
            <AssetStack symbols={circle.assetSymbols} size={22} max={5} />
          </div>
        </div>

        <footer className="mt-2 flex shrink-0 items-center gap-2 border-t border-border pt-2.5 text-xs text-muted-foreground">
          <span className="num shrink-0">{history.length ? fmt(d.circles.crossed, { amount: usd(matched, locale, 0) }) : c.noHistory}</span>
          <IconChevronRight size={16} className="ml-auto shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </footer>
      </div>
    </article>
  );
}

/**
 * The card's one action, in the style of the market card's odds button: it shows the countdown at rest and rolls to
 * its verb ("Join", "Open") on hover or keyboard focus. Touch has no hover, so it shows the verb there from the start.
 */
function ActionButton({ label, idle, accent, onClick }: { label: string; idle: string; accent: boolean; onClick: () => void }) {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const showAction = !canHover || hovered || focused;
  return (
    <m.button
      type="button"
      aria-label={label}
      onClick={onClick}
      onPointerEnter={(e) => e.pointerType !== "touch" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={(e) => setFocused(e.currentTarget.matches(":focus-visible"))}
      onBlur={() => setFocused(false)}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      transition={SPRING_PRESS}
      className={cx(
        "relative z-10 flex min-h-10 min-w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl border px-3 text-sm font-semibold shadow-[0_3px_0] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        accent ? "border-accent/30 bg-accent/10 text-accent shadow-accent/25 hover:bg-accent/15" : "border-border bg-card text-foreground shadow-black/20 hover:bg-muted",
      )}
    >
      <span className="num">
        <ActionSwapText value={showAction ? "action" : "idle"} animation="roll">{showAction ? label : idle}</ActionSwapText>
      </span>
    </m.button>
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
