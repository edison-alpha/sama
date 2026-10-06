import type { Locale } from "@/lib/i18n/dict";

/** One string in both languages. Docs pages are written once with both side by side, so they never drift apart. */
export type T = { en: string; id: string };

/** Shorthand for a bilingual string. */
export const t = (en: string, id: string): T => ({ en, id });

/** The same text in both languages (names, numbers, code identifiers). */
export const same = (s: string): T => ({ en: s, id: s });

export const pick = (v: T, locale: Locale) => v[locale];

/** Live demos shown in a Preview card; each is a small client component in components/docs/demos.tsx. */
export type DemoKey = "ring" | "pair" | "round" | "target" | "approval" | "checks" | "leftover" | "tiers" | "assistant";

/**
 * Page content. Inline text supports `code`, **bold** and [label](href). Headings get an id from `id` and feed the
 * "On this page" list and the scroll rail.
 */
export type Block =
  | { t: "h2" | "h3"; id: string; text: T }
  | { t: "p"; text: T }
  | { t: "list"; items: T[]; ordered?: boolean }
  | { t: "callout"; tone: "note" | "tip" | "warn"; title?: T; text: T }
  | { t: "code"; lang: string; code: string; title?: string }
  | { t: "table"; head: T[]; rows: T[][] }
  | { t: "steps"; items: Array<{ title: T; text: T }> }
  | { t: "cards"; items: Array<{ title: T; text: T; href: string; icon?: CardIcon }> }
  | { t: "preview"; demo: DemoKey; caption?: T; code?: { lang: string; code: string } };

export type CardIcon = "target" | "circles" | "round" | "shield" | "code" | "layers" | "swap" | "wallet" | "book" | "pulse";

export type DocPage = {
  /** Path under /docs; "" is /docs itself. */
  slug: string;
  title: T;
  description: T;
  blocks: Block[];
};

export type DocGroup = { title: T; pages: DocPage[] };

/** Builders, so content files read like prose. */
export const h2 = (id: string, en: string, idText: string): Block => ({ t: "h2", id, text: t(en, idText) });
export const h3 = (id: string, en: string, idText: string): Block => ({ t: "h3", id, text: t(en, idText) });
export const p = (en: string, idText: string): Block => ({ t: "p", text: t(en, idText) });
export const ul = (...items: Array<[string, string]>): Block => ({ t: "list", items: items.map(([e, i]) => t(e, i)) });
export const ol = (...items: Array<[string, string]>): Block => ({ t: "list", ordered: true, items: items.map(([e, i]) => t(e, i)) });
export const note = (en: string, idText: string, title?: [string, string]): Block => ({ t: "callout", tone: "note", text: t(en, idText), title: title && t(...title) });
export const tip = (en: string, idText: string, title?: [string, string]): Block => ({ t: "callout", tone: "tip", text: t(en, idText), title: title && t(...title) });
export const warn = (en: string, idText: string, title?: [string, string]): Block => ({ t: "callout", tone: "warn", text: t(en, idText), title: title && t(...title) });
export const code = (lang: string, src: string, title?: string): Block => ({ t: "code", lang, code: src.replace(/^\n/, "").replace(/\s+$/, ""), title });
/** A table; a cell given as a plain string is the same in both languages. */
export const table = (head: Array<[string, string]>, rows: Array<Array<string | [string, string]>>): Block => ({
  t: "table",
  head: head.map(([e, i]) => t(e, i)),
  rows: rows.map((r) => r.map((c) => (typeof c === "string" ? same(c) : t(...c)))),
});
export const steps = (...items: Array<[[string, string], [string, string]]>): Block => ({ t: "steps", items: items.map(([a, b]) => ({ title: t(...a), text: t(...b) })) });
export const cards = (...items: Array<{ title: [string, string]; text: [string, string]; href: string; icon?: CardIcon }>): Block => ({
  t: "cards",
  items: items.map((c) => ({ title: t(...c.title), text: t(...c.text), href: c.href, icon: c.icon })),
});
export const preview = (demo: DemoKey, caption?: [string, string], snippet?: { lang: string; code: string }): Block => ({
  t: "preview",
  demo,
  caption: caption && t(...caption),
  code: snippet && { lang: snippet.lang, code: snippet.code.replace(/^\n/, "").replace(/\s+$/, "") },
});
