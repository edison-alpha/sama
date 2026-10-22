import type { Activity } from "@/lib/api/types";
import { tokens } from "@/lib/format";
import { fmt, type Dict, type Locale } from "@/lib/i18n/dict";

/**
 * The template a row reads with: its kind, or a more exact outcome stored in its detail, so a settlement that failed
 * its check or a swap that reverted never reads like a success.
 */
export function activityKey(a: Activity): string {
  if (a.kind === "SETTLED" && typeof a.detail.verifier === "string" && a.detail.verifier !== "PASS") return "SETTLED_UNVERIFIED";
  if (a.kind === "RESIDUAL_DECIDED" && a.detail.choice === "EXECUTE_NOW") {
    if (a.detail.outcome === "REVERTED" || a.detail.receiptStatus === "reverted") return "RESIDUAL_FAILED";
    if (a.detail.outcome === "BELOW_MINIMUM") return "RESIDUAL_SHORT";
    if (typeof a.detail.soldSymbol === "string") return "RESIDUAL_SWAPPED";
  }
  return a.kind;
}

/** One plain-language line per activity row, shared by Home and Activity. */
export function activityLine(a: Activity, d: Dict, locale: Locale = "en"): string {
  const kinds = d.activity.kinds as Record<string, string>;
  const key = activityKey(a);
  const template = kinds[key] ?? kinds[a.kind] ?? a.kind;
  // Amounts arrive as exact decimal strings; show them the way the rest of the app shows token amounts.
  const amount = (v: unknown) => (typeof v === "string" && v !== "" && Number.isFinite(Number(v)) ? tokens(Number(v), locale) : v);
  const failed = d.activity.failed as Record<string, string>;
  const vars: Record<string, string | number> = { ...a.detail };
  for (const f of ["amount", "soldAmount", "boughtAmount"]) if (f in vars) vars[f] = amount(vars[f]) as string | number;
  if (a.kind === "ROUND_FAILED") vars.why = failed[String(a.detail.state)] ?? String(a.detail.state);
  return fmt(template, vars);
}

export function activityGroup(kind: string): "rounds" | "circles" | "targets" | "leftovers" | "transfers" {
  if (kind === "TRANSFER_IN" || kind === "TRANSFER_OUT") return "transfers";
  if (kind.startsWith("CIRCLE")) return "circles";
  if (kind === "TARGET_SAVED" || kind === "ONBOARDED") return "targets";
  if (kind === "RESIDUAL_DECIDED") return "leftovers";
  return "rounds";
}
