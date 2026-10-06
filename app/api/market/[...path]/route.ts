/**
 * Server-side cache in front of GeckoTerminal (free tier: about 30 calls a minute per IP). Browsers call this instead of
 * GeckoTerminal, so one upstream request serves every visitor for the length of its TTL, identical requests in flight
 * are merged, and a 429 or outage falls back to the last good answer instead of an empty chart.
 */
const UPSTREAM = "https://api.geckoterminal.com/api/v2/networks/bsc";

type Entry = { at: number; status: number; body: string };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<Entry>>();

/** Only the three read paths the token pages use; anything else is refused so this is not an open proxy. */
const ID = "0x[0-9a-fA-F]{40}(?:[0-9a-fA-F]{24})?";
const ALLOWED: Array<{ re: RegExp; ttlMs: number }> = [
  { re: new RegExp(`^tokens/${ID}$`), ttlMs: 60_000 },
  { re: new RegExp(`^tokens/${ID}/pools$`), ttlMs: 5 * 60_000 },
  { re: new RegExp(`^pools/${ID}/ohlcv/(minute|hour|day)$`), ttlMs: 60_000 },
];
/** Beyond this age a stale answer is not worth showing even when upstream is down. */
const STALE_MS = 6 * 60 * 60_000;
const MAX_ENTRIES = 500;

async function fetchUpstream(url: string): Promise<Entry> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
    if (r.status === 429 && attempt === 0) {
      await new Promise((ok) => setTimeout(ok, 1_200));
      continue;
    }
    return { at: Date.now(), status: r.status, body: await r.text() };
  }
  return { at: Date.now(), status: 429, body: "" };
}

export async function GET(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const key = path.join("/");
  const rule = ALLOWED.find((a) => a.re.test(key));
  if (!rule) return Response.json({ error: "not found" }, { status: 404 });
  const search = new URL(request.url).searchParams;
  const tokenParam = new RegExp(`^(base|quote|${ID})$`);
  for (const [k, v] of search) {
    const ok = k === "token" ? tokenParam.test(v) : /^(aggregate|limit|currency|page|before_timestamp)$/.test(k) && /^[\w.]{1,12}$/.test(v);
    if (!ok) return Response.json({ error: "bad query" }, { status: 400 });
  }
  const url = `${UPSTREAM}/${key}${search.size ? `?${[...search].map(([k, v]) => `${k}=${v}`).join("&")}` : ""}`;

  const hit = cache.get(url);
  const respond = (e: Entry, stale = false) =>
    new Response(e.body, {
      status: e.status,
      headers: { "content-type": "application/json", "cache-control": `public, max-age=15, s-maxage=${Math.round(rule.ttlMs / 1000)}, stale-while-revalidate=300`, ...(stale ? { "x-market-stale": "1" } : {}) },
    });
  if (hit && Date.now() - hit.at < rule.ttlMs) return respond(hit);

  let pending = inflight.get(url);
  if (!pending) {
    pending = fetchUpstream(url).finally(() => inflight.delete(url));
    inflight.set(url, pending);
  }
  try {
    const fresh = await pending;
    // 200 and 404 (token has no market) are real answers; everything else keeps the old data if there is any.
    if (fresh.status === 200 || fresh.status === 404) {
      if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
      cache.set(url, fresh);
      return respond(fresh);
    }
    if (hit && Date.now() - hit.at < STALE_MS) return respond(hit, true);
    return Response.json({ error: fresh.status === 429 ? "busy" : "unavailable" }, { status: fresh.status === 429 ? 429 : 502, headers: { "retry-after": "30" } });
  } catch {
    if (hit && Date.now() - hit.at < STALE_MS) return respond(hit, true);
    return Response.json({ error: "unavailable" }, { status: 502 });
  }
}
