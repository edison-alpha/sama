import "server-only";
import { cookies } from "next/headers";
import { dicts, LOCALE_COOKIE, pickLocale, type Dict, type Locale } from "./dict";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  return pickLocale(jar.get(LOCALE_COOKIE)?.value);
}

export async function getDict(): Promise<{ locale: Locale; d: Dict }> {
  const locale = await getLocale();
  return { locale, d: dicts[locale] };
}
