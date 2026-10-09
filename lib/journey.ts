import type { RoundState, RoundView } from "@/lib/api/types";

/**
 * Maps the unchanged backend state machine (PRD §12) onto the seven steps of the single-page round journey
 * (PRD §19.4.6). Exactly one step is "current"; it is the one that shows its body and primary action.
 */
export type StepKey = "join" | "match" | "result" | "approve" | "settle" | "leftovers" | "receipt";
export type StepStatus = "done" | "active" | "upcoming" | "failed" | "skipped";

export const STEP_ORDER: StepKey[] = ["join", "match", "result", "approve", "settle", "leftovers", "receipt"];

const COLLECTING = new Set<RoundState>(["DRAFT", "OPEN", "COLLECTING"]);
const SOLVING = new Set<RoundState>(["FROZEN", "SOLVING"]);
const APPROVING = new Set<RoundState>(["PROPOSED", "APPROVING", "READY_TO_SETTLE"]);
const SETTLING = new Set<RoundState>(["SETTLING", "SETTLED", "VERIFYING", "RESIDUAL_EXECUTION"]);
/** The round ended before anything settled; nothing moved. */
export const ENDED_EARLY = new Set<RoundState>(["EXPIRED", "INSUFFICIENT_PARTICIPANTS", "PLAN_STALE", "PLAN_REJECTED", "CANCELLED"]);

export function journey(v: RoundView): { current: StepKey; status: Record<StepKey, StepStatus> } {
  const s = v.round.state;
  const status = Object.fromEntries(STEP_ORDER.map((k) => [k, "upcoming"])) as Record<StepKey, StepStatus>;
  const at = (key: StepKey, how: StepStatus = "active") => {
    for (const k of STEP_ORDER) {
      if (k === key) break;
      if (status[k] === "upcoming") status[k] = "done";
    }
    status[key] = how;
    return { current: key, status };
  };

  if (COLLECTING.has(s)) return at(v.you.signed ? "match" : "join");
  if (!v.you.signed) {
    status.join = "skipped";
    return at("result", "failed");
  }
  if (SOLVING.has(s)) return at("match");
  if (ENDED_EARLY.has(s)) return at("result", "failed");

  if (s === "NO_CROSS" || !v.you.inPlan) {
    status.approve = "skipped";
    status.settle = "skipped";
    if (s !== "NO_CROSS" && s !== "COMPLETE") return at("result");
    return v.you.decision ? at("receipt") : at("leftovers");
  }

  // Signing the plan is not enough: the token allowance is a separate transaction. Until it is sent the viewer stays on
  // Approve, otherwise they would be offered "Submit settlement" while their own allowance is what blocks it.
  if (APPROVING.has(s)) return at(v.you.approved && v.you.allowances.every((a) => a.sufficient) ? "settle" : "approve");
  if (SETTLING.has(s)) return at("settle");
  if (s === "SETTLEMENT_REVERTED" || s === "VERIFICATION_FAILED") return at("settle", "failed");

  // COMPLETE and the residual outcomes.
  const leftovers = v.you.residual.some((r) => !r.dust);
  if (leftovers && !v.you.decision) return at("leftovers");
  return at("receipt");
}
