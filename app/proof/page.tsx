import { PublicPage } from "@/components/landing/public-page";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getDict } from "@/lib/i18n/server";

/**
 * Onchain proof for reviewers. Deliberately empty until the BSC gates in PRD §23 produce evidence: Venue0's
 * Robinhood Chain transactions are never shown here as Sama's.
 */
export default async function ProofPage() {
  const { d, locale } = await getDict();
  return (
    <PublicPage d={d}>
      <h1 className="text-4xl font-semibold tracking-[-0.04em]">{d.nav.proof}</h1>
      <div className="mt-8">
        <EmptyState
          title={locale === "id" ? "Belum ada bukti di BNB Chain" : "No BNB Chain evidence yet"}
          body={locale === "id" ? "Transaksi settlement dan laporan verifier akan muncul di sini setelah gate testnet T1–T4 lolos." : "Settlement transactions and verifier reports appear here once the testnet gates T1–T4 pass."}
          action={<ButtonLink href="/demo" variant="secondary">{d.nav.demo}</ButtonLink>}
        />
      </div>
    </PublicPage>
  );
}
