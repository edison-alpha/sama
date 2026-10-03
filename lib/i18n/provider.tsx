"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo } from "react";
import { dicts, fmt, LOCALE_COOKIE, type Dict, type Locale } from "./dict";

type I18n = { locale: Locale; d: Dict; fmt: typeof fmt; setLocale: (next: Locale) => void };

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      router.refresh();
    },
    [router],
  );
  const value = useMemo(() => ({ locale, d: dicts[locale], fmt, setLocale }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
