import { getAddress, isAddress } from "viem";
import { IconCircles, IconLayers, IconLeftovers, IconReceive, IconRoundArrows, IconSent, IconSigned, IconSwap, IconTarget, IconX } from "@/components/icons";
import { sama } from "@/lib/api";
import type { ActivityQuery } from "@/lib/api/contract";
import type { Activity, RoundView } from "@/lib/api/types";
import { activityGroup, activityKey } from "@/lib/activity";
import { EXPLORER } from "@/lib/chain";

export type Group = "rounds" | "circles" | "targets" | "leftovers" | "transfers";
export type Filter = "all" | Group;
export type Range = "all" | "week" | "month";
export type Amount = { symbol: string; amountTokens: number; valueUsd: number };
export type ActivityData = { list: Activity[]; rounds: Map<string, RoundView> };

/** Icon per kind of activity: `tone` tints the icon on its own, `fill` is the solid disc used on phones. */
export const GROUP = {
  rounds: { Icon: IconSwap, tone: "text-match", fill: "bg-match" },
  circles: { Icon: IconCircles, tone: "text-accent", fill: "bg-accent" },
  targets: { Icon: IconTarget, tone: "text-ok", fill: "bg-ok" },
  leftovers: { Icon: IconLayers, tone: "text-rest", fill: "bg-rest" },
  transfers: { Icon: IconSwap, tone: "text-accent", fill: "bg-accent" },
} as const;

/** Icon per activity kind, so each row says what happened: sent, received, signed, and so on. Kinds not listed fall back to their group's icon. */
export const KIND_ICON: Partial<Record<string, { Icon: typeof IconSent; tone: string }>> = {
  TRANSFER_OUT: { Icon: IconSent, tone: "text-accent" },
  TRANSFER_IN: { Icon: IconReceive, tone: "text-ok" },
  TARGET_SAVED: { Icon: IconTarget, tone: "text-ok" },
  INTENT_SIGNED: { Icon: IconSigned, tone: "text-match" },
  ROUND_MATCHED: { Icon: IconRoundArrows, tone: "text-match" },
  ROUND_NO_CROSS: { Icon: IconX, tone: "text-ink-3" },
  RESIDUAL_DECIDED: { Icon: IconLeftovers, tone: "text-rest" },
  RESIDUAL_SWAPPED: { Icon: IconLeftovers, tone: "text-rest" },
  // Outcomes where something went wrong get a red cross, so they never read like a success at a glance.
  ROUND_FAILED: { Icon: IconX, tone: "text-danger" },
  SETTLED_UNVERIFIED: { Icon: IconX, tone: "text-danger" },
  RESIDUAL_FAILED: { Icon: IconX, tone: "text-danger" },
  RESIDUAL_SHORT: { Icon: IconX, tone: "text-danger" },
};

const BAD = new Set(["ROUND_FAILED", "SETTLED_UNVERIFIED", "RESIDUAL_FAILED", "RESIDUAL_SHORT"]);

/** The icon and tint for one activity row, chosen by its outcome (`activityKey`), not only its kind. */
export function iconOf(a: Activity): { Icon: typeof IconSent; tone: string; fill: string } {
  const k = activityKey(a);
  const group = GROUP[activityGroup(a.kind)];
  const own = KIND_ICON[k];
  return own ? { ...group, ...own, ...(BAD.has(k) ? { fill: "bg-danger" } : {}) } : group;
}

/** True when the row's outcome went wrong (a failed round, an unverified settlement, a reverted or short swap). */
export function isFailed(a: Activity): boolean {
  return BAD.has(activityKey(a));
}

/**
 * Loads the next page of activity and appends it to `prev`, plus the rounds the new rows point at, so rows can show the
 * real tokens moved and the settlement transaction. Rounds already loaded are not fetched again.
 */
export async function loadActivityPage(query: ActivityQuery, prev: ActivityData | null): Promise<ActivityData & { nextCursor: string | null }> {
  const page = await sama.activity(query);
  const rounds = new Map<string, RoundView>(prev?.rounds ?? []);
  const ids = [...new Set(page.items.map((a) => a.roundId).filter((id): id is string => !!id && !rounds.has(id)))];
  const views = await Promise.allSettled(ids.map((id) => sama.round(id)));
  views.forEach((v, i) => v.status === "fulfilled" && rounds.set(ids[i]!, v.value));
  const seen = new Set(prev?.list.map((a) => a.id) ?? []);
  const list = [...(prev?.list ?? []), ...page.items.filter((a) => !seen.has(a.id) && !isPoison(a))];
  return { list, rounds, nextCursor: page.nextCursor };
}

/**
 * A zero-value token transfer. Anyone can log one "from" any wallet (transferFrom of 0 needs no allowance), which is how
 * address poisoning plants a lookalike in the history. Like MetaMask, these never show; the backend drops them too.
 */
export function isPoison(a: Activity): boolean {
  return (a.kind === "TRANSFER_IN" || a.kind === "TRANSFER_OUT") && Number(a.detail.amount) === 0;
}

/**
 * What left and what arrived for this row. A leftover swap shows the amounts the chain moved; a settlement shows its
 * legs only once the verifier passed, since an unverified settlement's plan is not proof anything moved.
 */
export function flow(a: Activity, r: RoundView | undefined): { out: Amount[]; in: Amount[] } {
  const k = activityKey(a);
  if (k === "SETTLED_UNVERIFIED" || k === "RESIDUAL_FAILED") return { out: [], in: [] };
  if (a.kind === "RESIDUAL_DECIDED" && typeof a.detail.soldSymbol === "string") {
    const price = (symbol: string) => r?.round.prices.find((p) => p.symbol === symbol)?.priceUsd ?? 0;
    const moved = (symbol: unknown, amount: unknown): Amount[] => {
      const n = Number(amount);
      return typeof symbol === "string" && n > 0 ? [{ symbol, amountTokens: n, valueUsd: n * price(symbol) }] : [];
    };
    return { out: moved(a.detail.soldSymbol, a.detail.soldAmount), in: moved(a.detail.boughtSymbol, a.detail.boughtAmount) };
  }
  if (!r) return { out: [], in: [] };
  if (a.kind === "RESIDUAL_DECIDED") return { out: r.you.residual.filter((x) => x.side === "SELL"), in: r.you.residual.filter((x) => x.side === "BUY") };
  if (r.you.legs.length && a.kind !== "INTENT_SIGNED") {
    return { out: r.you.legs.filter((l) => l.direction === "SEND"), in: r.you.legs.filter((l) => l.direction === "RECEIVE") };
  }
  return { out: r.you.intent.filter((x) => x.side === "SELL"), in: r.you.intent.filter((x) => x.side === "BUY") };
}

/** The onchain transaction behind a row, when there is one: the settlement, the leftover swap, or a transfer. */
export function txOf(a: Activity, r: RoundView | undefined): string | null {
  if (a.kind === "SETTLED") return r?.round.settlementTx ?? null;
  if (a.kind === "RESIDUAL_DECIDED") return r?.you.decision?.txHash ?? null;
  if (a.kind === "TRANSFER_IN" || a.kind === "TRANSFER_OUT") return typeof a.detail.tx === "string" ? a.detail.tx : null;
  return null;
}

/** A transfer row's token, from the fields the backend writes on TRANSFER_IN and TRANSFER_OUT. */
export type Transfer = { sign: "+" | "−"; amount: number; symbol: string; logo: string | null; token: string | null };

export function transferOf(a: Activity): Transfer | null {
  if (a.kind !== "TRANSFER_IN" && a.kind !== "TRANSFER_OUT") return null;
  if (typeof a.detail.symbol !== "string") return null;
  return {
    sign: a.kind === "TRANSFER_IN" ? "+" : "−",
    amount: Number(a.detail.amount) || 0,
    symbol: a.detail.symbol,
    logo: typeof a.detail.logo === "string" && a.detail.logo.startsWith("https://") ? a.detail.logo : null,
    token: typeof a.detail.token === "string" ? a.detail.token : null,
  };
}

/** One side of a movement: a label, and an explorer link when the label is an address. */
export type Party = { label: string; href: string | null };

/** Who sent and who received for a row, with `you` for the viewer. Empty when the row names no counterparty. */
export function partiesOf(a: Activity, r: RoundView | undefined, you: string): { from: Party | null; to: Party | null } {
  const self: Party = { label: you, href: null };
  // Addresses read in EIP-55 checksum casing, as wallets and the explorer show them.
  const other = (s: string): Party => (isAddress(s, { strict: false }) ? { label: getAddress(s), href: `${EXPLORER}/address/${s}` } : { label: s, href: null });
  if (a.kind === "TRANSFER_IN" || a.kind === "TRANSFER_OUT") {
    if (typeof a.detail.counterparty !== "string") return { from: null, to: null };
    return a.kind === "TRANSFER_IN" ? { from: other(a.detail.counterparty), to: self } : { from: self, to: other(a.detail.counterparty) };
  }
  const leg = r?.you.legs[0];
  if (!leg) return { from: null, to: null };
  return leg.direction === "SEND" ? { from: self, to: other(leg.counterparty) } : { from: other(leg.counterparty), to: self };
}

const PANCAKE_ROUTER = "0x13f4ea83d0bd40e75c8222255bc855a974568dd4";

/** A name for a contract the app itself talks to (the round's settlement contract, PancakeSwap's router), else null. */
export function knownAddress(address: string, data: ActivityData, names: { settlement: string; router: string }): string | null {
  const a = address.toLowerCase();
  if (a === PANCAKE_ROUTER) return names.router;
  for (const r of data.rounds.values()) if (r.round.settlementContract.toLowerCase() === a) return names.settlement;
  return null;
}

/**
 * Counterparties that look like another one in the list: same first and last four hex digits, different address.
 * That is how address poisoning hides a lookalike in a shortened `0x6f4b…9c89`, so these rows get a warning.
 */
export function lookalikes(list: Activity[]): Set<string> {
  const byShape = new Map<string, Set<string>>();
  for (const a of list) {
    const c = typeof a.detail.counterparty === "string" ? a.detail.counterparty.toLowerCase() : "";
    if (!/^0x[0-9a-f]{40}$/.test(c)) continue;
    const shape = `${c.slice(2, 6)}…${c.slice(-4)}`;
    byShape.set(shape, (byShape.get(shape) ?? new Set()).add(c));
  }
  return new Set([...byShape.values()].filter((s) => s.size > 1).flatMap((s) => [...s]));
}

/** The Circle a row belongs to, from its round or from the activity's own detail. */
export function circleOf(a: Activity, r: RoundView | undefined): string | null {
  return r?.circle.name ?? (typeof a.detail.name === "string" ? a.detail.name : typeof a.detail.circle === "string" ? a.detail.circle : null);
}
