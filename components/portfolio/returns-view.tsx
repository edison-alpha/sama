"use client";

import { useMemo } from "react";
import { ReturnsCalendar } from "@/components/charts/returns-calendar";
import { EmptyState, ErrorNote, Skeleton } from "@/components/ui/states";
import { API_MODE, sama } from "@/lib/api";
import { useApi } from "@/lib/api/use-api";
import { useI18n } from "@/lib/i18n/provider";
import { monthlyReturns } from "@/lib/monthly-returns";

/**
 * The returns calendar on Home: the wallet's month-by-month change as a years × months grid (beui.dev returns-calendar),
 * from the same recorded values as the chart. Months Sama has no record for stay empty rather than reading as 0%.
 * It keeps the chart's height, so switching between the two does not move the page.
 */
export function ReturnsView() {
  const { d } = useI18n();
  const c = d.home.chart;
  const { data, error } = useApi(() => sama.portfolioHistory("ALL"), []);
  const model = useMemo(() => (data ? monthlyReturns(data) : null), [data]);

  return (
    <div className="flex min-h-[288px] flex-col">
      {error ? (
        <ErrorNote>{error}</ErrorNote>
      ) : !data ? (
        <Skeleton className="h-[120px] w-full max-w-[720px]" />
      ) : !model ? (
        <EmptyState title={c.calendarEmpty} />
      ) : (
        <ReturnsCalendar
          years={model.years}
          returns={model.returns}
          // Sama's theme decides the text lightness (data-theme or system), not Tailwind's media-only dark: variant.
          className="w-full max-w-[720px] [--ink-l:var(--chart-ink-l)] dark:[--ink-l:var(--chart-ink-l)]"
        />
      )}
      <p className="mt-auto pt-4 text-xs text-ink-3">{API_MODE === "mock" ? c.demoNote : c.calendarNote}</p>
    </div>
  );
}
