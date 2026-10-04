"use client";

import { m } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconArrowRight, IconCheckCircle, IconCircles, IconClock, IconPen, IconSwap, IconTarget } from "@/components/icons";
import { rise } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import type { Home } from "@/lib/api/types";
import { clock, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { nextStep } from "@/lib/next-step";

/** One icon per kind of step: a pen to sign, a check when it's done, arrows for a transfer, and so on. */
const STEP_ICON = {
  join: IconPen,
  approve: IconCheckCircle,
  settle: IconSwap,
  leftovers: IconSwap,
  wait: IconClock,
  target: IconTarget,
  circle: IconCircles,
  allGood: IconCheckCircle,
} as const;

/** The one thing to do now (PRD §19.4.3), as a single slim row. Always present, always one primary action. */
export function NextStepCard({ home }: { home: Home }) {
  const { d, fmt, locale } = useI18n();
  const step = nextStep(home);
  const now = useNow();
  const n = d.home.next;

  const { copy, href, vars } = ((): { copy: { title: string; body: string; cta: string }; href: string; vars: Record<string, string | number> } => {
    switch (step.kind) {
      case "join":
        return { copy: n.join, href: `/rounds/${step.round.roundId}`, vars: { seq: step.round.roundId.replace(/\D/g, ""), circle: step.round.circleName, time: clock(step.round.freezesAt - now) } };
      case "approve":
        return { copy: n.approve, href: `/rounds/${step.round.roundId}`, vars: { circle: step.round.circleName } };
      case "settle":
        return { copy: n.settle, href: `/rounds/${step.round.roundId}`, vars: { circle: step.round.circleName } };
      case "leftovers":
        return { copy: n.leftovers, href: `/rounds/${step.round.roundId}`, vars: { circle: step.round.circleName, amount: usd(step.round.residualUndecidedUsd, locale) } };
      case "wait":
        return { copy: n.wait, href: `/rounds/${step.round.roundId}`, vars: { circle: step.round.circleName, seq: step.round.roundId.replace(/\D/g, "") } };
      case "target":
        return { copy: n.target, href: "/portfolio?tab=target", vars: {} };
      case "circle":
        return { copy: n.circle, href: "/circles", vars: {} };
      case "allGood":
        return { copy: n.allGood, href: "/circles", vars: { circle: step.circleName ?? "—" } };
    }
  })();

  const StepIcon = STEP_ICON[step.kind];
  const countdown = step.kind === "join" ? clock(step.round.freezesAt - now) : null;

  return (
    <m.section variants={rise} aria-labelledby="next-title">
      {/* Phones: the whole card is the tap target, like a wallet app's task card; the action reads as a text link. */}
      <Link href={href} className="flex gap-3 rounded-[20px] border border-line bg-surface-2/60 p-4 transition-colors active:bg-surface-2 sm:hidden">
        <StepIcon size={22} className="mt-0.5 shrink-0 text-accent" />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className="text-base font-semibold leading-snug text-ink">{fmt(copy.title, vars)}</span>
            {countdown && <span className="tabular-nums shrink-0 rounded-lg bg-surface-3 px-2 py-0.5 text-xs font-semibold text-ink-2">{countdown}</span>}
          </span>
          <span className="mt-1 block text-sm text-ink-2">{fmt(copy.body, vars)}</span>
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent">{copy.cta}<IconArrowRight size={16} /></span>
        </span>
      </Link>

      <div className="hidden items-center gap-5 rounded-[24px] border border-accent/40 bg-accent-soft/60 p-5 sm:flex">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">{d.home.nextStep}</p>
          <h2 id="next-title" className="mt-1 text-lg font-semibold tracking-tight text-ink">{fmt(copy.title, vars)}</h2>
          <p className="mt-0.5 text-sm text-ink-2">{fmt(copy.body, vars)}</p>
        </div>
        <ButtonLink href={href} className="shrink-0" trailing={<IconArrowRight size={18} />}>{copy.cta}</ButtonLink>
      </div>
    </m.section>
  );
}

function useNow() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}
