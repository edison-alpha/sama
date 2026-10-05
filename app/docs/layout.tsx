import Link from "next/link";
import { BrandLogo } from "@/components/brand";
import { DocsSearch } from "@/components/docs/search";
import { DocsMobileNav, DocsSidebar } from "@/components/docs/sidebar";
import { LocaleButton, ThemeButton } from "@/components/shell/preferences";
import { ButtonLink } from "@/components/ui/button";
import { navOf, searchIndex } from "@/lib/docs";
import { getDict } from "@/lib/i18n/server";

/** The docs frame: a sticky header with search, the page list on the left, and the page (with its own outline) on the right. */
export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const { d, locale } = await getDict();
  const groups = navOf(locale);
  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
          <DocsMobileNav groups={groups} />
          <BrandLogo href="/docs" className="h-7" />
          <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-ink-2">{d.docs.label}</span>
          <div className="ml-auto hidden md:block">
            <DocsSearch entries={searchIndex(locale)} />
          </div>
          <nav className="ml-auto hidden items-center gap-1 text-sm font-medium text-ink-2 md:ml-2 md:flex">
            <Link href="/proof" className="rounded-full px-3 py-2 hover:bg-surface-2 hover:text-ink">{d.nav.proof}</Link>
            <Link href="/demo" className="rounded-full px-3 py-2 hover:bg-surface-2 hover:text-ink">{d.nav.demo}</Link>
          </nav>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <LocaleButton />
            <ThemeButton />
            <ButtonLink href="/start" size="sm" className="ml-1 hidden sm:inline-flex">{d.docs.openApp}</ButtonLink>
          </div>
        </div>
        <div className="border-t border-line px-4 py-2 md:hidden">
          <DocsSearch entries={searchIndex(locale)} hotkey={false} />
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:grid lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-10">
        <DocsSidebar groups={groups} />
        <div className="min-w-0">{children}</div>
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
