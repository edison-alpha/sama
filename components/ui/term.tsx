"use client";

import { useId, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";

type TermKey = keyof ReturnType<typeof useI18n>["d"]["glossary"];

/**
 * A glossary word with a dotted underline. Hover, focus or tap shows the plain-language definition (PRD §19.7).
 */
export function Term({ k, children }: { k: TermKey; children?: React.ReactNode }) {
  const { d } = useI18n();
  const [open, setOpen] = useState(false);
  const id = useId();
  const [word, definition] = d.glossary[k];
  return (
    <span className="relative inline-block">
      <button
        type="button"
        className="cursor-help underline decoration-dotted decoration-ink-3 underline-offset-4"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
      >
        {children ?? word}
      </button>
      {open && (
        <span role="tooltip" id={id} className="absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-xl bg-ink p-3 text-left text-xs font-normal leading-relaxed text-bg shadow-card">
          <strong className="block font-semibold">{word}</strong>
          {definition}
        </span>
      )}
    </span>
  );
}
