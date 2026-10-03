import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { LocaleButton, ThemeButton } from "@/components/shell/preferences";
import { ButtonLink } from "@/components/ui/button";
import type { Dict } from "@/lib/i18n/dict";
import { SiteFooter } from "./site-footer";

/** Frame for public pages other than the landing (learn, proof, demo). */
export function PublicPage({ d, children }: { d: Dict; children: React.ReactNode }) {
  return (
    <div className="bg-bg text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-5 sm:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-1 rounded-full bg-surface-2 p-1 text-sm font-medium sm:flex">
          <Link href="/learn" className="rounded-full px-4 py-2 hover:bg-surface">{d.nav.learn}</Link>
          <Link href="/proof" className="rounded-full px-4 py-2 hover:bg-surface">{d.nav.proof}</Link>
          <Link href="/demo" className="rounded-full px-4 py-2 hover:bg-surface">{d.nav.demo}</Link>
        </nav>
        <div className="flex items-center gap-1">
          <LocaleButton />
          <ThemeButton />
          <ButtonLink href="/start" size="sm">{d.landing.join}</ButtonLink>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-8">{children}</main>
      <SiteFooter d={d} />
    </div>
  );
}
