"use client";

import { useEffect, useState } from "react";
import { IconGlobe, IconMoon, IconSun } from "@/components/icons";
import { Segmented } from "@/components/ui/segmented";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/dict";
import { THEME_KEY } from "./boot-scripts";

export type ThemePref = "system" | "light" | "dark";

function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") delete root.dataset.theme;
  else root.dataset.theme = pref;
  try {
    if (pref === "system") window.localStorage.removeItem(THEME_KEY);
    else window.localStorage.setItem(THEME_KEY, pref);
  } catch {
    // The choice still applies for this page view.
  }
}

export function useTheme(): [ThemePref, (p: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>("system");
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setPref(t === "light" || t === "dark" ? t : "system");
  }, []);
  return [pref, (p) => (applyTheme(p), setPref(p))];
}

/** Compact sun/moon button for the top bar: cycles system → light → dark. */
export function ThemeButton() {
  const { d } = useI18n();
  const [pref, setPref] = useTheme();
  const next: ThemePref = pref === "system" ? "light" : pref === "light" ? "dark" : "system";
  return (
    <button type="button" onClick={() => setPref(next)} className="grid size-10 place-items-center rounded-xl text-ink-2 hover:bg-surface-2 hover:text-ink" aria-label={`${d.theme.label}: ${d.theme[pref]}`} title={`${d.theme.label}: ${d.theme[pref]}`}>
      {pref === "dark" ? <IconMoon /> : pref === "light" ? <IconSun /> : <span className="text-xs font-semibold">A</span>}
    </button>
  );
}

export function ThemeSegmented() {
  const { d } = useI18n();
  const [pref, setPref] = useTheme();
  return <Segmented label={d.theme.label} value={pref} onChange={setPref} options={(["system", "light", "dark"] as const).map((v) => ({ value: v, label: d.theme[v] }))} />;
}

export function LocaleButton() {
  const { locale, setLocale, d } = useI18n();
  const next: Locale = locale === "id" ? "en" : "id";
  return (
    <button type="button" onClick={() => setLocale(next)} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink" aria-label={`${d.language.label}: ${d.language[next]}`}>
      <IconGlobe size={18} />
      {locale.toUpperCase()}
    </button>
  );
}

export function LocaleSegmented() {
  const { locale, setLocale, d } = useI18n();
  return <Segmented label={d.language.label} value={locale} onChange={setLocale} options={(["id", "en"] as const).map((v) => ({ value: v, label: d.language[v] }))} />;
}
