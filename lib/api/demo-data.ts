import type { Activity, Asset, Circle, Target } from "./types";

/**
 * Sample data for mock mode. Addresses are placeholders on BSC Testnet, NOT real token contracts: the live asset list
 * comes from the curated allowlist served by /api/assets (PRD §7). "tNVDA" and "tSPY" stand in for tokenized stocks.
 */
const placeholder = (n: number) => `0x${n.toString(16).padStart(40, "0")}` as `0x${string}`;

export const DEMO_ADDRESS = "0x5a3a00000000000000000000000000000000dE30" as const;
export const DEMO_SETTLEMENT = placeholder(0x5a3a);

export const DEMO_ASSETS: Asset[] = [
  { uid: `97:${placeholder(1)}`, address: placeholder(1), symbol: "WBNB", name: "Wrapped BNB", decimals: 18, class: "CRYPTO", priceUsd: 590 },
  { uid: `97:${placeholder(2)}`, address: placeholder(2), symbol: "BTCB", name: "Bitcoin BEP20", decimals: 18, class: "CRYPTO", priceUsd: 64_000 },
  { uid: `97:${placeholder(3)}`, address: placeholder(3), symbol: "ETH", name: "Ethereum (BEP20)", decimals: 18, class: "CRYPTO", priceUsd: 2_500 },
  { uid: `97:${placeholder(4)}`, address: placeholder(4), symbol: "USDT", name: "Tether USD (BEP20)", decimals: 18, class: "STABLE", priceUsd: 1 },
  { uid: `97:${placeholder(5)}`, address: placeholder(5), symbol: "USDC", name: "USD Coin (BEP20)", decimals: 18, class: "STABLE", priceUsd: 1 },
  { uid: `97:${placeholder(6)}`, address: placeholder(6), symbol: "tNVDA", name: "Demo tokenized NVIDIA", decimals: 18, class: "RWA", priceUsd: 120, disclosure: "Demo asset. Real tokenized stocks carry their issuer's disclosure and jurisdiction limits here." },
  { uid: `97:${placeholder(7)}`, address: placeholder(7), symbol: "tSPY", name: "Demo tokenized S&P 500 ETF", decimals: 18, class: "RWA", priceUsd: 560, disclosure: "Demo asset. Real tokenized stocks carry their issuer's disclosure and jurisdiction limits here." },
];

export const DEMO_HOLDINGS: Record<string, number> = { BTCB: 0.05, WBNB: 4, USDT: 1_500, tNVDA: 10 };

export const DEMO_TARGET: Target = {
  weights: { BTCB: 30, WBNB: 25, ETH: 15, USDT: 20, tNVDA: 10 },
  costCapBps: 100,
  residualStyle: "ECONOMIC",
  savedAt: "2026-09-28T08:10:00.000Z",
};

/** Presets only fill weights; the user still sees and saves explicit numbers (PRD §9). */
export const PRESETS: Record<"balanced" | "conservative" | "growth", Record<string, number>> = {
  balanced: { BTCB: 30, WBNB: 25, ETH: 15, USDT: 20, tNVDA: 10 },
  conservative: { BTCB: 20, WBNB: 10, ETH: 10, USDT: 45, USDC: 15 },
  growth: { BTCB: 35, WBNB: 25, ETH: 20, tNVDA: 15, USDT: 5 },
};

const hour = 3_600;

export const DEMO_CIRCLES: Circle[] = [
  {
    id: "c-bluechips",
    name: "BNB Blue Chips Weekly",
    description: "Weekly rebalance for the big four on BNB Chain.",
    visibility: "PUBLIC",
    assetSymbols: ["WBNB", "BTCB", "ETH", "USDT"],
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
    description: "Monthly stablecoin-heavy rebalance for a community group.",
    visibility: "INVITE_ONLY",
    assetSymbols: ["BTCB", "USDT", "USDC", "WBNB"],
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
    name: "RWA Daily",
    description: "Daily crossing for tokenized stocks and stablecoins.",
    visibility: "PUBLIC",
    assetSymbols: ["tNVDA", "tSPY", "USDT"],
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
  { id: "a3", kind: "INTENT_SIGNED", detail: { sequence: 41, circle: "BNB Blue Chips Weekly" }, roundId: "r-41", createdAt: "2026-09-28T09:12:00.000Z" },
  { id: "a2", kind: "TARGET_SAVED", detail: {}, roundId: null, createdAt: "2026-09-28T08:10:00.000Z" },
  { id: "a1", kind: "CIRCLE_JOINED", detail: { name: "BNB Blue Chips Weekly" }, roundId: null, createdAt: "2026-09-27T15:40:00.000Z" },
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
