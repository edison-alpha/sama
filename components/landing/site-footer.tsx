import Link from "next/link";
import { AssetIcon } from "@/components/asset-icon";
import { ButtonLink } from "@/components/ui/button";
import type { Dict } from "@/lib/i18n/dict";
import { appUrl, resolveHref } from "@/lib/site";

/** The deployed SamaSettlement on BNB Chain mainnet; mirrors sama-packages/shared/src/deployments/56.json. */
const SETTLEMENT = "0x7811a30D29d6c2Ca95Aeb4EE9D896cE44Cb72AC8";

const HREFS = [
  ["/", "/circles", "/proof", "/demo"],
  ["/docs", "/docs/glossary", "/docs/faq", "/docs/security"],
  ["https://t.me/", "https://x.com/", "https://github.com/", "https://www.bnbchain.org/"],
];

/**
 * Footer from the landing design: the photo (public/footer-bg.png) full-bleed with no frame behind it, a centered
 * headline and CTA button over the visible sky, and a black card overlapping only the bottom of the photo.
 */
export function SiteFooter({ d }: { d: Dict }) {
  const cols = d.landing.footerCols as unknown as Array<[string, string[]]>;
  return (
    <footer className="relative mx-2 mb-2 overflow-hidden rounded-[var(--radius-panel)] bg-[url(/footer-bg.png)] bg-cover bg-center sm:mx-3 sm:mb-3">
      <div className="flex h-[620px] flex-col items-center gap-3 px-6 pt-20 text-center sm:h-[860px] sm:gap-4 sm:pt-28">
        <h2 className="max-w-xl text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] text-white drop-shadow-sm sm:text-5xl">{d.landing.footerCtaTitle}</h2>
        <p className="max-w-md text-pretty text-sm text-white/85 sm:text-base">{d.landing.footerCtaBody}</p>
        <ButtonLink href={appUrl("/start")} variant="glass" size="lg">{d.landing.footerCtaButton}</ButtonLink>
        <p className="text-xs text-white/70">{d.landing.footerCtaNote}</p>
      </div>

      <div className="relative mx-3 -mt-40 mb-3 overflow-hidden rounded-[32px] bg-night text-white sm:mx-4 sm:-mt-48 sm:mb-4">
        <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid content-start gap-6">
            <p className="max-w-md text-xl leading-snug text-white/90 sm:text-2xl">{d.landing.footerLead}</p>
            {/* The settlement contract on BscScan: a label, then the BNB Chain mark and the short address. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-sm font-medium text-white">{d.landing.contractLabel}</span>
              <a
                href={`https://bscscan.com/address/${SETTLEMENT}`}
                target="_blank"
                rel="noreferrer"
                title={`${d.landing.proofLabel} · ${SETTLEMENT}`}
                className="num flex w-fit items-center gap-2.5 rounded-full border border-white/15 bg-white/5 py-2 pl-2.5 pr-4 text-sm text-white/80 hover:bg-white/10 hover:text-white"
              >
                <AssetIcon symbol="BNB" size={22} />
                {SETTLEMENT.slice(0, 6)}…{SETTLEMENT.slice(-4)}
              </a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-base">
            {cols.map(([title, links], c) => (
              <div key={title}>
                <p className="mb-3 text-lg font-semibold text-white">{title}</p>
                <ul className="grid gap-2">
                  {links.map((label, i) => {
                    const raw = HREFS[c]?.[i] ?? "/";
                    const href = resolveHref(raw);
                    return (
                      <li key={label}>
                        {raw.startsWith("http") ? (
                          <a href={href} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white">{label}</a>
                        ) : (
                          <Link href={href} className="text-white/60 hover:text-white">{label}</Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {/* Subtle lift behind the wordmark: black fading to a slightly lighter charcoal, no colour. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-white/[0.06] to-transparent" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sama-brand-logo.svg" alt="Sama" className="pointer-events-none relative mx-auto -mb-[9%] mt-6 block w-[96%] max-w-[1280px] select-none opacity-30" />
      </div>
    </footer>
  );
}
