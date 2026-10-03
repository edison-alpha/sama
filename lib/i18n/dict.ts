import { en, type Dict } from "./en";
import { id } from "./id";

export type Locale = "id" | "en";
export type { Dict };

export const LOCALES: Locale[] = ["id", "en"];
export const LOCALE_COOKIE = "sama_locale";
export const dicts: Record<Locale, Dict> = { id, en };

/** Fills {name} placeholders. Unknown placeholders stay visible so a missing value is caught in review. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? String(vars[key]) : whole));
}

/** Cookie wins; otherwise Indonesian browsers get Indonesian and everyone else English (PRD §19.7). */
export function pickLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
  if (cookie === "id" || cookie === "en") return cookie;
  return /^(id|ms)\b/i.test(acceptLanguage?.trim() ?? "") ? "id" : "en";
}
