"use client";

import { m } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo, Mark } from "@/components/brand";
import { IconChevronRight, IconCircles, IconClock, IconHome, IconLayers, IconPie } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { page, spring } from "@/components/motion";
import { PageSkeleton } from "@/components/ui/states";
import { useSession } from "@/components/wallet/session";
import { UserAvatar } from "@/components/wallet/user-avatar";
import { isTestnet } from "@/lib/chain";
import { short } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";
import { LocaleButton, ThemeButton } from "./preferences";
import { SIDEBAR_KEY } from "./boot-scripts";

const NAV = [
  { href: "/home", key: "home", Icon: IconHome },
  { href: "/portfolio", key: "portfolio", Icon: IconPie },
  { href: "/circles", key: "circles", Icon: IconCircles },
  { href: "/activity", key: "activity", Icon: IconClock },
] as const;

/**
 * Floating glass sidebar on desktop, liquid-glass tab bar on phones (PRD §19.3). Signed-out visitors are sent to
 * /start; the shell never flashes product screens before the session is known.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { d } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready } = useSession();

  useEffect(() => {
    if (ready && !session) router.replace(`/start?next=${encodeURIComponent(pathname)}`);
  }, [ready, session, router, pathname]);

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`) || (href === "/circles" && pathname.startsWith("/rounds"));
  // Circle detail and the round journey (plus its receipt) own a fixed primary button at the bottom; the tab
  // bar would float right under it, so phones drop the tab bar there and give that space to the page instead.
  const noTabBar = (pathname.startsWith("/circles/") && pathname !== "/circles/new") || pathname.startsWith("/rounds/") || pathname === "/settings";

  // The collapsed state lives on <html data-sidebar> (applied before paint); this mirror only drives the toggle's labels.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => setCollapsed(document.documentElement.dataset.sidebar === "collapsed"), []);
  function toggleSidebar() {
    const next = !collapsed;
    if (next) document.documentElement.dataset.sidebar = "collapsed";
    else delete document.documentElement.dataset.sidebar;
    try {
      window.localStorage.setItem(SIDEBAR_KEY, next ? "collapsed" : "open");
    } catch {
      // Applies for this page view only.
    }
    setCollapsed(next);
  }

  return (
    <div className="relative isolate min-h-dvh pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:grid md:grid-cols-[272px_1fr] md:transition-[grid-template-columns] md:duration-300 md:collapsed:grid-cols-[88px_1fr]">
      <div className="app-ambient" aria-hidden="true" />

      <aside className="sticky top-0 hidden h-dvh p-3 md:block">
        <div className="glass-panel flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] px-3 py-5">
          <div className="flex items-center justify-between gap-2 pl-2 collapsed:flex-col collapsed:gap-4 collapsed:pl-0">
            <span className="collapsed:hidden"><BrandLogo href="/home" /></span>
            <Link href="/home" aria-label="Sama" className="hidden collapsed:block"><Mark size={30} /></Link>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-expanded={!collapsed}
              aria-label={collapsed ? d.nav.expand : d.nav.collapse}
              title={collapsed ? d.nav.expand : d.nav.collapse}
              className="grid size-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-[var(--tabbar-lens-edge)] hover:text-ink"
            >
              <IconChevronRight size={18} className="rotate-180 transition-transform duration-300 collapsed:rotate-0" />
            </button>
          </div>
          <nav aria-label="Primary" className="mt-8 grid gap-1">
            {NAV.map(({ href, key, Icon }) => (
              <SideLink key={href} href={href} current={active(href)} icon={<Icon bold={active(href)} />}>{d.nav[key]}</SideLink>
            ))}
          </nav>
          <div className="mt-auto grid gap-1">
            <Link href="/learn" title={d.nav.learn} className="flex h-9 items-center rounded-lg px-3 text-sm text-ink-3 hover:text-ink collapsed:justify-center collapsed:px-0">
              <IconLayers size={20} className="hidden collapsed:block" />
              <span className="whitespace-nowrap collapsed:sr-only">{d.nav.learn}</span>
            </Link>
            {session && (
              <Link
                href="/settings"
                title={`${d.nav.settings} · ${short(session.address)}`}
                aria-label={`${d.nav.settings} · ${short(session.address)}`}
                aria-current={active("/settings") ? "page" : undefined}
                className={cx("mt-2 flex items-center gap-3 rounded-2xl p-3 transition-colors collapsed:justify-center collapsed:p-1", active("/settings") ? "bg-[var(--tabbar-lens)]" : "bg-surface/70 hover:bg-surface collapsed:bg-transparent")}
              >
                <UserAvatar name={session.address} size={36} />
                <span className="min-w-0 collapsed:hidden">
                  <span className="num block truncate text-sm font-medium text-ink">{short(session.address)}</span>
                  <span className="block text-xs text-ink-3">{isTestnet ? d.network.testnet : d.network.label}</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <TopBar />
        <main className={cx("mx-auto w-full max-w-6xl flex-1 px-4 pt-[max(16px,env(safe-area-inset-top))] sm:px-6 md:pb-12 md:pt-6", noTabBar ? "pb-6" : "pb-36")}>
          {ready && session ? (
            // Keyed by route so each screen plays its entrance; cards and tiles inside stagger in (see `rise`).
            <m.div key={pathname} initial="hidden" animate="show" variants={page}>{children}</m.div>
          ) : (
            <PageSkeleton />
          )}
        </main>
      </div>

      {!noTabBar && <TabBar active={active} />}
      {isTestnet && <span className="sr-only">{d.common.testnet}</span>}
    </div>
  );
}

function SideLink({ href, current, icon, children }: { href: string; current: boolean; icon: React.ReactNode; children: string }) {
  return (
    <Link href={href} title={children} aria-current={current ? "page" : undefined} className={cx("relative flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-[color,background-color,transform] active:scale-[0.97] collapsed:justify-center collapsed:px-0", current ? "font-semibold text-ink" : "text-ink-2 hover:bg-[var(--tabbar-lens-edge)] hover:text-ink")}>
      {/* One shared highlight that slides to whichever link is current. */}
      {current && <m.span layoutId="sidebar-active" transition={spring} className="absolute inset-0 rounded-xl bg-[var(--tabbar-lens)]" aria-hidden="true" />}
      <span className="relative shrink-0">{icon}</span>
      <span className="relative whitespace-nowrap collapsed:sr-only">{children}</span>
    </Link>
  );
}

/**
 * Phone navigation: a frosted pill holding the four main tabs, with a glass lens that slides to the active one, and a
 * round glass button beside it holding the user's avatar, which opens Settings. Floats above the content and clears the
 * home indicator.
 */
function TabBar({ active }: { active: (href: string) => boolean }) {
  const { d } = useI18n();
  const index = NAV.findIndex(({ href }) => active(href));
  const { session } = useSession();
  const settings = active("/settings");
  return (
    <nav aria-label="Primary" className="fixed inset-x-4 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 flex items-center gap-2.5 md:hidden">
      <div className="tabbar-glass relative grid h-16 flex-1 grid-cols-4 rounded-full p-1">
        <m.span
          aria-hidden="true"
          className="tabbar-lens absolute inset-y-1 left-1 w-[calc((100%-8px)/4)] rounded-full"
          initial={false}
          animate={{ x: `${Math.max(0, index) * 100}%`, opacity: index < 0 ? 0 : 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.9 }}
        />
        {NAV.map(({ href, key, Icon }, i) => (
          <Link key={href} href={href} aria-current={i === index ? "page" : undefined} className={cx("relative flex flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold transition-[color,transform] duration-200 active:scale-90", i === index ? "text-ink" : "text-ink-3 hover:text-ink-2")}>
            <Icon size={24} bold={i === index} />
            {d.nav[key]}
          </Link>
        ))}
      </div>
      <Link
        href="/settings"
        aria-current={settings ? "page" : undefined}
        aria-label={session ? `${d.nav.settings} · ${short(session.address)}` : d.nav.settings}
        className="grid size-16 shrink-0 place-items-center rounded-full transition-transform active:scale-95"
      >
        <UserAvatar name={session?.address ?? "sama"} size={56} />
      </Link>
    </nav>
  );
}

/** Desktop top bar (network, language, theme). Phones skip it: each screen has its own app-style header, and Settings holds language and theme. */
function TopBar() {
  const { d } = useI18n();
  const { wrongNetwork, switchNetwork } = useSession();
  return (
    <>
      {wrongNetwork && (
        <div role="alert" className="flex flex-wrap items-center justify-center gap-3 bg-warn-soft px-4 py-2 text-sm text-warn">
          {d.network.wrong}
          <Button size="sm" variant="secondary" onClick={() => void switchNetwork()}>{d.network.switch}</Button>
        </div>
      )}
      <header className={cx("sticky top-0 z-30 flex h-16 items-center justify-between gap-2 bg-[color-mix(in_srgb,var(--app-bg)_72%,transparent)] px-4 backdrop-blur-xl sm:px-6 md:bg-transparent md:backdrop-blur-none max-md:hidden")}>
        <div className="md:hidden"><BrandLogo href="/home" className="h-8" /></div>
        <div className="hidden md:block" />
        <div className="flex items-center gap-1 rounded-full md:border md:border-[var(--glass-edge)] md:bg-[var(--glass-bg)] md:px-1.5 md:py-1 md:shadow-[inset_0_1px_0_var(--glass-hi),var(--elev-sidebar)] md:backdrop-blur-xl">
          <span className="mr-1 hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink-2 sm:inline-flex">
            <span className="size-2 rounded-full bg-ok shadow-[0_0_0_3px_color-mix(in_srgb,var(--ok)_25%,transparent)]" />
            {isTestnet ? d.network.testnet : d.network.label}
          </span>
          <LocaleButton />
          <ThemeButton />
        </div>
      </header>
    </>
  );
}
