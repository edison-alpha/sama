"use client";

import { useState, type ReactNode } from "react";
import { DocIcon } from "@/components/docs/icon";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

const KEYWORDS: Record<string, string[]> = {
  ts: ["const", "let", "await", "async", "import", "from", "export", "function", "return", "new", "type", "as", "if", "else", "typeof"],
  solidity: ["struct", "event", "function", "external", "returns", "indexed", "uint256", "uint64", "address", "bytes32", "bytes", "bool", "mapping", "error", "contract", "public", "view", "pure"],
  bash: ["cd", "cp", "curl", "bun", "pnpm", "forge", "export"],
};

/** Comments, strings, numbers and keywords: enough to read code at a glance, without a highlighter dependency. */
function highlight(src: string, lang: string): ReactNode[] {
  const words = KEYWORDS[lang === "tsx" ? "ts" : lang] ?? [];
  const comment = lang === "bash" ? "#[^\\n]*" : "\\/\\/[^\\n]*";
  const re = new RegExp(`(${comment})|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)|(\\b0x[0-9a-fA-F]+\\b|\\b\\d[\\d_.]*\\b)|(\\b(?:${words.join("|") || "\\u0000"})\\b)`, "g");
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of src.matchAll(re)) {
    if (m.index! > last) out.push(src.slice(last, m.index));
    const cls = m[1] ? "text-white/38 italic" : m[2] ? "text-[#7ee2a8]" : m[3] ? "text-[#ffc178]" : "text-[#8fb4ff]";
    out.push(<span key={k++} className={cls}>{m[0]}</span>);
    last = m.index! + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const { d } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={d.docs.copyCode}
      title={d.docs.copyCode}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1400);
        });
      }}
      className={cx("grid size-8 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white", className)}
    >
      <DocIcon name={done ? "check" : "copy"} size={16} className={done ? "text-[#7ee2a8]" : undefined} />
    </button>
  );
}

/** A code sample on a dark terminal card (dark in both themes, like the landing's night panels), with a copy button. */
export function CodeBlock({ code, lang, title }: { code: string; lang: string; title?: string }) {
  return (
    <div className="overflow-hidden rounded-[20px] bg-[#0c0c0f] shadow-[0_1px_0_rgb(255_255_255/0.06)_inset,0_18px_40px_-24px_rgb(0_0_0/0.6)] ring-1 ring-white/[0.08]">
      <div className="flex h-11 items-center gap-3 border-b border-white/[0.07] pl-4 pr-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
        </span>
        <span className="flex-1 truncate font-mono text-xs text-white/50">{title ?? lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="compact-scroll overflow-x-auto px-5 py-4 font-mono text-[13px] leading-6 text-white/80">
        <code>{highlight(code, lang)}</code>
      </pre>
    </div>
  );
}
