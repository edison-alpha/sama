import type { Locale } from "./i18n/dict";

const tag = (locale: Locale) => (locale === "id" ? "id-ID" : "en-US");

/** Money is always shown in USD (PRD §19.2); only separators follow the language. */
export function usd(value: number, locale: Locale = "en", digits = 2): string {
  return new Intl.NumberFormat(tag(locale), { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function tokens(value: number, locale: Locale = "en"): string {
  const abs = Math.abs(value);
  // Dust amounts (e.g. a few wei of BNB) need more than 6 decimals to show as anything but "0", like a wallet app.
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : abs === 0 ? 2 : Math.min(12, Math.max(6, -Math.floor(Math.log10(abs)) + 3));
  return new Intl.NumberFormat(tag(locale), { maximumFractionDigits: digits }).format(value);
}

export function percent(value: number, locale: Locale = "en", digits = 1): string {
  return `${new Intl.NumberFormat(tag(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)}%`;
}

export function short(hash: string, head = 6, tail = 4): string {
  return hash.length > head + tail + 2 ? `${hash.slice(0, head)}…${hash.slice(-tail)}` : hash;
}

export function clock(secondsLeft: number): string {
  const s = Math.max(0, Math.floor(secondsLeft));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

export function dateTime(iso: string, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(tag(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

export function dayLabel(iso: string, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(tag(locale), { weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
}
