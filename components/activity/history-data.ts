import { IconCircles, IconLayers, IconLeftovers, IconReceive, IconRoundArrows, IconSent, IconSigned, IconSwap, IconTarget, IconX } from "@/components/icons";
import { sama } from "@/lib/api";
import type { ActivityQuery } from "@/lib/api/contract";
import type { Activity, RoundView } from "@/lib/api/types";
import { activityGroup } from "@/lib/activity";
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
};

/** The icon and tint for one activity row: its kind's icon when it has one, otherwise its group's. */
export function iconOf(kind: string): { Icon: typeof IconSent; tone: string; fill: string } {
  const group = GROUP[activityGroup(kind)];
  const own = KIND_ICON[kind];
  return own ? { ...group, ...own } : group;
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
  const list = [...(prev?.list ?? []), ...page.items.filter((a) => !seen.has(a.id))];
  return { list, rounds, nextCursor: page.nextCursor };
}

/** What left and what arrived for this row: settled legs once there is a plan, the signed intent before that. */
export function flow(a: Activity, r: RoundView | undefined): { out: Amount[]; in: Amount[] } {
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
  const other = (s: string): Party => ({ label: s, href: /^0x[0-9a-fA-F]{40}$/.test(s) ? `${EXPLORER}/address/${s}` : null });
  if (a.kind === "TRANSFER_IN" || a.kind === "TRANSFER_OUT") {
    if (typeof a.detail.counterparty !== "string") return { from: null, to: null };
    return a.kind === "TRANSFER_IN" ? { from: other(a.detail.counterparty), to: self } : { from: self, to: other(a.detail.counterparty) };
  }
  const leg = r?.you.legs[0];
  if (!leg) return { from: null, to: null };
  return leg.direction === "SEND" ? { from: self, to: other(leg.counterparty) } : { from: other(leg.counterparty), to: self };
}

/** The Circle a row belongs to, from its round or from the activity's own detail. */
export function circleOf(a: Activity, r: RoundView | undefined): string | null {
  return r?.circle.name ?? (typeof a.detail.name === "string" ? a.detail.name : typeof a.detail.circle === "string" ? a.detail.circle : null);
}
