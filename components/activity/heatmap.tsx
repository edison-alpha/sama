"use client";

import type { Activity } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

const DAY = 86_400_000;

/** Local-calendar key, so an event late in the evening lands on the day the user saw it happen. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Contribution-style calendar: one column per week (Monday first), one cell per day, five accent steps scaled to the
 * busiest day. Every cell has a title with its date and count; the figure has a one-line summary for screen readers.
 */
export function ActivityHeatmap({ activity, weeks = 18 }: { activity: Activity[]; weeks?: number }) {
  const { d, fmt, locale } = useI18n();
  const tag = locale === "id" ? "id-ID" : "en-US";

  const counts = new Map<string, number>();
  for (const a of activity) {
    const k = dayKey(new Date(a.createdAt));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sinceMonday = (today.getDay() + 6) % 7;
  const start = new Date(today.getTime() - (sinceMonday + (weeks - 1) * 7) * DAY);
  const days = Array.from({ length: weeks * 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return { date, count: counts.get(dayKey(date)) ?? 0, future: date > today };
  });
  const max = Math.max(1, ...days.map((x) => x.count));
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((n / max) * 4))));

  const shown = days.filter((x) => !x.future);
  const total = shown.reduce((s, x) => s + x.count, 0);
  const active = shown.filter((x) => x.count > 0).length;
  const month = new Intl.DateTimeFormat(tag, { month: "short" });
  const long = new Intl.DateTimeFormat(tag, { weekday: "short", day: "numeric", month: "short" });

  const months = Array.from({ length: weeks }, (_, w) => {
    const first = days[w * 7]!.date;
    const prev = w > 0 ? days[(w - 1) * 7]!.date : null;
    return !prev || prev.getMonth() !== first.getMonth() ? month.format(first) : "";
  });

  return (
    <figure>
      <figcaption className="sr-only">{fmt(d.activity.heatmap.summary, { n: total, days: active, weeks })}</figcaption>
      <div className="grid gap-[3px] sm:gap-1" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}>
        {months.map((m, i) => (
          <span key={i} className="h-4 overflow-visible whitespace-nowrap text-[11px] text-ink-3" aria-hidden="true">{m}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-flow-col grid-rows-7 gap-[3px] sm:gap-1" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }} aria-hidden="true">
        {days.map(({ date, count, future }) => (
          <span
            key={date.getTime()}
            title={future ? undefined : fmt(d.activity.heatmap.cell, { date: long.format(date), n: count })}
            className={cx("aspect-square rounded-[4px] sm:rounded-md", future ? "opacity-0" : `heat-${level(count)}`)}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-ink-3">
        <span>{fmt(d.activity.heatmap.summary, { n: total, days: active, weeks })}</span>
        <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
          {d.activity.heatmap.less}
          {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`heat-${l} size-2.5 rounded-[3px]`} />)}
          {d.activity.heatmap.more}
        </span>
      </div>
    </figure>
  );
}
