import type { SamaApi } from "./contract";
import { liveApi } from "./live";
import { mockApi } from "./mock";

export const API_MODE: "mock" | "live" = process.env.NEXT_PUBLIC_SAMA_API_MODE === "live" ? "live" : "mock";

/** The only API object screens use. */
export const sama: SamaApi = API_MODE === "live" ? liveApi : mockApi;

export type * from "./types";
export type { ProgressWords, Say, SamaApi, Signer } from "./contract";
