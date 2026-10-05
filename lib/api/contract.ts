import type { Hex, TypedDataDefinition } from "viem";
import type { Activity, Asset, Circle, HistoryPoint, HistoryRange, Home, InviteInfo, NewCircle, Portfolio, ResidualChoice, RoundView, Settings, Target, TargetPreview } from "./types";

/** What the UI needs from a wallet. Live mode gets it from the user's Privy wallet; mock mode fakes it. */
export type Signer = {
  signTypedData: (typedData: TypedDataDefinition) => Promise<Hex>;
  send: (tx: { to: Hex; data: Hex; value?: bigint | string; gas?: bigint | string }) => Promise<Hex>;
};

/** Progress messages for multi-step actions (PRD §19.4.6 "action checklist"). */
export type Say = (message: string) => void;

export type ProgressWords = {
  sign: string;
  submit: string;
  approvePlan: string;
  allow: (amount: number, symbol: string) => string;
  settle: string;
  verifying: string;
  quote: string;
  swap: string;
};

/**
 * One interface, two implementations: mock (browser-only demo) and live (sama-backend, Elysia; routes ported from Venue0).
 * Screens only ever import `sama` from ./index.
 */
export type SamaApi = {
  assets(): Promise<Asset[]>;
  home(): Promise<Home>;
  portfolio(): Promise<{ portfolio: Portfolio; target: Target | null }>;
  /** Total wallet value over a time window, oldest first; the last point is the current total. */
  portfolioHistory(range: HistoryRange): Promise<HistoryPoint[]>;
  previewTarget(target: Omit<Target, "savedAt">): Promise<TargetPreview>;
  saveTarget(target: Omit<Target, "savedAt">): Promise<void>;
  circles(): Promise<Circle[]>;
  /** Asks the server to scan the chain for this wallet's transfers now, so a send shows in Activity right away. */
  syncTransfers(): Promise<void>;
  circle(id: string): Promise<Circle>;
  /** `invite` is the code from an invite link; required for invite-only circles. */
  joinCircle(id: string, invite?: string): Promise<void>;
  createCircle(input: NewCircle): Promise<{ id: string }>;
  invite(circleId: string): Promise<{ url: string }>;
  /** Which circle an invite code opens. Works before sign-in. */
  inviteInfo(code: string): Promise<InviteInfo>;
  openRound(circleId: string): Promise<{ roundId: string }>;
  round(id: string): Promise<RoundView>;
  signIntent(round: RoundView, signer: Signer, say: Say, words: ProgressWords): Promise<void>;
  closeCollection(roundId: string): Promise<void>;
  approveAndAllow(round: RoundView, signer: Signer, say: Say, words: ProgressWords): Promise<void>;
  settle(round: RoundView, signer: Signer, say: Say, words: ProgressWords): Promise<void>;
  decideResidual(round: RoundView, choice: Exclude<ResidualChoice, "EXECUTE_NOW">): Promise<void>;
  swapResidual(round: RoundView, signer: Signer, say: Say, words: ProgressWords): Promise<void>;
  activity(): Promise<Activity[]>;
  settings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
};
