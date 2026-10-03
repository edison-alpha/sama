"use client";

import { useState } from "react";
import { ActivityRow } from "@/components/activity/activity-row";
import { ActivityHeatmap, dayKey } from "@/components/activity/heatmap";
import { IconCalendar, IconClock, IconPulse, IconSwap } from "@/components/icons";
import { Card, CardHeader, PageHeader, StatTile } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState, ErrorNote, PageSkeleton } from "@/components/ui/states";
import { sama } from "@/lib/api";
import { useApi } from "@/lib/api/use-api";
import { activityGroup } from "@/lib/activity";
import { dayLabel } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { Stagger } from "@/components/motion";

type Filter = "all" | "rounds" | "circles" | "targets" | "leftovers";

export default function ActivityPage() {
  const { d, locale } = useI18n();
  const { data, error } = useApi(() => sama.activity(), []);
  const [filter, setFilter] = useState<Filter>("all");
  if (!data) return error ? <ErrorNote>{error}</ErrorNote> : <PageSkeleton />;

  const rows = data.filter((a) => filter === "all" || activityGroup(a.kind) === filter);
  const days = new Map<string, typeof rows>();
  for (const a of rows) {
    const key = dayKey(new Date(a.createdAt));
    days.set(key, [...(days.get(key) ?? []), a]);
  }

  const s = d.activity.stats;
  const weekAgo = Date.now() - 7 * 86_400_000;
  const latest = data.reduce<string | null>((m, a) => (!m || a.createdAt > m ? a.createdAt : m), null);
  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  return (
    <Stagger>
      <PageHeader title={d.activity.title} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={<IconPulse size={18} />} label={s.total} value={data.length} />
        <StatTile icon={<IconCalendar size={18} />} label={s.days} value={new Set(data.map((a) => dayKey(new Date(a.createdAt)))).size} />
        <StatTile icon={<IconSwap size={18} />} label={s.week} value={data.filter((a) => new Date(a.createdAt).getTime() >= weekAgo).length} />
        <StatTile
          icon={<IconClock size={18} />}
          label={s.last}
          value={latest ? new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short" }).format(new Date(latest)) : "—"}
        />
      </div>

      <Card className="mb-6">
        <CardHeader title={d.activity.heatmap.title} />
        <ActivityHeatmap activity={data} />
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-ink">{d.activity.timeline}</h2>
          <Segmented label={d.activity.title} value={filter} onChange={setFilter} options={(Object.keys(d.activity.filters) as Filter[]).map((k) => ({ value: k, label: d.activity.filters[k] }))} className="max-w-full overflow-x-auto" />
        </div>
        {rows.length === 0 ? (
          <EmptyState title={d.activity.empty} />
        ) : (
          <div className="grid gap-5">
            {[...days].map(([day, items]) => (
              <div key={day}>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">{dayLabel(items[0]!.createdAt, locale)}</h3>
                <div className="grid grid-cols-1 gap-0.5">
                  {items.map((a) => <ActivityRow key={a.id} a={a} time={time(a.createdAt)} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Stagger>
  );
}
