"use client";

import { m } from "motion/react";
import { useEffect, useState } from "react";
import { IconArrowRight } from "@/components/icons";
import { rise } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import type { Home } from "@/lib/api/types";
import { clock, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { nextStep } from "@/lib/next-step";

/** The one thing to do now (PRD §19.4.3). Always present, always one primary action. */
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
        return { copy: n.target, href: "/portfolio", vars: {} };
      case "circle":
        return { copy: n.circle, href: "/circles", vars: {} };
      case "allGood":
        return { copy: n.allGood, href: "/circles", vars: { circle: step.circleName ?? "—" } };
    }
  })();

  return (
    <m.section variants={rise} aria-labelledby="next-title" className="relative overflow-hidden rounded-[var(--radius-card)] bg-sky p-6 text-on-sky shadow-[inset_0_1px_0_rgb(255_255_255/0.18),var(--elev-float)] sm:p-8">
      <div className="absolute -right-16 -top-16 size-56 rounded-full bg-accent/40 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-match/30 blur-3xl" aria-hidden="true" />
      <p className="relative text-xs font-semibold uppercase tracking-[0.14em] text-white/70">{d.home.nextStep}</p>
      <h2 id="next-title" className="relative mt-2 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">{fmt(copy.title, vars)}</h2>
      <p className="relative mt-2 max-w-xl text-white/80">{fmt(copy.body, vars)}</p>
      <ButtonLink href={href} size="lg" className="relative mt-6" trailing={<IconArrowRight size={18} />}>{copy.cta}</ButtonLink>
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
