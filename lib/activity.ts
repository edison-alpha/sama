import type { Activity } from "@/lib/api/types";
import { fmt, type Dict } from "@/lib/i18n/dict";

/** One plain-language line per activity row, shared by Home and Activity. */
export function activityLine(a: Activity, d: Dict): string {
  const kinds = d.activity.kinds as Record<string, string>;
  const template = kinds[a.kind] ?? a.kind;
  return fmt(template, a.detail);
}

export function activityGroup(kind: string): "rounds" | "circles" | "targets" | "leftovers" | "transfers" {
  if (kind === "TRANSFER_IN" || kind === "TRANSFER_OUT") return "transfers";
  if (kind.startsWith("CIRCLE")) return "circles";
  if (kind === "TARGET_SAVED" || kind === "ONBOARDED") return "targets";
  if (kind === "RESIDUAL_DECIDED") return "leftovers";
  return "rounds";
}
