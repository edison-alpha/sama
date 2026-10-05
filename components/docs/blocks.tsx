import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { CodeBlock } from "@/components/docs/code-block";
import { DocIcon, type DocIconName } from "@/components/docs/icon";
import { Inline } from "@/components/docs/inline";
import { PreviewCard } from "@/components/docs/preview-card";
import { Scene } from "@/components/landing/scene";
import { TONES, type Tone } from "@/components/landing/scene-tones";
import type { Block, CardIcon } from "@/lib/docs/types";
import type { Locale } from "@/lib/i18n/dict";
import { cx } from "@/utils/cx";

const CARD_ICON: Record<CardIcon, DocIconName> = {
  target: "target",
  circles: "circles",
  round: "round",
  shield: "shield",
  code: "api",
  layers: "stack",
  swap: "swap",
  wallet: "wallet",
  book: "idea",
  pulse: "quickstart",
};

/** Card scenes cycle through the landing palette so a grid never repeats a colour side by side. */
const CARD_TONES: Tone[] = [TONES.navy, TONES.amber, TONES.ocean, TONES.forest, TONES.plum, TONES.slate];

const CALLOUT: Record<"note" | "tip" | "warn", { icon: DocIconName; orb: string }> = {
  note: { icon: "note", orb: "bg-match-soft text-match" },
  tip: { icon: "tip", orb: "bg-ok-soft text-ok" },
  warn: { icon: "warn", orb: "bg-warn-soft text-warn" },
};

function Heading({ level, id, children }: { level: 2 | 3; id: string; children: ReactNode }) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <Tag id={id} data-docs-heading className={cx("group scroll-mt-24 text-ink", level === 2 ? "mt-16 text-[1.7rem] font-medium leading-tight tracking-[-0.025em] first:mt-0" : "mt-10 text-lg font-semibold tracking-tight")}>
      <a href={`#${id}`} className="inline-flex items-center">
        {children}
        <DocIcon name="hash" size={level === 2 ? 18 : 15} className="ml-2 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
    </Tag>
  );
}

export function DocBlocks({ blocks, locale }: { blocks: Block[]; locale: Locale }) {
  return (
    <div className="text-[15.5px] leading-7 text-ink-2">
      {blocks.map((b, i) => (
        <DocBlock key={i} b={b} locale={locale} />
      ))}
    </div>
  );
}

function DocBlock({ b, locale }: { b: Block; locale: Locale }) {
  switch (b.t) {
    case "h2":
    case "h3":
      return <Heading level={b.t === "h2" ? 2 : 3} id={b.id}><Inline text={b.text[locale]} /></Heading>;
    case "p":
      return <p className="mt-4 text-pretty"><Inline text={b.text[locale]} /></p>;
    case "list":
      return b.ordered ? (
        <ol className="mt-5 grid gap-3">
          {b.items.map((it, i) => (
            <li key={i} className="grid grid-cols-[26px_1fr] gap-3">
              <span className="mt-0.5 grid size-[26px] place-items-center rounded-full bg-surface-2 font-mono text-[11px] font-semibold text-ink ring-1 ring-line">{i + 1}</span>
              <span><Inline text={it[locale]} /></span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mt-5 grid gap-2.5">
          {b.items.map((it, i) => (
            <li key={i} className="grid grid-cols-[18px_1fr] gap-2.5">
              <span className="mt-[11px] size-1.5 rounded-full bg-accent" aria-hidden="true" />
              <span><Inline text={it[locale]} /></span>
            </li>
          ))}
        </ul>
      );
    case "callout": {
      const c = CALLOUT[b.tone];
      return (
        <aside className="glass-panel mt-7 flex gap-3.5 rounded-[20px] p-4 pr-5">
          <span className={cx("grid size-9 shrink-0 place-items-center rounded-full", c.orb)}><DocIcon name={c.icon} size={20} /></span>
          <div className="min-w-0 pt-1 text-[15px] leading-relaxed">
            {b.title && <p className="font-semibold text-ink">{b.title[locale]}</p>}
            <p className={b.title ? "mt-0.5" : ""}><Inline text={b.text[locale]} /></p>
          </div>
        </aside>
      );
    }
    case "code":
      return <div className="mt-6"><CodeBlock code={b.code} lang={b.lang} title={b.title} /></div>;
    case "table":
      return (
        <div className="glass-panel compact-scroll mt-6 overflow-x-auto rounded-[20px]">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr>
                {b.head.map((h, i) => (
                  <th key={i} scope="col" className="border-b border-line px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-ink-3">{h[locale]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r} className="align-top transition-colors [&:not(:last-child)>td]:border-b [&>td]:border-line hover:bg-surface-2/40">
                  {row.map((cell, c) => (
                    <td key={c} className={cx("px-4 py-3 leading-6", c === 0 ? "font-medium text-ink" : "text-ink-2")}><Inline text={cell[locale]} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "steps":
      return (
        <ol className="mt-7 grid">
          {b.items.map((s, i) => (
            <li key={i} className="relative grid grid-cols-[40px_1fr] gap-4 pb-7 last:pb-0">
              {i < b.items.length - 1 && <span className="absolute left-[19.5px] top-11 bottom-2 w-px bg-gradient-to-b from-accent/50 to-line" aria-hidden="true" />}
              <span className="glass-panel grid size-10 place-items-center rounded-full font-mono text-[13px] font-semibold text-ink">{String(i + 1).padStart(2, "0")}</span>
              <div className="pt-1.5">
                <p className="font-semibold text-ink">{s.title[locale]}</p>
                <p className="mt-1"><Inline text={s.text[locale]} /></p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "cards":
      return (
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {b.items.map((c, i) => (
            <Link key={c.href} href={c.href} className="docs-card group block rounded-[28px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]" style={{ "--i": i } as CSSProperties}>
              <Scene tone={CARD_TONES[i % CARD_TONES.length]!} flat className="h-[220px]">
                <div className="flex h-full flex-col justify-between p-5">
                  <div className="flex items-start justify-between">
                    <span className="glass glass-frost grid size-12 place-items-center rounded-2xl text-white">
                      <DocIcon name={c.icon ? CARD_ICON[c.icon] : "book"} size={24} />
                    </span>
                    <span className="glass glass-frost grid size-9 place-items-center rounded-full text-white transition-transform duration-300 group-hover:-rotate-45">
                      <DocIcon name="arrowRight" size={15} />
                    </span>
                  </div>
                  <div>
                    <p className="text-xl font-normal tracking-[-0.02em] text-white">{c.title[locale]}</p>
                    <p className="mt-1 text-pretty text-sm leading-relaxed text-white/70">{c.text[locale]}</p>
                  </div>
                </div>
              </Scene>
            </Link>
          ))}
        </div>
      );
    case "preview":
      return <PreviewCard demo={b.demo} caption={b.caption?.[locale]} code={b.code} />;
  }
}
