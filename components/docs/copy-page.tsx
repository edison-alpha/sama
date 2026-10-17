"use client";

import { AnimatePresence, m } from "motion/react";
import { Icon } from "@iconify/react";
import { useId, useRef, useState } from "react";
import { useDismiss } from "@/lib/hooks/use-dismiss";
import { useI18n } from "@/lib/i18n/provider";

/** "Copy page" as Markdown, with a menu for the link and for asking Claude or GPT about the page. */
export function CopyPage({ markdown, title }: { markdown: string; title: string }) {
  const { d } = useI18n();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const actionsId = useId();
  useDismiss(open, () => setOpen(false), root, { escape: false });

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyError(false);
      setCopied(true);
      setOpen(false);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopyError(true);
    }
  };

  const prompt = () => `Read this page from the Sama docs and answer my questions about it.\n\n${window.location.href}\n\n${markdown}`;

  const askClaude = () => {
    window.open(`https://claude.ai/new?q=${encodeURIComponent(prompt().slice(0, 6000))}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const askGPT = () => {
    window.open(`https://chatgpt.com/?q=${encodeURIComponent(prompt().slice(0, 6000))}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const item = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-2 hover:bg-surface-2 hover:text-ink";

  return (
    <div ref={root} className="glass-panel relative inline-flex rounded-full" onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        event.stopPropagation();
        setOpen(false);
        toggle.current?.focus();
      }
    }}>
      <button type="button" onClick={() => copy(markdown)} className="inline-flex h-10 items-center gap-2 rounded-l-full px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2/70">
        <Icon icon={copied ? "ph:check-bold" : "ph:copy-duotone"} width={16} height={16} className={copied ? "text-ok" : "text-ink-3"} aria-hidden="true" />
        {copied ? d.docs.copied : d.docs.copyPage}
      </button>
      <button ref={toggle} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={actionsId} aria-label={d.docs.pageActions} className="grid h-11 w-11 place-items-center rounded-r-full border-l border-line text-ink-3 transition-colors hover:bg-surface-2/70 hover:text-ink">
        <Icon icon="ph:caret-down-bold" width={16} height={16} className={open ? "rotate-180 transition-transform" : "transition-transform"} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            id={actionsId}
            role="group"
            aria-label={title}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 top-12 z-30 w-64 max-w-[calc(100vw-2rem)] origin-top-left rounded-[20px] border border-line bg-surface p-1.5 shadow-[var(--elev-float)] sm:left-auto sm:right-0 sm:origin-top-right"
          >
            <button type="button" onClick={() => copy(markdown)} className={item}><Icon icon="ph:file-text-duotone" width={16} height={16} aria-hidden="true" />{d.docs.copyMarkdown}</button>
            <button type="button" onClick={() => copy(window.location.href.split("#")[0]!)} className={item}><Icon icon="ph:link-duotone" width={16} height={16} aria-hidden="true" />{d.docs.copyLink}</button>
            <button type="button" onClick={askClaude} className={item}><Icon icon="simple-icons:claude" width={16} height={16} aria-hidden="true" />{d.docs.askClaude}</button>
            <button type="button" onClick={askGPT} className={item}><Icon icon="simple-icons:openai" width={16} height={16} aria-hidden="true" />{d.docs.askGPT}</button>
          </m.div>
        )}
      </AnimatePresence>
      <span role="status" className="sr-only">{copyError ? d.docs.copyFailed : copied ? d.docs.copied : ""}</span>
    </div>
  );
}
