"use client";

import { AnimatePresence, m } from "motion/react";
import { DocIcon } from "@/components/docs/icon";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchEntry } from "@/lib/docs";
import { fmt } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

/** Ranks by where the words appear: section title, page title, then group. Every word must match somewhere. */
function rank(entries: SearchEntry[], q: string): SearchEntry[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return entries.filter((e) => !e.section).slice(0, 12);
  return entries
    .map((e) => {
      const section = e.section.toLowerCase();
      const title = e.title.toLowerCase();
      const group = e.group.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (section.includes(w)) score += section.startsWith(w) ? 4 : 3;
        else if (title.includes(w)) score += title.startsWith(w) ? 3 : 2;
        else if (group.includes(w)) score += 1;
        else return null;
      }
      // A whole page edges out one of its own sections on a tie.
      return { e, score: score + (e.section ? 0 : 0.5) };
    })
    .filter((x): x is { e: SearchEntry; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((x) => x.e);
}

/** `hotkey`: only one instance on the page should listen for ⌘K and "/", or both dialogs would open. */
export function DocsSearch({ entries, hotkey = true }: { entries: SearchEntry[]; hotkey?: boolean }) {
  const { d } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => rank(entries, q), [entries, q]);

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setSel(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => input.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => setSel(0), [q]);

  const go = (entry: SearchEntry | undefined) => {
    if (!entry) return;
    setOpen(false);
    router.push(entry.href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass-panel flex h-10 w-full items-center gap-2.5 rounded-full px-3.5 text-sm text-ink-3 transition-colors hover:text-ink-2 sm:w-64"
      >
        <DocIcon name="search" size={16} />
        <span className="flex-1 text-left">{d.docs.search}</span>
        <kbd className="hidden rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-ink-3 sm:inline">⌘K</kbd>
      </button>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
            <m.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} aria-hidden="true" />
            <m.div
              role="dialog"
              aria-modal="true"
              aria-label={d.docs.search}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="relative w-full max-w-xl overflow-hidden rounded-[22px] border border-line bg-[var(--app-bg)] shadow-[var(--elev-float)]"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSel((s) => Math.min(results.length - 1, s + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSel((s) => Math.max(0, s - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  go(results[sel]);
                }
              }}
            >
              <label className="flex h-14 items-center gap-3 border-b border-line px-4 text-ink-3">
                <DocIcon name="search" size={18} />
                <input
                  ref={input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={d.docs.searchPlaceholder}
                  aria-label={d.docs.search}
                  className="h-full flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
                />
                <kbd className="rounded-md border border-line px-1.5 font-mono text-[11px]">Esc</kbd>
              </label>
              <ul className="compact-scroll max-h-[50vh] overflow-y-auto p-2" role="listbox">
                {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-ink-3">{fmt(d.docs.searchEmpty, { q: q.trim() })}</li>}
                {results.map((r, i) => (
                  <li key={r.href} role="option" aria-selected={i === sel}>
                    <button
                      type="button"
                      onMouseEnter={() => setSel(i)}
                      onClick={() => go(r)}
                      className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", i === sel ? "bg-surface-2" : "")}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink-3">{r.section ? <DocIcon name="hash" size={15} /> : <DocIcon name="file" size={15} />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{r.section || r.title}</span>
                        <span className="block truncate text-xs text-ink-3">{r.section ? `${r.group} › ${r.title}` : r.group}</span>
                      </span>
                      {i === sel && <DocIcon name="enter" size={15} className="shrink-0 text-ink-3" />}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-[11px] text-ink-3">
                <kbd className="rounded border border-line px-1 font-mono">↑</kbd>
                <kbd className="rounded border border-line px-1 font-mono">↓</kbd>
                <kbd className="rounded border border-line px-1 font-mono">↵</kbd>
                {d.docs.searchHint}
              </p>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
