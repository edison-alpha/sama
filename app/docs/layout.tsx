import Link from "next/link";
import { BrandLogo } from "@/components/brand";
import { DocsSearch } from "@/components/docs/search";
import { DocsMobileNav, DocsSidebar } from "@/components/docs/sidebar";
import { LocaleButton, ThemeButton } from "@/components/shell/preferences";
import { ButtonLink } from "@/components/ui/button";
import { navOf, searchIndex } from "@/lib/docs";
import { getDict } from "@/lib/i18n/server";
import { appUrl, docsUrl, siteUrl } from "@/lib/site";

/** The docs frame: a sticky header with search, the page list on the left, and the page (with its own outline) on the right. */
export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const { d, locale } = await getDict();
  const groups = navOf(locale);
  return (
    <div className="docs-theme min-h-dvh bg-bg text-ink">
      <a href="#docs-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[80] focus:rounded-lg focus:bg-surface focus:p-3">{d.docs.skipContent}</a>
      <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center gap-2 px-4 py-2 sm:gap-3 sm:px-6">
          <DocsMobileNav groups={groups} />
          <BrandLogo href={docsUrl("/docs")} className="h-7" />
          <span className="hidden rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-ink-2 sm:inline">{d.docs.label}</span>
          <div className="order-last w-full md:order-none md:ml-auto md:w-auto">
            <DocsSearch entries={searchIndex(locale)} />
          </div>
          <nav className="ml-auto hidden items-center gap-1 text-sm font-medium text-ink-2 xl:ml-2 xl:flex">
            <Link href={siteUrl("/proof")} className="inline-flex min-h-11 items-center rounded-full px-3 py-2 hover:bg-surface-2 hover:text-ink">{d.nav.proof}</Link>
            <Link href={siteUrl("/demo")} className="inline-flex min-h-11 items-center rounded-full px-3 py-2 hover:bg-surface-2 hover:text-ink">{d.nav.demo}</Link>
          </nav>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <LocaleButton />
            <ThemeButton />
            <ButtonLink href={appUrl("/start")} size="sm" className="ml-1 hidden min-h-11 lg:inline-flex">{d.docs.openApp}</ButtonLink>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:grid lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-10">
        <DocsSidebar groups={groups} />
        <main id="docs-content" tabIndex={-1} className="min-w-0">{children}</main>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-8 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{d.landing.footer}</p>
          <p className="max-w-xl sm:text-right">{d.common.notInvestmentAdvice}</p>
        </div>
      </footer>
    </div>
  );
}
