import type { Home, PendingRound } from "@/lib/api/types";

/**
 * The single "your next step" card on Home (PRD §19.4.3). Rules are checked in order; the first match wins, and
 * there is always a result, so Home is never a dead end.
 */
export type NextStep =
  | { kind: "join"; round: PendingRound }
  | { kind: "approve"; round: PendingRound }
  | { kind: "settle"; round: PendingRound }
  | { kind: "leftovers"; round: PendingRound }
  | { kind: "wait"; round: PendingRound }
  | { kind: "target" }
  | { kind: "circle" }
  | { kind: "allGood"; circleName: string | null };

const COLLECTING = new Set(["OPEN", "COLLECTING"]);
const APPROVING = new Set(["PROPOSED", "APPROVING", "READY_TO_SETTLE"]);

export function nextStep(home: Home): NextStep {
  const p = home.pending;
  const join = p.find((r) => COLLECTING.has(r.state) && !r.signed);
  if (join) return { kind: "join", round: join };
  // `allowed` is false while the viewer's own token allowance is still missing, even after they signed the plan.
  const approve = p.find((r) => APPROVING.has(r.state) && r.inPlan && (!r.approved || r.allowed === false));
  if (approve) return { kind: "approve", round: approve };
  const settle = p.find((r) => r.state === "READY_TO_SETTLE" && r.inPlan);
  if (settle) return { kind: "settle", round: settle };
  const leftovers = p.find((r) => r.residualUndecidedUsd > 0);
  if (leftovers) return { kind: "leftovers", round: leftovers };
  const wait = p.find((r) => r.signed && r.state !== "COMPLETE" && r.state !== "NO_CROSS" && r.state !== "EXPIRED");
  if (wait) return { kind: "wait", round: wait };
  if (!home.target) return { kind: "target" };
  if (home.circles.length === 0) return { kind: "circle" };
  return { kind: "allGood", circleName: home.circles[0]?.name ?? null };
}
