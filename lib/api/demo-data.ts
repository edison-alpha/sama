import { BSTOCKS, CASH } from "./bstocks.generated";
import type { Activity, Asset, Circle, Target } from "./types";

/**
 * Sample data for mock mode. The asset list is the real bStocks allowlist on BSC mainnet (sama-packages/assets/
 * allowlist/56.json, exported by sama-packages/scripts/assets/export-frontend.mjs) plus USDT as cash. Prices are the snapshot
 * taken when the list was generated; the demo wallet, balances and rounds are made up.
 */
const placeholder = (n: number) => `0x${n.toString(16).padStart(40, "0")}` as `0x${string}`;

export const DEMO_ADDRESS = "0x5a3a00000000000000000000000000000000dE30" as const;
export const DEMO_SETTLEMENT = placeholder(0x5a3a);

export const DEMO_ASSETS: Asset[] = [CASH, ...BSTOCKS];

export const DEMO_HOLDINGS: Record<string, number> = { NVDAB: 6, AAPLB: 4, TSLAB: 3, GOOGLB: 3, USDT: 1_500 };

export const DEMO_TARGET: Target = {
  weights: { NVDAB: 25, AAPLB: 20, GOOGLB: 15, SPYB: 15, TSLAB: 10, USDT: 15 },
  costCapBps: 100,
  residualStyle: "ECONOMIC",
  savedAt: "2026-09-28T08:10:00.000Z",
};

/** Presets only fill weights; the user still sees and saves explicit numbers (PRD §9). */
export const PRESETS: Record<"balanced" | "conservative" | "growth", Record<string, number>> = {
  balanced: { SPYB: 30, QQQB: 20, NVDAB: 15, AAPLB: 10, MSFTB: 10, USDT: 15 },
  conservative: { SPYB: 40, QQQB: 10, USDT: 50 },
  growth: { NVDAB: 25, TSLAB: 20, GOOGLB: 15, MSFTB: 15, TSMB: 15, USDT: 10 },
};

const hour = 3_600;

export const DEMO_CIRCLES: Circle[] = [
  {
    id: "c-bluechips",
    name: "US Big Tech Weekly",
    description: "Weekly rebalance for big US tech stocks as bStocks on BNB Chain.",
    visibility: "PUBLIC",
    assetSymbols: ["NVDAB", "AAPLB", "GOOGLB", "MSFTB", "USDT"],
    cadenceSec: 604_800,
    durationSec: hour,
    minParticipants: 3,
    memberCount: 14,
    residualBehavior: "ECONOMIC",
    role: "MEMBER",
    liveRound: { id: "r-42", sequence: 42, state: "COLLECTING", freezesAt: 0 },
    nextRoundAt: null,
    history: [
      { id: "r-41", sequence: 41, state: "COMPLETE", crossedUsd: 1_842.5, endedAt: "2026-09-28T10:02:00.000Z" },
      { id: "r-40", sequence: 40, state: "NO_CROSS", crossedUsd: 0, endedAt: "2026-09-21T10:01:00.000Z" },
    ],
  },
  {
    id: "c-jakarta",
    name: "Komunitas Jakarta DCA",
    description: "Monthly index-and-cash rebalance for a community group.",
    visibility: "INVITE_ONLY",
    assetSymbols: ["SPYB", "QQQB", "USDT"],
    cadenceSec: 2_592_000,
    durationSec: 4 * hour,
    minParticipants: 2,
    memberCount: 37,
    residualBehavior: "CARRY_FORWARD",
    role: "ORGANIZER",
    liveRound: null,
    nextRoundAt: "2026-10-10T02:00:00.000Z",
    history: [{ id: "r-j7", sequence: 7, state: "COMPLETE", crossedUsd: 5_210, endedAt: "2026-09-10T06:00:00.000Z" }],
  },
  {
    id: "c-rwa",
    name: "Stocks Daily",
    description: "Daily crossing for the most traded bStocks and USDT.",
    visibility: "PUBLIC",
    assetSymbols: ["NVDAB", "TSLAB", "SPYB", "USDT"],
    cadenceSec: 86_400,
    durationSec: 15 * 60,
    minParticipants: 2,
    memberCount: 61,
    residualBehavior: "ECONOMIC",
    role: null,
    liveRound: null,
    nextRoundAt: "2026-10-03T13:30:00.000Z",
    history: [],
  },
];

export const DEMO_ACTIVITY: Activity[] = [
  { id: "a5", kind: "SETTLED", detail: {}, roundId: "r-41", createdAt: "2026-09-28T10:02:00.000Z" },
  { id: "a4", kind: "PLAN_APPROVED", detail: {}, roundId: "r-41", createdAt: "2026-09-28T09:58:00.000Z" },
  { id: "a3", kind: "INTENT_SIGNED", detail: { sequence: 41, circle: "US Big Tech Weekly" }, roundId: "r-41", createdAt: "2026-09-28T09:12:00.000Z" },
  { id: "a2", kind: "TARGET_SAVED", detail: {}, roundId: null, createdAt: "2026-09-28T08:10:00.000Z" },
  { id: "a1", kind: "CIRCLE_JOINED", detail: { name: "US Big Tech Weekly" }, roundId: null, createdAt: "2026-09-27T15:40:00.000Z" },
];

export const VERIFIER_CHECKS = [
  ["Receipt status is success", "The settlement transaction succeeded on BNB Chain."],
  ["Chain is BNB Smart Chain", "Transaction chain id matches the deployment."],
  ["Called the settlement contract", "The transaction's target is the Sama settlement contract."],
  ["Calldata matches the plan", "The submitted plan hashes to the approved plan."],
  ["Every participant approved", "One valid approval per participant."],
  ["Nonces consumed", "Each approval nonce is marked used onchain."],
  ["PlanSettled event emitted", "One PlanSettled event with this plan hash."],
  ["One event per transfer", "CrossingLeg events match the plan's transfers one to one."],
  ["Balances moved exactly", "Every participant's balance changed by exactly the planned amounts."],
  ["No fee-on-transfer loss", "Receivers got the full amount sent."],
  ["Contract holds nothing", "The settlement contract's token balances are zero after settlement."],
  ["Within the valid window", "Settled before the plan expired."],
  ["Prices match the snapshot", "The plan was built from the round's pinned price snapshot."],
  ["Read through an independent provider", "Verification used a different RPC provider than execution."],
] as const;
