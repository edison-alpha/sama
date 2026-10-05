import type { SamaApi } from "./contract";
import { DEMO_ACTIVITY, DEMO_ASSETS, DEMO_CIRCLES, DEMO_HOLDINGS, DEMO_SETTLEMENT, DEMO_TARGET, VERIFIER_CHECKS } from "./demo-data";
import type { Activity, Circle, Drift, HistoryPoint, HistoryRange, Home, Portfolio, RoundState, RoundView, Settings, Target, TargetPreview } from "./types";

/**
 * Browser-only demo backend. Round progress is derived from timestamps of the user's own actions, so it survives a
 * refresh and needs no timers: sign → (3 s) matching → (3 s) match found → approve → (4 s) everyone approved →
 * settle → (2 s) settling → (3 s) verifying → done.
 */

type Store = {
  target: Target | null;
  circles: Circle[];
  activity: Activity[];
  settings: Settings;
  /** Per round: when the user took each step (ms since epoch). */
  rounds: Record<string, { opensAt: number; signedAt?: number; approvedAt?: number; settledAt?: number; decision?: "CARRY_FORWARD" | "EXECUTE_NOW" | "CANCEL" }>;
};

// v2: assets moved from crypto/demo tokens to bStocks; a v1 store would show circles with symbols that no longer exist.
const KEY = "sama_demo_store_v2";
const ROUND_WINDOW_SEC = 12 * 60;

function fresh(): Store {
  const now = Date.now();
  return {
    target: DEMO_TARGET,
    circles: structuredClone(DEMO_CIRCLES),
    activity: structuredClone(DEMO_ACTIVITY),
    settings: { notify: { email: true, telegram: false, inApp: true }, residualStyle: "ECONOMIC", costCapBps: 100, gasSponsorship: true },
    rounds: {
      "r-42": { opensAt: now },
      "r-41": { opensAt: Date.parse("2026-09-28T09:00:00.000Z"), signedAt: 1, approvedAt: 1, settledAt: 1, decision: "CARRY_FORWARD" },
    },
  };
}

let memory: Store | null = null;

function load(): Store {
  if (memory) return memory;
  try {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(KEY);
    memory = raw ? (JSON.parse(raw) as Store) : fresh();
  } catch {
    memory = fresh();
  }
  return memory;
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // Private mode or blocked storage: the demo still works for this tab.
  }
}

export function resetDemo() {
  memory = fresh();
  persist();
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const asset = (symbol: string) => {
  const a = DEMO_ASSETS.find((x) => x.symbol === symbol);
  if (!a) throw new Error(`Demo asset ${symbol} is not in the allowlist`);
  return a;
};
const price = (symbol: string) => DEMO_ASSETS.find((a) => a.symbol === symbol)?.priceUsd ?? 0;
/** Raw token amount (18 decimals) worth `usd` at the demo price. */
const raw = (symbol: string, usd: number) => BigInt(Math.round((usd / price(symbol)) * 1e6)) * 10n ** BigInt(asset(symbol).decimals - 6);
const fakeHash = (seed: string) => `0x${Array.from({ length: 64 }, (_, i) => ((seed.charCodeAt(i % seed.length) + i * 7) % 16).toString(16)).join("")}` as `0x${string}`;

function portfolioNow(): Portfolio {
  const rows = Object.entries(DEMO_HOLDINGS).map(([symbol, amountTokens]) => ({ symbol, amountTokens, valueUsd: amountTokens * price(symbol) }));
  const totalUsd = rows.reduce((s, r) => s + r.valueUsd, 0);
  return { ok: true, totalUsd, readAt: new Date().toISOString(), positions: rows.map((r) => ({ ...r, pct: (r.valueUsd / totalUsd) * 100 })).sort((a, b) => b.valueUsd - a.valueUsd) };
}

const HISTORY: Record<HistoryRange, { spanMs: number; points: number; vol: number }> = {
  "1H": { spanMs: 3_600_000, points: 60, vol: 0.0006 },
  "1D": { spanMs: 86_400_000, points: 96, vol: 0.0015 },
  "1W": { spanMs: 7 * 86_400_000, points: 168, vol: 0.003 },
  "1M": { spanMs: 30 * 86_400_000, points: 120, vol: 0.007 },
  "1Y": { spanMs: 365 * 86_400_000, points: 183, vol: 0.02 },
  ALL: { spanMs: 2 * 365 * 86_400_000, points: 240, vol: 0.025 },
};

/** Seeded PRNG, so the demo chart looks the same on every refresh within the same hour. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Demo value history: a random walk run backwards from today's real demo total, so the chart always ends at it. */
function history(range: HistoryRange): HistoryPoint[] {
  const { spanMs, points, vol } = HISTORY[range];
  const p = portfolioNow();
  const end = p.ok ? p.totalUsd : 0;
  const now = Date.now();
  const rand = mulberry32([...range].reduce((s, c) => s * 31 + c.charCodeAt(0), Math.floor(now / 3_600_000)));
  const step = spanMs / (points - 1);
  const out: HistoryPoint[] = [{ t: now, usd: end }];
  let v = end;
  for (let i = 1; i < points; i++) {
    const shock = (rand() + rand() + rand() - 1.5) * 2 * vol;
    v = Math.max(end * 0.2, v * (1 - shock - vol * 0.08));
    out.push({ t: now - i * step, usd: v });
  }
  return out.reverse();
}

function preview(weights: Record<string, number>): TargetPreview {
  const p = portfolioNow();
  if (!p.ok) return { ok: false, problems: [p.detail], trades: [] };
  const total = Object.values(weights).reduce((s, w) => s + w, 0);
  const problems = Math.abs(total - 100) > 0.05 ? [`Weights add up to ${total.toFixed(1)}%`] : [];
  const symbols = new Set([...Object.keys(weights), ...p.positions.map((x) => x.symbol)]);
  const trades = [...symbols]
    .map((symbol) => {
      const have = p.positions.find((x) => x.symbol === symbol)?.valueUsd ?? 0;
      const want = ((weights[symbol] ?? 0) / 100) * p.totalUsd;
      const delta = want - have;
      return { symbol, side: delta < 0 ? ("SELL" as const) : ("BUY" as const), valueUsd: Math.abs(delta), amountTokens: Math.abs(delta) / (price(symbol) || 1) };
    })
    .filter((t) => t.valueUsd >= 1)
    .sort((a, b) => b.valueUsd - a.valueUsd);
  return { ok: problems.length === 0, problems, trades };
}

function drift(target: Target | null): { drift: Drift[]; total: number } {
  const p = portfolioNow();
  if (!target || !p.ok) return { drift: [], total: 0 };
  const symbols = new Set([...Object.keys(target.weights), ...p.positions.map((x) => x.symbol)]);
  const rows = [...symbols].map((symbol) => ({ symbol, currentPct: p.positions.find((x) => x.symbol === symbol)?.pct ?? 0, targetPct: target.weights[symbol] ?? 0 }));
  return { drift: rows.sort((a, b) => b.targetPct - a.targetPct), total: rows.reduce((s, r) => s + Math.abs(r.currentPct - r.targetPct), 0) / 2 };
}

function stateOf(id: string): { state: RoundState; approvals: number; freezesAt: number } {
  const r = load().rounds[id];
  if (!r) throw new Error("Round not found");
  const now = Date.now();
  const freezesAt = Math.floor(r.opensAt / 1000) + ROUND_WINDOW_SEC;
  if (!r.signedAt) return { state: now / 1000 > freezesAt ? "EXPIRED" : "COLLECTING", approvals: 0, freezesAt };
  const since = (t: number) => now - t;
  if (since(r.signedAt) < 3_000) return { state: "COLLECTING", approvals: 0, freezesAt };
  if (since(r.signedAt) < 6_000) return { state: "SOLVING", approvals: 0, freezesAt };
  if (!r.approvedAt) return { state: "APPROVING", approvals: 1, freezesAt };
  if (since(r.approvedAt) < 4_000) return { state: "APPROVING", approvals: 2, freezesAt };
  if (!r.settledAt) return { state: "READY_TO_SETTLE", approvals: 3, freezesAt };
  if (since(r.settledAt) < 2_000) return { state: "SETTLING", approvals: 3, freezesAt };
  if (since(r.settledAt) < 5_000) return { state: "VERIFYING", approvals: 3, freezesAt };
  return { state: "COMPLETE", approvals: 3, freezesAt };
}

const TERMINAL = new Set<RoundState>(["COMPLETE", "EXPIRED", "NO_CROSS", "INSUFFICIENT_PARTICIPANTS", "PLAN_STALE", "PLAN_REJECTED", "SETTLEMENT_REVERTED", "VERIFICATION_FAILED", "CANCELLED"]);

function roundView(id: string): RoundView {
  const store = load();
  const circle = store.circles.find((c) => c.history.some((h) => h.id === id) || c.liveRound?.id === id) ?? store.circles[0]!;
  const record = store.rounds[id]!;
  const { state, approvals, freezesAt } = stateOf(id);
  const sequence = Number(id.replace(/\D/g, "")) || 1;
  const matched = !["COLLECTING", "SOLVING", "EXPIRED"].includes(state);
  const settled = ["SETTLING", "VERIFYING", "COMPLETE"].includes(state);
  const done = state === "COMPLETE";
  const amount = (symbol: string, usd: number) => ({ symbol, amountTokens: usd / price(symbol), valueUsd: usd });
  const settlementTx = settled ? fakeHash(`${id}-settle`) : null;

  return {
    round: {
      id,
      sequence,
      state,
      terminal: TERMINAL.has(state),
      freezesAt,
      snapshotHash: fakeHash(`${id}-snapshot`),
      prices: circle.assetSymbols.map((symbol) => ({ symbol, priceUsd: price(symbol) })),
      settlementContract: DEMO_SETTLEMENT,
      settlementTx,
      planHash: matched ? fakeHash(`${id}-plan`) : null,
      planValidUntil: matched ? Math.floor((record.signedAt! + 30 * 60_000) / 1000) : null,
      history: [],
      verification: done
        ? { status: "PASS", blockNumber: "48213377", checks: VERIFIER_CHECKS.map(([name, detail]) => ({ name, status: "PASS" as const, detail })), providers: { executor: "nodereal.io", verifier: "chainstack.com", independent: true } }
        : null,
    },
    circle: { id: circle.id, name: circle.name, assetSymbols: circle.assetSymbols, minParticipants: circle.minParticipants, memberCount: circle.memberCount, residualBehavior: circle.residualBehavior, isOrganizer: circle.role === "ORGANIZER" },
    you: {
      signed: Boolean(record.signedAt),
      intent: [
        { side: "SELL", ...amount("NVDAB", 722) },
        { side: "SELL", ...amount("AAPLB", 295) },
        { side: "BUY", ...amount("MSFTB", 865) },
        { side: "BUY", ...amount("USDT", 152) },
      ],
      outsideCircle: ["TSLAB"],
      legs: matched
        ? [
            { direction: "SEND", counterparty: "2", ...amount("NVDAB", 544) },
            { direction: "SEND", counterparty: "3", ...amount("AAPLB", 295) },
            { direction: "RECEIVE", counterparty: "2", ...amount("MSFTB", 839) },
          ]
        : [],
      inPlan: matched,
      approved: Boolean(record.approvedAt),
      allowances: matched
        ? [
            { token: asset("NVDAB").address, symbol: "NVDAB", amountRaw: raw("NVDAB", 544), amountTokens: 544 / price("NVDAB"), sufficient: Boolean(record.approvedAt), funded: true },
            { token: asset("AAPLB").address, symbol: "AAPLB", amountRaw: raw("AAPLB", 295), amountTokens: 295 / price("AAPLB"), sufficient: Boolean(record.approvedAt), funded: true },
          ]
        : [],
      residual: done
        ? [
            { side: "SELL", dust: false, ...amount("NVDAB", 178) },
            { side: "BUY", dust: false, ...amount("MSFTB", 26) },
            { side: "BUY", dust: false, ...amount("USDT", 152) },
          ]
        : [],
      recommendation: done ? { decision: "AGGREGATE", reasons: ["Swapping these leftovers on PancakeSwap now would cost about 1.4% all-in, above your 1.0% cap.", "This Circle runs again next week, so carrying them over is free."], canExecute: true, costPct: 1.4 } : null,
      decision: record.decision ? { choice: record.decision, txHash: record.decision === "EXECUTE_NOW" ? fakeHash(`${id}-swap`) : null } : null,
    },
    aggregate: { signed: record.signedAt ? 5 : 4, participants: matched ? 3 : 0, approvals, requestedUsd: 3_410, crossedUsd: matched ? 2_517 : 0, residualUsd: matched ? 893 : 0, crossRateBps: matched ? 7_381 : 0, legCount: matched ? 6 : 0, cycleCount: matched ? 1 : 0 },
    gasSponsored: store.settings.gasSponsorship,
  };
}

function log(kind: string, detail: Record<string, string | number>, roundId: string | null) {
  const store = load();
  store.activity.unshift({ id: `a${Date.now()}`, kind, detail, roundId, createdAt: new Date().toISOString() });
}

function mutateRound(id: string, patch: Partial<Store["rounds"][string]>) {
  const store = load();
  store.rounds[id] = { ...store.rounds[id]!, ...patch };
  persist();
}

export const mockApi: SamaApi = {
  async syncTransfers() {},
  async assets() {
    return DEMO_ASSETS;
  },
  async home(): Promise<Home> {
    await wait(150);
    const store = load();
    const d = drift(store.target);
    const pending = store.circles
      .filter((c) => c.role && c.liveRound)
      .map((c) => {
        const v = roundView(c.liveRound!.id);
        const undecided = v.you.decision ? 0 : v.you.residual.filter((r) => !r.dust).reduce((s, r) => s + r.valueUsd, 0);
        return { roundId: v.round.id, sequence: v.round.sequence, circleName: c.name, state: v.round.state, freezesAt: v.round.freezesAt, signed: v.you.signed, approved: v.you.approved, inPlan: v.you.inPlan, residualUndecidedUsd: undecided };
      });
    return { portfolio: portfolioNow(), target: store.target, drift: d.drift, totalDriftPct: d.total, circles: store.circles.filter((c) => c.role), activity: store.activity.slice(0, 5), pending };
  },
  async portfolio() {
    await wait(150);
    return { portfolio: portfolioNow(), target: load().target };
  },
  async previewTarget(target) {
    await wait(250);
    return preview(target.weights);
  },
  async saveTarget(target) {
    const p = preview(target.weights);
    if (!p.ok) throw new Error(p.problems.join(" "));
    load().target = { ...target, savedAt: new Date().toISOString() };
    log("TARGET_SAVED", {}, null);
    persist();
  },
  async circles() {
    await wait(120);
    return load().circles.map((c) => withLive(c));
  },
  async circle(id) {
    await wait(120);
    const c = load().circles.find((x) => x.id === id);
    if (!c) throw new Error("Circle not found");
    return withLive(c);
  },
  async joinCircle(id) {
    const c = load().circles.find((x) => x.id === id);
    if (!c) throw new Error("Circle not found");
    c.role = "MEMBER";
    c.memberCount += 1;
    log("CIRCLE_JOINED", { name: c.name }, null);
    persist();
  },
  async createCircle(input) {
    const id = `c-${Date.now().toString(36)}`;
    load().circles.unshift({ ...input, id, memberCount: 1, role: "ORGANIZER", liveRound: null, nextRoundAt: null, history: [] });
    log("CIRCLE_CREATED", { name: input.name }, null);
    persist();
    return { id };
  },
  async invite(circleId) {
    return { url: `${window.location.origin}/invite/${circleId}-${Math.random().toString(36).slice(2, 10)}` };
  },
  /** Mock invite codes are `${circleId}-${random}`; circle ids look like "c-bluechips". */
  async inviteInfo(code) {
    await wait(80);
    const circleId = code.split("-").slice(0, 2).join("-");
    const c = load().circles.find((x) => x.id === circleId);
    if (!c) throw new Error("This invite link is not valid.");
    return { circleId: c.id, circleName: c.name, used: false };
  },
  async openRound(circleId) {
    const store = load();
    const c = store.circles.find((x) => x.id === circleId);
    if (!c) throw new Error("Circle not found");
    if (c.liveRound) return { roundId: c.liveRound.id };
    const sequence = (c.history[0]?.sequence ?? 0) + 1;
    const roundId = `r-${circleId.slice(2, 6)}${sequence}`;
    store.rounds[roundId] = { opensAt: Date.now() };
    c.liveRound = { id: roundId, sequence, state: "COLLECTING", freezesAt: 0 };
    persist();
    return { roundId };
  },
  async round(id) {
    await wait(80);
    return roundView(id);
  },
  async signIntent(round, _signer, say, words) {
    say(words.sign);
    await wait(900);
    say(words.submit);
    await wait(400);
    mutateRound(round.round.id, { signedAt: Date.now() });
    log("INTENT_SIGNED", { sequence: round.round.sequence, circle: round.circle.name }, round.round.id);
    persist();
  },
  async closeCollection(roundId) {
    mutateRound(roundId, { opensAt: Date.now() - ROUND_WINDOW_SEC * 1000 });
  },
  async approveAndAllow(round, _signer, say, words) {
    say(words.approvePlan);
    await wait(900);
    for (const a of round.you.allowances) {
      say(words.allow(a.amountTokens, a.symbol));
      await wait(800);
    }
    mutateRound(round.round.id, { approvedAt: Date.now() });
    log("PLAN_APPROVED", {}, round.round.id);
    persist();
  },
  async settle(round, _signer, say, words) {
    say(words.settle);
    await wait(1_000);
    say(words.verifying);
    await wait(500);
    mutateRound(round.round.id, { settledAt: Date.now() });
    log("SETTLED", {}, round.round.id);
    persist();
  },
  async decideResidual(round, choice) {
    await wait(300);
    mutateRound(round.round.id, { decision: choice });
    log("RESIDUAL_DECIDED", {}, round.round.id);
    persist();
  },
  async swapResidual(round, _signer, say, words) {
    say(words.quote);
    await wait(700);
    say(words.swap);
    await wait(1_000);
    mutateRound(round.round.id, { decision: "EXECUTE_NOW" });
    log("RESIDUAL_DECIDED", {}, round.round.id);
    persist();
  },
  async portfolioHistory(range) {
    await wait(120);
    return history(range);
  },
  async activity() {
    await wait(120);
    return load().activity;
  },
  async settings() {
    return load().settings;
  },
  async saveSettings(settings) {
    load().settings = settings;
    persist();
  },
};

/** The live round's displayed state and countdown come from the derived round, not the stored summary. */
function withLive(c: Circle): Circle {
  if (!c.liveRound) return c;
  const { state, freezesAt } = stateOf(c.liveRound.id);
  return { ...c, liveRound: { ...c.liveRound, state, freezesAt } };
}
