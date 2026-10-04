"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useId, type ReactNode } from "react";
import { IconX } from "@/components/icons";
import { useI18n } from "@/lib/i18n/provider";

/**
 * A modal that slides up from the bottom on phones, like a native sheet, and sits centred on larger screens.
 * Escape or a tap on the backdrop closes it; the page underneath doesn't scroll while it is open.
 */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return <AnimatePresence>{open && <Panel onClose={onClose} title={title} footer={footer}>{children}</Panel>}</AnimatePresence>;
}

function Panel({ onClose, title, children, footer }: { onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const { d } = useI18n();
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
      <m.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden="true" />
      <m.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 36 }}
        className="relative flex max-h-[88dvh] w-full flex-col rounded-t-[28px] border border-line bg-[var(--app-bg)] pb-[env(safe-area-inset-bottom)] shadow-[var(--elev-float)] md:max-h-[86dvh] md:max-w-md md:rounded-[28px] md:pb-0"
      >
        <span className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-surface-3 md:hidden" aria-hidden="true" />
        <header className="grid shrink-0 grid-cols-[40px_1fr_40px] items-center px-4 pt-3 md:px-5 md:pt-5">
          <span />
          <h2 id={titleId} className="text-center text-lg font-semibold tracking-tight text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label={d.common.close} className="grid size-10 place-items-center justify-self-end rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink"><IconX size={20} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">{children}</div>
        {footer && <footer className="shrink-0 border-t border-line px-5 py-4">{footer}</footer>}
      </m.div>
    </div>
  );
}
