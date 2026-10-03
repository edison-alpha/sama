/**
 * Shapes the Sama API returns. They mirror Venue0's server types (lib/server/round-view.ts, home.ts, circles.ts) so the
 * migrated backend can serve this frontend without changing its routes (PRD §18.2, Appendix C).
 */

export type AssetClass = "CRYPTO" | "STABLE" | "RWA";

export type Asset = {
  /** `${chainId}:${checksumAddress}` — the symbol is display only (PRD §7.1). */
  uid: string;
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  class: AssetClass;
  priceUsd: number;
  disclosure?: string;
};

export type Position = { symbol: string; amountTokens: number; valueUsd: number; pct: number };

export type Portfolio = { ok: true; totalUsd: number; readAt: string; positions: Position[] } | { ok: false; detail: string };

export type ResidualStyle = "ECONOMIC" | "CARRY_FORWARD" | "CANCEL";

export type Target = { weights: Record<string, number>; costCapBps: number; residualStyle: ResidualStyle; savedAt: string };

export type TargetPreview = { ok: boolean; problems: string[]; trades: Array<{ symbol: string; side: Side; amountTokens: number; valueUsd: number }> };

export type Drift = { symbol: string; currentPct: number; targetPct: number };

export type Visibility = "PUBLIC" | "INVITE_ONLY" | "PRIVATE";

export type RoundState =
  | "DRAFT" | "OPEN" | "COLLECTING" | "FROZEN" | "SOLVING" | "PROPOSED" | "APPROVING" | "READY_TO_SETTLE"
  | "SETTLING" | "SETTLED" | "RESIDUAL_EXECUTION" | "VERIFYING" | "COMPLETE"
  | "EXPIRED" | "INSUFFICIENT_PARTICIPANTS" | "NO_CROSS" | "PLAN_REJECTED" | "PLAN_STALE" | "SETTLEMENT_REVERTED"
  | "RESIDUAL_PARTIAL" | "RESIDUAL_FAILED" | "VERIFICATION_FAILED" | "CANCELLED";

export type Circle = {
  id: string;
  name: string;
  description: string;
  visibility: Visibility;
  assetSymbols: string[];
  cadenceSec: number | null;
  durationSec: number;
  minParticipants: number;
  memberCount: number;
  residualBehavior: ResidualStyle;
  role: "ORGANIZER" | "MEMBER" | null;
  liveRound: { id: string; sequence: number; state: RoundState; freezesAt: number } | null;
  nextRoundAt: string | null;
  history: Array<{ id: string; sequence: number; state: RoundState; crossedUsd: number; endedAt: string }>;
};

export type NewCircle = Pick<Circle, "name" | "description" | "visibility" | "assetSymbols" | "cadenceSec" | "durationSec" | "minParticipants" | "residualBehavior">;

export type Side = "SELL" | "BUY";
export type ResidualChoice = "CARRY_FORWARD" | "EXECUTE_NOW" | "CANCEL";
export type EngineDecision = "EXECUTE_NOW" | "LIMIT" | "TWAP" | "WAIT" | "AGGREGATE" | "CANCEL";

export type VerifierCheck = { name: string; status: "PASS" | "FAIL" | "INCONCLUSIVE"; detail: string };

export type RoundView = {
  round: {
    id: string;
    sequence: number;
    state: RoundState;
    terminal: boolean;
    freezesAt: number;
    snapshotHash: string;
    prices: Array<{ symbol: string; priceUsd: number }>;
    settlementContract: `0x${string}`;
    settlementTx: `0x${string}` | null;
    planHash: string | null;
    planValidUntil: number | null;
    history: Array<{ state: RoundState; at: string; reason: string | null }>;
    verification: {
      status: "PASS" | "FAIL" | "INCONCLUSIVE";
      blockNumber: string | null;
      checks: VerifierCheck[];
      providers: { executor: string; verifier: string; independent: boolean } | null;
    } | null;
  };
  circle: { id: string; name: string; assetSymbols: string[]; minParticipants: number; memberCount: number; residualBehavior: ResidualStyle; isOrganizer: boolean };
  you: {
    signed: boolean;
    intent: Array<{ symbol: string; side: Side; amountTokens: number; valueUsd: number }>;
    outsideCircle: string[];
    legs: Array<{ direction: "SEND" | "RECEIVE"; counterparty: string; symbol: string; amountTokens: number; valueUsd: number }>;
    inPlan: boolean;
    approved: boolean;
    allowances: Array<{ token: `0x${string}`; symbol: string; amountRaw: bigint; amountTokens: number; sufficient: boolean; funded: boolean }>;
    residual: Array<{ symbol: string; side: Side; amountTokens: number; valueUsd: number; dust: boolean }>;
    recommendation: { decision: EngineDecision | null; reasons: string[]; canExecute: boolean; costPct: number | null } | null;
    decision: { choice: ResidualChoice; txHash: string | null } | null;
  };
  aggregate: { signed: number; participants: number; approvals: number; requestedUsd: number; crossedUsd: number; residualUsd: number; crossRateBps: number; legCount: number; cycleCount: number };
  /** Gas for approve and settle is paid by the paymaster when true (PRD §6.3). */
  gasSponsored: boolean;
};

export type Activity = { id: string; kind: string; detail: Record<string, string | number>; roundId: string | null; createdAt: string };

export type PendingRound = {
  roundId: string;
  circleName: string;
  state: RoundState;
  freezesAt: number;
  signed: boolean;
  approved: boolean;
  inPlan: boolean;
  residualUndecidedUsd: number;
};

export type Home = {
  portfolio: Portfolio;
  target: Target | null;
  drift: Drift[];
  totalDriftPct: number;
  circles: Circle[];
  activity: Activity[];
  pending: PendingRound[];
};

export type Settings = { notify: { email: boolean; telegram: boolean; inApp: boolean }; residualStyle: ResidualStyle; costCapBps: number; gasSponsorship: boolean };

export type Session = { address: `0x${string}`; demo: boolean };
