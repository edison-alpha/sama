import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import type { Dict } from "@/lib/i18n/dict";

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
        <ButtonLink href="/start" variant="glass" size="lg">{d.landing.footerCtaButton}</ButtonLink>
        <p className="text-xs text-white/70">{d.landing.footerCtaNote}</p>
      </div>

      <div className="relative mx-3 -mt-40 mb-3 overflow-hidden rounded-[32px] bg-night text-white sm:mx-4 sm:-mt-48 sm:mb-4">
        <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <p className="max-w-md text-xl leading-snug text-white/90 sm:text-2xl">{d.landing.footerLead}</p>
          <div className="grid grid-cols-3 gap-6 text-base">
            {cols.map(([title, links], c) => (
              <div key={title}>
                <p className="mb-3 text-lg font-semibold text-white">{title}</p>
                <ul className="grid gap-2">
                  {links.map((label, i) => {
                    const href = HREFS[c]?.[i] ?? "/";
                    return (
                      <li key={label}>
                        {href.startsWith("http") ? (
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
