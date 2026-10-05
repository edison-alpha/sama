"use client";

import Link from "next/link";
import { IconChevronRight, IconCircles, IconLayers, IconSwap, IconTarget } from "@/components/icons";
import { IconChip } from "@/components/ui/card";
import type { Activity } from "@/lib/api/types";
import { activityGroup, activityLine } from "@/lib/activity";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

const GROUP = {
  rounds: { Icon: IconSwap, tone: "text-match" },
  circles: { Icon: IconCircles, tone: "text-accent" },
  targets: { Icon: IconTarget, tone: "text-ok" },
  leftovers: { Icon: IconLayers, tone: "text-rest" },
  transfers: { Icon: IconSwap, tone: "text-accent" },
} as const;

/** One activity line with its kind's icon; rows that belong to a round open it. Shared by Home and Activity. */
export function ActivityRow({ a, time }: { a: Activity; time: string }) {
  const { d } = useI18n();
  const group = activityGroup(a.kind);
  const { Icon, tone } = GROUP[group];
  const body = (
    <>
      <IconChip className={tone}>
        {/* Transfers show the token's own logo (PancakeSwap list); only https images are shown. */}
        {String(a.detail.logo ?? "").startsWith("https://") ? <img src={String(a.detail.logo)} alt="" width={18} height={18} className="rounded-full" loading="lazy" /> : <Icon size={18} />}
      </IconChip>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{activityLine(a, d)}</span>
        <span className="block text-xs text-ink-3">{d.activity.filters[group]}</span>
      </span>
      <span className="num shrink-0 text-xs text-ink-3">{time}</span>
      {a.roundId && <IconChevronRight size={16} className="shrink-0 text-ink-3" />}
    </>
  );
  const row = "flex min-w-0 items-center gap-3 rounded-2xl px-2 py-2.5";
  return a.roundId ? (
    <Link href={`/rounds/${a.roundId}`} className={cx(row, "-mx-2 transition-colors hover:bg-surface/70")}>{body}</Link>
  ) : (
    <div className={cx(row, "-mx-2")}>{body}</div>
  );
}
