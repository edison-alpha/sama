import type { Locale } from "@/lib/i18n/dict";
import { assets, assistant, circles, leftovers, matching, rounds, settlement, targets } from "./content/concepts";
import { api, architecture, contract, localSetup, signing } from "./content/developers";
import { faq, glossary } from "./content/reference";
import { security, verification } from "./content/security";
import { introduction, quickstart, whySama } from "./content/start";
import { t, type Block, type DocGroup, type DocPage, type T } from "./types";

/** Sidebar order. A page's group is where it appears; prev/next follow this order too. */
export const DOC_GROUPS: DocGroup[] = [
  { title: t("Getting started", "Memulai"), pages: [introduction, whySama, quickstart] },
  { title: t("Concepts", "Konsep"), pages: [targets, assistant, circles, rounds, matching, settlement, leftovers, assets] },
  { title: t("Security", "Keamanan"), pages: [security, verification] },
  { title: t("Developers", "Developer"), pages: [architecture, api, contract, signing, localSetup] },
  { title: t("Reference", "Referensi"), pages: [glossary, faq] },
];

const ALL: Array<{ page: DocPage; group: DocGroup }> = DOC_GROUPS.flatMap((group) => group.pages.map((page) => ({ page, group })));

export const docHref = (slug: string) => (slug ? `/docs/${slug}` : "/docs");

export function findDoc(slug: string): { page: DocPage; group: DocGroup; prev: DocPage | null; next: DocPage | null } | null {
  const i = ALL.findIndex((e) => e.page.slug === slug);
  if (i < 0) return null;
  return { page: ALL[i]!.page, group: ALL[i]!.group, prev: ALL[i - 1]?.page ?? null, next: ALL[i + 1]?.page ?? null };
}

export type TocItem = { id: string; title: string; level: 2 | 3; excerpt: string };

const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

/** Headings for "On this page" and the scroll rail; each carries the first sentence under it for the rail's preview. */
export function tocOf(page: DocPage, locale: Locale): TocItem[] {
  const items: TocItem[] = [];
  page.blocks.forEach((b, i) => {
    if (b.t !== "h2" && b.t !== "h3") return;
    const after = page.blocks.slice(i + 1).find((x) => x.t === "p" || x.t === "callout" || x.t === "h2" || x.t === "h3");
    const excerpt = after && (after.t === "p" || after.t === "callout") ? plain(after.text[locale]).split(/(?<=[.!?])\s/)[0] ?? "" : "";
    items.push({ id: b.id, title: plain(b.text[locale]), level: b.t === "h2" ? 2 : 3, excerpt });
  });
  return items;
}

const md = (v: T, locale: Locale) => v[locale];

/** The page as Markdown, for "Copy page" (pasting into an assistant or an issue). */
export function toMarkdown(page: DocPage, locale: Locale): string {
  const out: string[] = [`# ${md(page.title, locale)}`, "", md(page.description, locale), ""];
  const block = (b: Block) => {
    switch (b.t) {
      case "h2":
        return `## ${md(b.text, locale)}`;
      case "h3":
        return `### ${md(b.text, locale)}`;
      case "p":
        return md(b.text, locale);
      case "list":
        return b.items.map((it, i) => `${b.ordered ? `${i + 1}.` : "-"} ${md(it, locale)}`).join("\n");
      case "callout":
        return `> **${b.title ? md(b.title, locale) : b.tone.toUpperCase()}**\n> ${md(b.text, locale)}`;
      case "code":
        return "```" + b.lang + "\n" + b.code + "\n```";
      case "table": {
        const row = (cells: T[]) => `| ${cells.map((c) => md(c, locale)).join(" | ")} |`;
        return [row(b.head), `|${b.head.map(() => "---").join("|")}|`, ...b.rows.map(row)].join("\n");
      }
      case "steps":
        return b.items.map((s, i) => `${i + 1}. **${md(s.title, locale)}**: ${md(s.text, locale)}`).join("\n");
      case "cards":
        return b.items.map((c) => `- [${md(c.title, locale)}](${c.href}): ${md(c.text, locale)}`).join("\n");
      case "preview":
        return b.code ? "```" + b.code.lang + "\n" + b.code.code + "\n```" : "";
    }
  };
  for (const b of page.blocks) {
    const s = block(b);
    if (s) out.push(s, "");
  }
  return out.join("\n").trim() + "\n";
}

export type SearchEntry = { href: string; title: string; section: string; group: string };

/** Pages and their headings, for the ⌘K search. Small enough to send to the client whole. */
export function searchIndex(locale: Locale): SearchEntry[] {
  return ALL.flatMap(({ page, group }) => {
    const href = docHref(page.slug);
    const title = page.title[locale];
    return [
      { href, title, section: "", group: group.title[locale] },
      ...tocOf(page, locale).map((h) => ({ href: `${href}#${h.id}`, title, section: h.title, group: group.title[locale] })),
    ];
  });
}

export type NavGroup = { title: string; pages: Array<{ href: string; title: string }> };

export function navOf(locale: Locale): NavGroup[] {
  return DOC_GROUPS.map((g) => ({ title: g.title[locale], pages: g.pages.map((p) => ({ href: docHref(p.slug), title: p.title[locale] })) }));
}
