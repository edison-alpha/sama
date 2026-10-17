import assert from "node:assert/strict";
import { test } from "node:test";
import { proofEndpoint, proofExplorer, readProof } from "../../lib/proof.ts";

test("server proof resolves same-origin and private backend URLs absolutely", () => {
  assert.equal(proofEndpoint(undefined, "https://sama.example"), "https://sama.example/api/proof");
  assert.equal(proofEndpoint("http://backend:3300/", "https://sama.example"), "http://backend:3300/api/proof");
  assert.throws(() => proofEndpoint(undefined, undefined));
  assert.throws(() => proofEndpoint("/api", undefined));
  assert.throws(() => proofEndpoint("file:///etc", undefined));
});

test("explorer follows the evidence chain and rejects unsupported chains", () => {
  assert.equal(proofExplorer(56), "https://bscscan.com");
  assert.equal(proofExplorer(97), "https://testnet.bscscan.com");
  assert.throws(() => proofExplorer(1));
});

test("live proof distinguishes failures from a successful empty history", async () => {
  const success: typeof fetch = async () => Response.json({ chainId: 56, settlement: { address: "0x123" }, rounds: [] });
  const failure: typeof fetch = async () => new Response(null, { status: 503 });
  const offline: typeof fetch = async () => { throw new Error("offline"); };
  const options = { live: true, canonical: "https://sama.example" };
  assert.equal((await readProof(options, success)).state, "ready");
  assert.equal((await readProof(options, failure)).state, "unavailable");
  assert.equal((await readProof(options, offline)).state, "unavailable");
  assert.equal((await readProof({ live: true }, success)).state, "unavailable");
  assert.equal((await readProof({ live: false }, offline)).state, "demo");
});
