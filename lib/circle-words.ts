import { fmt, type Dict, type Locale } from "@/lib/i18n/dict";

export function duration(sec: number, locale: Locale): string {
  const unit = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const id = locale === "id";
  if (sec % 86_400 === 0) return unit(sec / 86_400, id ? "hari" : "day", id ? "hari" : "days");
  if (sec % 3_600 === 0) return unit(sec / 3_600, id ? "jam" : "hour", id ? "jam" : "hours");
  return `${Math.round(sec / 60)} ${id ? "menit" : "min"}`;
}

export function cadence(sec: number | null, d: Dict, locale: Locale): string {
  if (!sec) return d.circles.cadence.onDemand;
  if (sec === 86_400) return d.circles.cadence.daily;
  if (sec === 604_800) return d.circles.cadence.weekly;
  return fmt(d.circles.cadence.every, { d: duration(sec, locale) });
}

export const DURATIONS = [300, 900, 3_600, 14_400, 86_400];
export const CADENCES: Array<number | null> = [null, 86_400, 604_800];
