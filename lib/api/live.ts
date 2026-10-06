import { encodeFunctionData, erc20Abi, type Hex, type TypedDataDefinition } from "viem";
import type { SamaApi } from "./contract";
import { marketApi } from "./market-http";
import type { Activity, ChatSummary, Circle, HistoryPoint, RoundView } from "./types";

/**
 * Live client for sama-backend (Elysia on Bun), one method per API route (PRD §18.2). Responses are typed by
 * lib/api/types.ts, generated from sama-packages/api-types.
 */

const BASE = process.env.NEXT_PUBLIC_SAMA_API_URL ?? "";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** The API encodes bigints as {"$bigint": "..."}; revive them so amounts never pass through floats. */
function revive<T>(value: unknown): T {
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.$bigint === "string" && Object.keys(o).length === 1) return BigInt(o.$bigint);
      return Object.fromEntries(Object.entries(o).map(([k, x]) => [k, walk(x)]));
    }
    return v;
  };
  return walk(value) as T;
}

const encode = (value: unknown) => JSON.stringify(value, (_k, v: unknown) => (typeof v === "bigint" ? { $bigint: v.toString() } : v));

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: init.body === undefined ? {} : { "content-type": "application/json" },
    ...(init.body === undefined ? {} : { body: encode(init.body) }),
    credentials: "include",
    cache: "no-store",
  });
  const data = revive<T & { error?: string }>(await response.json().catch(() => ({})));
  if (!response.ok) throw new ApiError(data.error ?? `Request failed (${response.status})`, response.status);
  return data;
}

type Permit = { domain: Record<string, unknown>; types: Record<string, Array<{ name: string; type: string }>>; values: Record<string, unknown> };

function permitTypedData(permit: Permit): TypedDataDefinition {
  const primaryType = Object.keys(permit.types).find((t) => t !== "EIP712Domain") as string;
  return { domain: permit.domain, types: permit.types, primaryType, message: permit.values } as unknown as TypedDataDefinition;
}

const id = (r: RoundView) => r.round.id;

export const liveApi: SamaApi = {
  ...marketApi,
  assets: () => call("/api/assets"),
  home: () => call("/api/me/home"), // aggregates portfolio, target, drift, circles, pending rounds, activity
  portfolio: () => call("/api/me/portfolio"),
  syncTransfers: async () => {
    await call("/api/me/transfers/sync", { body: {} });
  },
  portfolioHistory: async (range) => (await call<{ points: HistoryPoint[] }>(`/api/me/portfolio/history?range=${range}`)).points,
  previewTarget: (target) => call("/api/me/target/preview", { body: target }),
  agentEnabled: async () => (await call<{ enabled: boolean }>("/api/agent")).enabled,
  suggestTarget: (instruction) => call("/api/me/target/suggest", { body: { instruction } }),
  assist: (chatId, message) => call("/api/me/assistant", { body: { chatId: chatId ?? undefined, message } }),
  chats: async () => (await call<{ chats: ChatSummary[] }>("/api/me/chats")).chats,
  chat: (id) => call(`/api/me/chats/${encodeURIComponent(id)}`),
  deleteChat: async (id) => {
    await call(`/api/me/chats/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
  deleteAllChats: async () => {
    await call("/api/me/chats", { method: "DELETE" });
  },
  saveTarget: async (target) => {
    await call("/api/me/target", { body: target });
  },
  circles: async () => (await call<{ circles: Circle[] }>("/api/circles")).circles,
  circle: (circleId) => call(`/api/circles/${circleId}`),
  joinCircle: async (circleId, invite) => {
    await call(`/api/circles/${circleId}/join`, { body: invite ? { invite } : {} });
  },
  createCircle: (input) => call("/api/circles", { body: input }),
  invite: (circleId) => call(`/api/circles/${circleId}/invite`, { body: {} }),
  inviteInfo: (code) => call(`/api/invites/${encodeURIComponent(code)}`), // public
  openRound: (circleId) => call(`/api/circles/${circleId}/round`, { body: {} }),
  round: (roundId) => call(`/api/rounds/${roundId}`),

  async signIntent(round, signer, say, words) {
    const prepared = await call<{ intent: unknown; typedData: TypedDataDefinition }>(`/api/rounds/${id(round)}/intent`);
    say(words.sign);
    const signature = await signer.signTypedData(prepared.typedData);
    say(words.submit);
    await call(`/api/rounds/${id(round)}/intent`, { body: { intent: prepared.intent, signature } });
  },

  async closeCollection(roundId) {
    await call(`/api/rounds/${roundId}/close`, { method: "POST" });
  },

  async approveAndAllow(round, signer, say, words) {
    if (!round.you.approved) {
      say(words.approvePlan);
      const { typedData } = await call<{ typedData: TypedDataDefinition }>(`/api/rounds/${id(round)}/approval`);
      const signature = await signer.signTypedData(typedData);
      await call(`/api/rounds/${id(round)}/approval`, { body: { signature } });
    }
    // Exact allowances only: the contract can move what this plan sends, nothing more (PRD §16.3).
    for (const a of round.you.allowances.filter((x) => !x.sufficient)) {
      say(words.allow(a.amountTokens, a.symbol));
      await signer.send({ to: a.token, data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [round.round.settlementContract, a.amountRaw] }) });
    }
  },

  async settle(round, signer, say, words) {
    const tx = await call<{ to: Hex; data: Hex }>(`/api/rounds/${id(round)}/settle`);
    say(words.settle);
    const txHash = await signer.send(tx);
    say(words.verifying);
    await call(`/api/rounds/${id(round)}/settle`, { body: { txHash } });
  },

  async decideResidual(round, choice) {
    await call(`/api/rounds/${id(round)}/residual`, { body: { choice, engineDecision: round.you.recommendation?.decision ?? "NONE" } });
  },

  /** Leftover swap on PancakeSwap in three steps: prepare → build → record. */
  async swapResidual(round, signer, say, words) {
    say(words.quote);
    const path = `/api/rounds/${id(round)}/residual/swap`;
    let prep = await call<{ approval: { to: Hex; data: Hex; value: string } | null; permitData: Permit | null }>(path, { body: { step: "prepare" } });
    if (prep.approval) {
      await signer.send(prep.approval);
      prep = await call(path, { body: { step: "prepare" } });
    }
    const permitSignature = prep.permitData ? await signer.signTypedData(permitTypedData(prep.permitData)) : null;
    const { tx } = await call<{ tx: { to: Hex; data: Hex; value: string; gasLimit?: string } }>(path, { body: { step: "build", permitSignature } });
    say(words.swap);
    const txHash = await signer.send({ to: tx.to, data: tx.data, value: tx.value, ...(tx.gasLimit ? { gas: tx.gasLimit } : {}) });
    say(words.verifying);
    await call(path, { body: { step: "record", txHash } });
  },

  activity: async (query = {}) => {
    const qs = new URLSearchParams();
    if (query.cursor) qs.set("cursor", query.cursor);
    if (query.group) qs.set("group", query.group);
    if (query.range && query.range !== "all") qs.set("range", query.range);
    const page = await call<{ activity: Activity[]; nextCursor: string | null }>(`/api/me/activity?${qs}`);
    return { items: page.activity, nextCursor: page.nextCursor };
  },
  settings: () => call("/api/me/settings"),
  saveSettings: async (settings) => {
    await call("/api/me/settings", { body: settings });
  },
  onboarding: async () => (await call<{ onboardingDone: boolean }>("/api/me/onboarding")).onboardingDone,
  setOnboardingDone: async (done) => {
    await call("/api/me/onboarding", { body: { done } });
  },
};
