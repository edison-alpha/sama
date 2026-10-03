import "server-only";
import { cookies, headers } from "next/headers";
import { dicts, LOCALE_COOKIE, pickLocale, type Dict, type Locale } from "./dict";

export async function getLocale(): Promise<Locale> {
  const [jar, h] = await Promise.all([cookies(), headers()]);
  return pickLocale(jar.get(LOCALE_COOKIE)?.value, h.get("accept-language"));
}

export async function getDict(): Promise<{ locale: Locale; d: Dict }> {
  const locale = await getLocale();
  return { locale, d: dicts[locale] };
}
