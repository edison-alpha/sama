import type { HistoryPoint } from "@/lib/api/types";

export type MonthlyReturns = { years: number[]; returns: (number | null)[][] };

const monthKey = (t: number) => {
  const d = new Date(t);
  return d.getFullYear() * 12 + d.getMonth();
};

/**
 * Month-by-month change of total wallet value, in percent, for the returns calendar. A month is measured from the
 * previous month's last value to its own last value; when the previous month has no data it is measured from its own
 * first value instead, so a gap is never folded into one month. Months without a recorded value are `null`. Rows run
 * from the first recorded year to the current one, in local time. Null when there is not enough history to say anything.
 */
export function monthlyReturns(points: HistoryPoint[], now = Date.now()): MonthlyReturns | null {
  const sorted = points.filter((p) => Number.isFinite(p.usd) && p.usd > 0).sort((a, b) => a.t - b.t);
  if (sorted.length < 2) return null;

  const first = new Map<number, number>();
  const last = new Map<number, number>();
  for (const p of sorted) {
    const k = monthKey(p.t);
    if (!first.has(k)) first.set(k, p.usd);
    last.set(k, p.usd);
  }

  const startYear = Math.floor(monthKey(sorted[0]!.t) / 12);
  const endYear = Math.floor(Math.max(monthKey(now), monthKey(sorted[sorted.length - 1]!.t)) / 12);
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  const returns = years.map((year) =>
    Array.from({ length: 12 }, (_, month) => {
      const k = year * 12 + month;
      const end = last.get(k);
      if (end === undefined) return null;
      const base = last.get(k - 1) ?? first.get(k)!;
      return base > 0 ? (end / base - 1) * 100 : null;
    }),
  );

  return returns.some((row) => row.some((v) => v !== null)) ? { years, returns } : null;
}
