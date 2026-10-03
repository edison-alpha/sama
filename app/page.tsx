import Link from "next/link";
import { AssetIcon } from "@/components/asset-icon";
import { Mark } from "@/components/brand";
import { ProblemCarousel } from "@/components/landing/problem-carousel";
import { FeatureBento } from "@/components/landing/feature-bento";
import { FlowSteps } from "@/components/landing/flow-steps";
import { Stats } from "@/components/landing/stats";
import { SiteFooter } from "@/components/landing/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { getDict } from "@/lib/i18n/server";

/**
 * Landing page, built from the Sama landing design: photo hero with glass navigation, supported-asset strip,
 * problem carousel, large panel with an inset card, bento grid, photo footer with the big brand logo.
 * No wallet SDK loads here (PRD §19.4.1).
 */

/** Underlying stocks and BNB Chain crypto shown in the strip; icons come from Iconify (components/asset-icon.tsx). */
const ASSETS = ["NVDA", "NFLX", "AMZN", "TSLA", "AAPL", "X", "AMD", "TSM", "META", "BNB", "BTCB", "ETH", "USDT"];

/** One background per flow item; replace the files in public/landing/ to change the photos. */
const FLOW_IMAGES = ["/landing/flow-1.webp", "/landing/flow-2.webp", "/landing/flow-3.webp", "/landing/flow-4.webp"];

export default async function Landing() {
  const { d } = await getDict();
  const L = d.landing;

  return (
    <div className="bg-bg text-ink">
      {/* ---------- Hero ---------- */}
      {/* Full-viewport hero: a looping video fills the rounded frame edge to edge, poster/fallback is the stills photo. */}
      <section className="relative mx-2 mt-2 overflow-hidden rounded-[var(--radius-panel)] bg-sky sm:mx-3.5 sm:mt-3.5">
        <video autoPlay loop muted playsInline poster="/hero-bg.webp" className="absolute inset-0 size-full object-cover" aria-hidden="true">
          <source src="/hero.webm" type="video/webm" />
        </video>
        <div className="relative flex min-h-[calc(100svh-16px)] flex-col px-4 pb-10 pt-5 sm:min-h-[calc(100svh-28px)] sm:px-14 sm:pt-8">
          <nav className="grid grid-cols-[1fr_auto_1fr] items-center">
            <div className="hidden w-fit items-center rounded-full glass px-2 py-1.5  md:flex">
              {([["/", L.nav.home], ["/circles", L.nav.circles], ["/learn", L.nav.rails], ["/proof", L.nav.proof]] as const).map(([href, label]) => (
                <Link key={label} href={href} className="rounded-full px-5 py-2 text-base font-medium text-white hover:bg-white/15">{label}</Link>
              ))}
            </div>
            <div className="md:hidden" />
            <Link href="/" aria-label="Sama" className="justify-self-center"><Mark size={46} white /></Link>
            <ButtonLink href="/start" className="justify-self-end px-8">{L.join}</ButtonLink>
          </nav>

          <div className="mx-auto mt-[11vh] flex max-w-4xl flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full glass py-1 pl-1.5 pr-3 text-xs font-medium text-white sm:text-sm">
              <AssetIcon symbol="BNB" size={20} />
              {L.badge}
            </span>
            <h1 className="mt-5 whitespace-pre-line text-balance text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.025em] text-white [text-shadow:0_2px_24px_rgb(0_20_60/0.35)] sm:text-6xl lg:text-7xl">{L.title}</h1>
            <p className="mt-5 max-w-md text-pretty text-sm leading-relaxed text-white/80 [text-shadow:0_1px_12px_rgb(0_20_60/0.4)] sm:text-[15px]">{L.lead}</p>
            <div className="mt-9 flex flex-wrap justify-center gap-2.5">
              <ButtonLink href="/start" variant="glass" size="lg" className="min-w-36 sm:h-14 sm:min-w-40 sm:text-lg">{L.secondary}</ButtonLink>
              <ButtonLink href="/learn" size="lg" className="min-w-36 sm:h-14 sm:min-w-40 sm:text-lg">{L.start}</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Supported assets ---------- */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
        <p className="text-sm text-ink-2">{L.worksWith}<br className="hidden sm:block" /> {L.worksWith2}</p>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {ASSETS.map((symbol) => (
            <li key={symbol} title={symbol} className="rounded-full shadow-card">
              <AssetIcon symbol={symbol} size={44} />
            </li>
          ))}
          <li className="text-sm text-ink-2">{L.more}</li>
        </ul>
      </section>

      {/* ---------- Problem carousel ---------- */}
      <ProblemCarousel title={L.problemTitle} lead={L.problemLead} items={L.problems} />

      {/* ---------- Sticky flow ---------- */}
      <FlowSteps items={L.flow} images={FLOW_IMAGES} />

      {/* ---------- Bento ---------- */}
      <FeatureBento title={L.bentoTitle} lead={L.bentoLead} {...L.bento} />

      {/* ---------- Stats ---------- */}
      <Stats title={L.statsTitle} stats={L.stats as unknown as Array<[number, number, string, string]>} />

      <SiteFooter d={d} />
    </div>
  );
}
