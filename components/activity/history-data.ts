import { IconCircles, IconLayers, IconSwap, IconTarget } from "@/components/icons";
import { sama } from "@/lib/api";
import type { Activity, RoundView } from "@/lib/api/types";

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

export const RANGE_DAYS: Record<Range, number | null> = { all: null, week: 7, month: 30 };

/** Activity plus the rounds it points at, so rows can show the real tokens moved and the settlement transaction. */
export async function loadActivity(): Promise<ActivityData> {
  const list = await sama.activity();
  const ids = [...new Set(list.map((a) => a.roundId).filter((id): id is string => !!id))];
  const views = await Promise.allSettled(ids.map((id) => sama.round(id)));
  const rounds = new Map<string, RoundView>();
  views.forEach((v, i) => v.status === "fulfilled" && rounds.set(ids[i]!, v.value));
  return { list, rounds };
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

/** The onchain transaction behind a row, when there is one: the settlement, or the leftover swap. */
export function txOf(a: Activity, r: RoundView | undefined): string | null {
  if (a.kind === "SETTLED") return r?.round.settlementTx ?? null;
  if (a.kind === "RESIDUAL_DECIDED") return r?.you.decision?.txHash ?? null;
  return null;
}

/** The Circle a row belongs to, from its round or from the activity's own detail. */
export function circleOf(a: Activity, r: RoundView | undefined): string | null {
  return r?.circle.name ?? (typeof a.detail.name === "string" ? a.detail.name : typeof a.detail.circle === "string" ? a.detail.circle : null);
}
