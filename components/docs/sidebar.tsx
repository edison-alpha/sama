"use client";

import { DocIcon } from "@/components/docs/icon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DocsDialog } from "@/components/docs/dialog";
import type { NavGroup } from "@/lib/docs";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

function NavList({ groups, onPick }: { groups: NavGroup[]; onPick?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="grid gap-7">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">{g.title}</p>
          <ul className="mt-2 grid gap-0.5">
            {g.pages.map((p) => {
              const normalize = (path: string) => path.replace(/^\/docs(?=\/|$)/, "").replace(/\/$/, "") || "/";
              const on = normalize(pathname) === normalize(new URL(p.href, "https://docs.local").pathname);
              return (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    onClick={onPick}
                    aria-current={on ? "page" : undefined}
                    className={cx("relative flex h-9 items-center rounded-full px-3.5 text-[14.5px] transition-colors", on ? "docs-selected font-semibold" :"text-ink-2 hover:bg-surface-2/70 hover:text-ink")}
                  >
                    {p.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Left column on desktop: every docs page by group, the current one marked. */
export function DocsSidebar({ groups }: { groups: NavGroup[] }) {
  return (
    <nav aria-label="Docs" className="compact-scroll sticky top-20 hidden h-[calc(100dvh-5rem)] overflow-y-auto pb-10 pl-1 pr-3 pt-6 lg:block">
      <NavList groups={groups} />
    </nav>
  );
}

/** Below lg: a Menu button in the header that opens the same list in a sheet. */
export function DocsMobileNav({ groups }: { groups: NavGroup[] }) {
  const { d } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={d.docs.menu} aria-haspopup="dialog" aria-expanded={open} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-1 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink lg:hidden">
        <DocIcon name="menu" size={20} />
        <span>{d.docs.menu}</span>
      </button>
      <DocsDialog open={open} onClose={() => setOpen(false)} label={d.docs.menu}>
        <div className="mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-3xl border border-line bg-bg p-4">
          <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{d.docs.label}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label={d.common.close} className="grid size-11 place-items-center rounded-full text-ink">×</button>
          </div>
          <nav aria-label={d.docs.label} className="compact-scroll min-h-0 overflow-y-auto p-1">
            <NavList groups={groups} onPick={() => setOpen(false)} />
          </nav>
        </div>
      </DocsDialog>
    </>
  );
}
