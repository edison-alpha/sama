import type { Proof } from "./api/types";

/** Same-origin server fetches use a configured canonical origin, never an untrusted Host header. */
export function proofEndpoint(backend: string | undefined, canonical: string | undefined): string {
  const base = backend || canonical;
  if (!base) throw new Error("Configure SAMA_API_URL or a canonical site URL for live proof.");
  const url = new URL(base);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Proof requires an HTTP backend origin.");
  return `${url.href.replace(/\/+$/, "")}/api/proof`;
}

export function proofExplorer(chainId: number): string {
  if (chainId === 56) return "https://bscscan.com";
  if (chainId === 97) return "https://testnet.bscscan.com";
  throw new Error("Unsupported proof network.");
}

export type ProofResult = { state: "demo" } | { state: "unavailable" } | { state: "ready"; proof: Proof };

export async function readProof(options: { live: boolean; backend?: string; canonical?: string }, fetcher: typeof fetch = fetch): Promise<ProofResult> {
  if (!options.live) return { state: "demo" };
  try {
    const url = proofEndpoint(options.backend, options.canonical);
    const response = await fetcher(url, { signal: AbortSignal.timeout(8_000), next: { revalidate: 30 } });
    if (!response.ok) return { state: "unavailable" };
    const proof = await response.json() as Proof;
    proofExplorer(proof.chainId);
    if (!proof.settlement?.address || !Array.isArray(proof.rounds)) return { state: "unavailable" };
    return { state: "ready", proof };
  } catch {
    return { state: "unavailable" };
  }
}
