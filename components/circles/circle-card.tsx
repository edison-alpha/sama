"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AssetIcon } from "@/components/asset-icon";
import { IconChevronRight, IconUsers } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import type { Circle } from "@/lib/api/types";
import { cadence, duration } from "@/lib/circle-words";
import { clock, dateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

export function CircleCard({ circle }: { circle: Circle }) {
  const { d, fmt, locale } = useI18n();
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    if (!circle.liveRound) return;
    const t = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(t);
  }, [circle.liveRound]);

  const live = circle.liveRound && ["OPEN", "COLLECTING"].includes(circle.liveRound.state);
  const shown = circle.assetSymbols.slice(0, 5);
  return (
    <Link href={`/circles/${circle.id}`} className="glass-panel group flex flex-col gap-5 rounded-[var(--radius-card)] p-5 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex -space-x-2" aria-label={circle.assetSymbols.join(", ")}>
          {shown.map((s) => <span key={s} className="rounded-full ring-2 ring-[var(--surface)]"><AssetIcon symbol={s} size={32} /></span>)}
          {circle.assetSymbols.length > shown.length && (
            <span className="num grid size-8 place-items-center rounded-full bg-surface-2 text-xs font-medium text-ink-2 ring-2 ring-[var(--surface)]">+{circle.assetSymbols.length - shown.length}</span>
          )}
        </span>
        <Badge>{d.circles.visibility[circle.visibility]}</Badge>
      </div>
      <div>
        <h3 className="text-[17px] font-semibold tracking-tight group-hover:text-accent">{circle.name}</h3>
        <p className="mt-0.5 text-sm text-ink-3">{cadence(circle.cadenceSec, d, locale)} · {duration(circle.durationSec, locale)}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
        <span className="min-w-0">
          {live ? (
            <Badge tone="accent" dot>{d.circles.liveNow} · {fmt(d.circles.closesIn, { time: clock(circle.liveRound!.freezesAt - now) })}</Badge>
          ) : circle.liveRound ? (
            <Badge tone="match">{d.states[circle.liveRound.state]}</Badge>
          ) : circle.nextRoundAt ? (
            <span className="text-ink-3">{fmt(d.circles.nextRound, { when: dateTime(circle.nextRoundAt, locale) })}</span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-ink-2">
          <IconUsers size={16} />
          <span className="num" aria-hidden="true">{circle.memberCount}</span>
          <span className="sr-only">{fmt(d.circles.members, { n: circle.memberCount })}</span>
          <IconChevronRight size={16} className="text-ink-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
