"use client";

import { m } from "motion/react";
import { DocIcon } from "@/components/docs/icon";
import { useEffect, useState } from "react";
import { PreviewRail } from "@/components/motion/preview-rail";
import type { TocItem } from "@/lib/docs";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

/** Offset of the sticky header: a heading counts as "current" once its top passes this line. */
const LINE = 112;

/** The heading the reader is in: the last one whose top has passed the line under the header. */
function useActiveHeading(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    if (ids.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) return setActive(ids[ids.length - 1]!);
      let current = ids[0]!;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= LINE) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ids]);
  return active;
}

function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

/** "On this page" for wide screens: a sticky list with a sliding marker, as in component docs. */
export function DocsTocList({ items }: { items: TocItem[] }) {
  const { d } = useI18n();
  const [ids] = useState(() => items.map((i) => i.id));
  const active = useActiveHeading(ids);
  if (items.length === 0) return null;

  return (
    <nav aria-label={d.docs.onThisPage} className="compact-scroll sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pb-10">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <DocIcon name="outline" size={16} className="text-ink-3" />
        {d.docs.onThisPage}
      </p>
      <ul className="relative mt-4 border-l border-line">
        {items.map((it) => {
          const on = it.id === active;
          return (
            <li key={it.id} className="relative">
              {on && <m.span layoutId="docs-toc-marker" className="absolute -left-px top-0 h-full w-0.5 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 38 }} />}
              <a
                href={`#${it.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(it.id);
                }}
                aria-current={on ? "location" : undefined}
                className={cx("block py-1.5 text-sm leading-snug transition-colors", it.level === 3 ? "pl-7" : "pl-4", on ? "font-semibold text-ink" : "text-ink-3 hover:text-ink")}
              >
                {it.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Medium screens, where the outline column doesn't fit: a tick rail at the right edge. Hover or focus a tick to
 * preview the section, click to jump to it. */
export function DocsTocRail({ items }: { items: TocItem[] }) {
  const { d } = useI18n();
  const [ids] = useState(() => items.map((i) => i.id));
  const active = useActiveHeading(ids);
  if (items.length < 2) return null;

  return (
    <div className="pointer-events-none fixed right-2 top-1/2 z-40 hidden w-[340px] -translate-y-1/2 lg:block xl:hidden">
      <PreviewRail
        label={d.docs.sectionsRail}
        items={items.map((it) => ({ id: it.id, label: it.title, description: it.excerpt || undefined }))}
        activeId={active}
        highlightActive
        previewSide="before"
        itemSize={18}
        onItemSelect={(it) => goTo(it.id)}
        className="pointer-events-none min-h-0 justify-end"
        railClassName="pointer-events-auto"
        renderPreview={(it) => (
          <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-[var(--elev-float)]">
            <p className="text-sm font-semibold text-ink">{it.label}</p>
            {it.description ? <p className="mt-1 line-clamp-3 text-xs leading-5 text-ink-3">{it.description}</p> : null}
          </div>
        )}
      />
    </div>
  );
}

/** Phones and tablets: the same list, folded at the top of the article. */
export function DocsTocInline({ items }: { items: TocItem[] }) {
  const { d } = useI18n();
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <div className="mt-8 rounded-2xl border border-line xl:hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex h-12 w-full items-center justify-between px-4 text-sm font-semibold text-ink">
        <span className="flex items-center gap-2"><DocIcon name="outline" size={16} className="text-ink-3" />{d.docs.onThisPage}</span>
        <DocIcon name="caretDown" size={16} className={cx("text-ink-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="grid gap-0.5 border-t border-line px-2 py-2">
          {items.map((it) => (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  goTo(it.id);
                }}
                className={cx("block rounded-lg py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink", it.level === 3 ? "pl-7" : "pl-3")}
              >
                {it.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
