import { PublicPage } from "@/components/landing/public-page";
import type { Proof } from "@/lib/api/types";
import { addressUrl, txUrl } from "@/lib/chain";
import { fmt } from "@/lib/i18n/dict";
import { getDict } from "@/lib/i18n/server";

/** The deployed SamaSettlement on BSC mainnet; mirrors sama-packages/shared/src/deployments/56.json. */
const DEPLOYED = { address: "0x7811a30D29d6c2Ca95Aeb4EE9D896cE44Cb72AC8", deployTx: "0x84b1481cbc44d190ef5908e8ba9e3d6abd681b101a4af7bd26bb45e9522e7d0d", deployBlock: 125735191 } as const;

/** Live evidence from sama-backend, refreshed every 30 s. In mock mode, or when the API is unreachable, only the contract shows. */
async function loadProof(): Promise<Proof | null> {
  if (process.env.NEXT_PUBLIC_SAMA_API_MODE !== "live") return null;
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SAMA_API_URL ?? ""}/api/proof`, { next: { revalidate: 30 } });
    return r.ok ? ((await r.json()) as Proof) : null;
  } catch {
    return null;
  }
}

const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-6)}`;

/**
 * On-chain proof for reviewers: the settlement contract and every round that settled through it, each with its
 * transaction and the independent verifier's result. Participants are never named; private circles stay anonymous.
 */
export default async function ProofPage() {
  const { d, locale } = await getDict();
  const p = d.proof;
  const proof = await loadProof();
  const contract = proof?.settlement ?? { ...DEPLOYED, verifiedSource: false };
  const money = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const when = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <PublicPage d={d}>
      <h1 className="text-4xl font-semibold tracking-[-0.04em]">{d.nav.proof}</h1>
      <p className="mt-3 text-lg text-ink-2">{p.lead}</p>

      <section className="mt-10 rounded-[24px] border border-line bg-surface p-6">
        <p className="text-sm font-medium text-ink-3">{p.contract}</p>
        <a href={addressUrl(contract.address)} target="_blank" rel="noreferrer" className="num mt-1 block break-all text-lg font-semibold text-accent hover:underline">{contract.address}</a>
        <dl className="mt-4 grid gap-2 text-sm">
          {contract.deployTx && (
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-ink-3">{p.deployTx}</dt>
              <dd><a className="num text-accent hover:underline" href={txUrl(contract.deployTx)} target="_blank" rel="noreferrer">{short(contract.deployTx)}</a>{contract.deployBlock ? <span className="num text-ink-3"> · {fmt(p.block, { n: contract.deployBlock })}</span> : null}</dd>
            </div>
          )}
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-ink-3">{p.source}</dt>
            <dd className={contract.verifiedSource ? "text-ok" : "text-ink-2"}>{contract.verifiedSource ? p.sourceVerified : p.sourcePending}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-ink-3">{p.custody}</dt>
            <dd className="text-ink-2">{p.custodyBody}</dd>
          </div>
        </dl>
      </section>

      {/* Only once something has settled: an empty "no rounds yet" box adds nothing to the evidence above. */}
      {proof && proof.rounds.length > 0 && (
        <>
        <h2 className="mt-12 text-2xl font-semibold tracking-tight">{p.rounds}</h2>
        <ul className="mt-4 grid gap-3">
          {proof.rounds.map((r) => (
            <li key={r.roundId} className="rounded-[20px] border border-line p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-ink">{r.circleName ?? p.privateCircle} · {fmt(d.round.crumb, { seq: r.sequence })}</p>
                <p className="num text-sm text-ink-3">{when.format(new Date(r.settledAt))}</p>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><dt className="text-ink-3">{p.crossed}</dt><dd className="num font-semibold text-ink">{money.format(r.crossedUsd)}</dd></div>
                <div><dt className="text-ink-3">{p.participants}</dt><dd className="num font-semibold text-ink">{r.participants}{r.cycleCount > 0 ? <span className="font-normal text-ink-3"> · {fmt(p.cycles, { n: r.cycleCount })}</span> : null}</dd></div>
                <div><dt className="text-ink-3">{p.verifier}</dt><dd className={r.verification?.status === "PASS" ? "font-semibold text-ok" : "font-semibold text-danger"}>{r.verification ? fmt(p.checks, { a: r.verification.passed, b: r.verification.total }) : d.states[r.state]}</dd></div>
                <div><dt className="text-ink-3">{p.tx}</dt><dd><a className="num text-accent hover:underline" href={txUrl(r.settlementTx)} target="_blank" rel="noreferrer">{short(r.settlementTx)}</a></dd></div>
              </dl>
              {r.verification && (
                <p className="mt-3 text-xs text-ink-3">
                  {r.verification.pricesIndependent ? p.pricesChecked : p.pricesBinance} · {r.verification.providersIndependent ? p.providersIndependent : p.providersShared}
                </p>
              )}
            </li>
          ))}
        </ul>
        </>
      )}
    </PublicPage>
  );
}
