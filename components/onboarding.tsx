"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AssetIcon } from "@/components/asset-icon";
import { Mark } from "@/components/brand";
import { IconArrowLeft, IconArrowRight, IconCheckCircle, IconMail, IconTarget, IconWallet } from "@/components/icons";
import { AllocationDonut, colorFor } from "@/components/portfolio/allocation-donut";
import { LocaleButton, ThemeButton } from "@/components/shell/preferences";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorNote, Skeleton } from "@/components/ui/states";
import { useSession } from "@/components/wallet/session";
import { sama } from "@/lib/api";
import { PRESETS } from "@/lib/api/demo-data";
import type { Portfolio } from "@/lib/api/types";
import { useAction } from "@/lib/api/use-api";
import { FAUCET_URL, isTestnet } from "@/lib/chain";
import { percent, short, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/dict";
import { cx } from "@/utils/cx";

const STEP_KEY = "sama_onboarding_step";
const STEPS = 3;
const WELCOME_ASSETS = ["BTCB", "WBNB", "ETH", "USDT", "tNVDA", "USDC"];
type PresetKey = keyof typeof PRESETS;

/**
 * App-style onboarding (PRD §19.4.2): sign in → portfolio → target, one centred column, a hero orbit that changes with
 * each step, short copy, and one big action at the bottom. A refresh resumes at the last step; a user without supported
 * assets can still finish.
 */
export function Onboarding() {
  const { d, fmt, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const { session, ready, signIn, error } = useSession();
  const [step, setStep] = useState(0);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [preset, setPreset] = useState<PresetKey | null>("balanced");
  const act = useAction();
  const next = params.get("next") ?? "/home";
  const s = d.start;
  // This tree hydrates inside <Suspense>, after the session provider may already be ready. Gating on a local mount flag
  // keeps the first client render identical to the server HTML, so the sign-in button is not left stuck disabled.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const canSignIn = mounted && ready;

  useEffect(() => {
    if (!session) return;
    let saved = 1;
    try {
      saved = Number(window.sessionStorage.getItem(STEP_KEY) ?? 1) || 1;
    } catch {
      // Start right after sign-in.
    }
    go(Math.min(2, Math.max(1, saved)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (session && step >= 1 && !portfolio) void sama.portfolio().then((p) => setPortfolio(p.portfolio));
  }, [step, session, portfolio]);

  function go(n: number) {
    setStep(n);
    try {
      window.sessionStorage.setItem(STEP_KEY, String(n));
    } catch {
      // Not remembered across refreshes.
    }
  }

  const finish = (withTarget: boolean) =>
    act.run(async () => {
      if (withTarget && preset) await sama.saveTarget({ weights: PRESETS[preset], costCapBps: 100, residualStyle: "ECONOMIC" });
      try {
        window.sessionStorage.removeItem(STEP_KEY);
      } catch {}
      // "I'll set it myself" continues in the full target editor.
      router.push(withTarget && !preset ? "/portfolio" : next);
    });

  const positions = useMemo(() => (portfolio?.ok ? [...portfolio.positions].sort((a, b) => b.pct - a.pct) : []), [portfolio]);
  const order = useMemo(
    () => [...new Set([...positions.map((p) => p.symbol), ...Object.values(PRESETS).flatMap((w) => Object.keys(w))])],
    [positions],
  );
  const held = positions.map((p) => p.symbol);

  const orbit = held.length ? held : WELCOME_ASSETS;

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="grid grid-cols-[88px_1fr_88px] items-center py-4">
          <div>
            {step === 2 ? (
              <button type="button" onClick={() => go(1)} aria-label={d.common.back} className="grid size-10 place-items-center rounded-full bg-surface-2 text-ink transition-colors hover:bg-surface-3">
                <IconArrowLeft size={20} />
              </button>
            ) : (
              <Mark size={26} />
            )}
          </div>
          <ol className="flex items-center justify-center gap-1.5" aria-label={fmt(s.stepOf, { n: step + 1, total: STEPS })}>
            {s.steps.map((label, i) => (
              <li key={label} aria-current={i === step ? "step" : undefined} className={cx("h-1.5 rounded-full transition-all duration-500", i === step ? "w-8 bg-accent" : i < step ? "w-4 bg-accent/45" : "w-4 bg-ink/10")}>
                <span className="sr-only">{label}</span>
              </li>
            ))}
          </ol>
          <div className="flex justify-end"><LocaleButton /><ThemeButton /></div>
        </header>

        <main key={step} className="ob-step flex flex-1 flex-col">
          {step === 0 && <WelcomeHero />}

          {step === 1 && (
            <PortfolioHero symbols={orbit}>
              <span className="grid min-w-36 place-items-center rounded-[26px] bg-surface px-5 py-4 text-center shadow-[var(--elev-float)]">
                {portfolio ? (
                  <>
                    <span className="text-2xl font-semibold tabular-nums tracking-tight">{portfolio.ok ? usd(portfolio.totalUsd, locale, 0) : "—"}</span>
                    <span className="text-xs text-ink-3">{s.walletValue}</span>
                  </>
                ) : (
                  <Skeleton className="h-12 w-28" />
                )}
              </span>
            </PortfolioHero>
          )}

          {step === 2 && <TargetHero preset={preset} order={order} locale={locale} label={preset ? d.portfolio.presets[preset][0] : s.custom} customLabel={s.custom} />}

          <div className="mt-8 text-center">
            <h1 className="text-balance text-[28px] font-semibold leading-[1.15] tracking-[-0.03em]">{[s.signInTitle, s.portfolioTitle, s.targetTitle][step]}</h1>
            <p className="mx-auto mt-2.5 max-w-[340px] text-pretty text-[15px] leading-relaxed text-ink-2">{[s.signInBody, s.portfolioBody, s.targetBody][step]}</p>
          </div>

          <div className="mt-6">
            {step === 1 &&
              (!portfolio ? (
                <div className="flex justify-center gap-2">
                  <Skeleton className="h-9 w-24 rounded-full" />
                  <Skeleton className="h-9 w-24 rounded-full" />
                  <Skeleton className="h-9 w-24 rounded-full" />
                </div>
              ) : !portfolio.ok || positions.length === 0 ? (
                <EmptyState
                  title={s.emptyTitle}
                  body={isTestnet ? s.emptyBodyTestnet : s.emptyBodyMainnet}
                  action={isTestnet ? <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent">{s.faucet} →</a> : null}
                />
              ) : (
                <ul className="flex flex-wrap justify-center gap-2" aria-label={s.portfolioTitle}>
                  {positions.map((p, i) => (
                    <li key={p.symbol} className="ob-pop inline-flex items-center gap-2 rounded-full bg-surface-2 py-1.5 pl-1.5 pr-3.5 text-sm" style={{ "--i": i } as React.CSSProperties}>
                      <AssetIcon symbol={p.symbol} size={24} />
                      <span className="font-medium">{p.symbol}</span>
                      <span className="tabular-nums text-ink-3">{percent(p.pct, locale, 0)}</span>
                    </li>
                  ))}
                </ul>
              ))}

            {step === 2 && (
              <div>
                <div role="radiogroup" aria-label={s.targetTitle} className="grid grid-cols-3 gap-2">
                  {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
                    <PresetTile key={k} checked={preset === k} onSelect={() => setPreset(k)} name={d.portfolio.presets[k][0]} note={k === "balanced" ? s.recommended : undefined} />
                  ))}
                </div>
                <p className="mt-3 min-h-10 text-center text-sm text-ink-3">{preset ? d.portfolio.presets[preset][1] : s.customBody}</p>
                <div className="text-center">
                  <button
                    type="button"
                    aria-pressed={preset === null}
                    onClick={() => setPreset(null)}
                    className={cx("text-sm font-medium underline-offset-4 transition-colors", preset === null ? "text-ink underline decoration-accent decoration-2" : "text-ink-2 hover:text-ink")}
                  >
                    {s.custom}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto grid gap-2.5 pt-8">
            {(error || act.error) && <ErrorNote>{error ?? act.error}</ErrorNote>}

            {step === 0 &&
              (session ? (
                <p className="flex items-center justify-center gap-2 rounded-full bg-ok-soft py-3.5 text-sm text-ok">
                  <IconCheckCircle size={18} bold />
                  {s.signedInAs} <span className="num font-medium">{short(session.address)}</span>
                </p>
              ) : (
                <>
                  <BigButton onClick={() => signIn("email")} disabled={!canSignIn} icon={<IconMail size={20} />}>{s.email}</BigButton>
                  <BigButton onClick={() => signIn("wallet")} disabled={!canSignIn} icon={<IconWallet size={20} />} variant="secondary">{s.wallet}</BigButton>
                </>
              ))}

            {step === 1 && <BigButton onClick={() => go(2)} trailing={<IconArrowRight size={20} />}>{d.common.continue}</BigButton>}

            {step === 2 && (
              <>
                <BigButton onClick={() => finish(true)} busy={act.pending}>{preset ? s.finish : d.common.continue}</BigButton>
                <Button variant="ghost" size="lg" block onClick={() => finish(false)}>{s.later}</Button>
              </>
            )}

            <p className="pt-2 text-center text-xs text-ink-3">{d.common.notInvestmentAdvice}</p>
          </div>
        </main>
      </div>
    </div>
  );
}

/** Shared hero shell: fixes the height across steps so the page doesn't jump as the inside changes completely. */
function HeroFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid h-[300px] place-items-center overflow-hidden rounded-[36px] bg-surface-2" aria-hidden="true">
      {children}
    </div>
  );
}

/** Step 1 hero: a single still glow behind the mark — calm, no data to visualise yet. */
function WelcomeHero() {
  return (
    <HeroFrame>
      <span className="absolute size-48 rounded-full bg-accent/25 blur-3xl" />
      <span className="ob-breathe absolute size-56 rounded-full border border-dashed border-line-strong" />
      <span className="relative grid size-24 place-items-center rounded-[30px] bg-surface shadow-[var(--elev-float)]">
        <Mark size={44} />
      </span>
    </HeroFrame>
  );
}

/**
 * Step 2 hero: a soft-lit tray with two dashed rings; the user's own asset logos orbit slowly (outer clockwise,
 * inner the other way) and stay upright, around their wallet value.
 */
function PortfolioHero({ symbols, children }: { symbols: string[]; children: ReactNode }) {
  const outer = symbols.slice(0, 4);
  const inner = symbols.slice(4, 7);
  return (
    <HeroFrame>
      <span className="absolute size-44 rounded-full bg-accent/25 blur-3xl" />
      <span className="absolute size-[264px] rounded-full border border-dashed border-line-strong" />
      <span className="absolute size-[168px] rounded-full border border-dashed border-line-strong" />
      <Ring symbols={outer} radius={132} size={44} className="ob-orbit" />
      <Ring symbols={inner} radius={84} size={34} className="ob-orbit-rev" offset={30} />
      <div className="relative">{children}</div>
    </HeroFrame>
  );
}

/** Step 3 hero: the allocation itself is the visual — a bigger donut with its own breakdown, no orbiting icons. */
function TargetHero({ preset, order, locale, label, customLabel }: { preset: PresetKey | null; order: string[]; locale: Locale; label: string; customLabel: string }) {
  if (!preset) {
    return (
      <HeroFrame>
        <span className="absolute size-48 rounded-full bg-accent/15 blur-3xl" />
        <span className="relative grid size-28 place-items-center gap-1 rounded-[30px] bg-surface text-center shadow-[var(--elev-float)]">
          <IconTarget size={24} />
          <span className="text-xs font-medium text-ink-3">{customLabel}</span>
        </span>
      </HeroFrame>
    );
  }
  const weights = PRESETS[preset];
  const parts = order
    .filter((sym) => (weights[sym] ?? 0) > 0)
    .map((sym) => ({ sym, w: weights[sym]! }))
    .sort((a, b) => b.w - a.w);
  return (
    <HeroFrame>
      <span className="absolute size-56 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative flex items-center gap-5 px-6">
        <AllocationDonut weights={weights} order={order} label={label} size={136} />
        <ul className="grid gap-2">
          {parts.slice(0, 4).map((p, i) => (
            <li key={p.sym} className="ob-pop flex items-center gap-2 text-sm" style={{ "--i": i } as React.CSSProperties}>
              <span className="size-2.5 rounded-full" style={{ background: colorFor(p.sym, order) }} />
              <span className="font-medium">{p.sym}</span>
              <span className="tabular-nums text-ink-3">{percent(p.w, locale, 0)}</span>
            </li>
          ))}
        </ul>
      </div>
    </HeroFrame>
  );
}

function Ring({ symbols, radius, size, className, offset = 0 }: { symbols: string[]; radius: number; size: number; className: string; offset?: number }) {
  if (symbols.length === 0) return null;
  return (
    <div className={cx("absolute", className)} style={{ width: radius * 2, height: radius * 2 }}>
      {symbols.map((sym, i) => {
        const angle = offset + (360 / symbols.length) * i;
        return (
          <span
            key={sym}
            className="absolute left-1/2 top-1/2"
            style={{ marginLeft: -size / 2, marginTop: -size / 2, transform: `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)` }}
          >
            <span className="ob-upright block">
              <span className="ob-pop block rounded-full bg-surface p-1 shadow-[0_6px_16px_-6px_rgb(13_20_48/0.3)]" style={{ "--i": i } as React.CSSProperties}>
                <AssetIcon symbol={sym} size={size - 8} />
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** One preset choice: a native radio (arrow keys move within the group) styled as a tile; the chosen one turns solid. */
function PresetTile({ checked, onSelect, name, note }: { checked: boolean; onSelect: () => void; name: string; note?: string }) {
  return (
    <label
      className={cx(
        "flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-3 text-center transition-[background-color,color,transform] duration-200 active:scale-[0.97]",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]",
        checked ? "bg-ink text-bg" : "bg-surface-2 text-ink hover:bg-surface-3",
      )}
    >
      <input type="radio" name="preset" checked={checked} onChange={onSelect} className="sr-only" />
      <span className="text-[15px] font-semibold">{name}</span>
      {note && <span className={cx("text-[11px] font-medium", checked ? "text-accent" : "text-accent-strong")}>{note}</span>}
    </label>
  );
}

function BigButton({ variant = "primary", ...rest }: React.ComponentProps<typeof Button>) {
  return <Button size="lg" block variant={variant} className="h-14 text-base" {...rest} />;
}
