"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AssetIcon } from "@/components/asset-icon";
import { Mark } from "@/components/brand";
import { IconArrowLeft, IconArrowRight, IconCheck, IconCheckCircle, IconSpinner, IconTarget } from "@/components/icons";
import { colorFor } from "@/components/portfolio/allocation-donut";
import { LocaleButton, ThemeButton } from "@/components/shell/preferences";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorNote, Skeleton } from "@/components/ui/states";
import { useSession } from "@/components/wallet/session";
import { sama } from "@/lib/api";
import { DEMO_ASSETS, DEMO_HOLDINGS, PRESETS } from "@/lib/api/demo-data";
import type { Portfolio } from "@/lib/api/types";
import { useAction } from "@/lib/api/use-api";
import { FAUCET_URL, isTestnet } from "@/lib/chain";
import { percent, short, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/dict";
import { markOnboardingDone, ONBOARDING_STEP_KEY } from "@/lib/onboarding";
import { cx } from "@/utils/cx";

const STEPS = 3;
const WELCOME_ASSETS = ["NVDAB", "AAPLB", "TSLAB"];
const WELCOME_MOVER = "GOOGLB";
type PresetKey = keyof typeof PRESETS;
type Row = { symbol: string; pct: number };

/**
 * Onboarding (PRD §19.4.2): sign in → portfolio → target. Each step leads with a hero card — a market line with
 * floating glass cards on top — then short copy and one big action. Phones get a single column with the action pinned
 * to the bottom; wider screens get a bigger card and the whole step centred on the page. A refresh resumes at the last
 * step; a user without supported assets can still finish.
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
    if (session.onboardingDone) {
      router.replace(next);
      return;
    }
    let saved = 1;
    try {
      saved = Number(window.sessionStorage.getItem(ONBOARDING_STEP_KEY) ?? 1) || 1;
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
      window.sessionStorage.setItem(ONBOARDING_STEP_KEY, String(n));
    } catch {
      // Not remembered across refreshes.
    }
  }

  const finish = (withTarget: boolean) =>
    act.run(async () => {
      if (withTarget && preset) await sama.saveTarget({ weights: PRESETS[preset], costCapBps: 100, residualStyle: "ECONOMIC" });
      await sama.setOnboardingDone(true);
      try {
        window.sessionStorage.removeItem(ONBOARDING_STEP_KEY);
      } catch {}
      if (session) markOnboardingDone(session.address);
      // "I'll set it myself" continues in the full target editor.
      router.push(withTarget && !preset ? "/portfolio" : next);
    });

  const positions = useMemo(() => (portfolio?.ok ? [...portfolio.positions].sort((a, b) => b.pct - a.pct) : []), [portfolio]);
  const order = useMemo(
    () => [...new Set([...positions.map((p) => p.symbol), ...Object.values(PRESETS).flatMap((w) => Object.keys(w))])],
    [positions],
  );

  // Check before showing anything: until the session is known, or while a user who already finished onboarding is being
  // sent on to `next`, show a neutral splash instead of flashing the login step at a returning user.
  if (!canSignIn || session?.onboardingDone) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-ink" role="status" aria-live="polite">
        <div className="ob-step grid justify-items-center gap-4">
          <Mark size={40} />
          <span className="flex items-center gap-2 text-sm text-ink-3">
            <IconSpinner size={16} />
            {s.checking}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-[640px] sm:px-6">
        <header className="grid grid-cols-[88px_1fr_88px] items-center py-4 sm:py-6">
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

        <main key={step} className="ob-step flex flex-1 flex-col sm:justify-center sm:pb-16">
          {step === 0 && <WelcomeHero locale={locale} />}

          {step === 1 && <PortfolioHero portfolio={portfolio} positions={positions} locale={locale} labels={{ walletValue: s.walletValue, assets: s.statAssets, largest: s.statLargest }} />}

          {step === 2 && <TargetHero preset={preset} order={order} locale={locale} label={preset ? d.portfolio.presets[preset][0] : s.custom} assetsLabel={s.statAssets} largestLabel={s.statLargest} customLabel={s.custom} customBody={s.customBody} />}

          <div className="mt-8 text-center">
            <h1 className="text-balance text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[28px]">{[s.signInTitle, s.portfolioTitle, s.targetTitle][step]}</h1>
            <p className="mx-auto mt-2.5 max-w-[400px] text-pretty text-[15px] leading-relaxed text-ink-2">{[s.signInBody, s.portfolioBody, s.targetBody][step]}</p>
          </div>

          <div className="mx-auto mt-6 w-full max-w-[440px]">
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
                <div role="radiogroup" aria-label={s.targetTitle} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
                    <PresetTile
                      key={k}
                      checked={preset === k}
                      onSelect={() => setPreset(k)}
                      name={d.portfolio.presets[k][0]}
                      note={k === "balanced" ? s.recommended : undefined}
                      visual={<LogoStack symbols={partsOf(k).slice(0, 3).map((p) => p.symbol)} size={20} />}
                    />
                  ))}
                  <PresetTile
                    checked={preset === null}
                    onSelect={() => setPreset(null)}
                    name={s.custom}
                    visual={<span className="grid size-6 place-items-center rounded-full bg-surface text-ink-2"><IconTarget size={14} /></span>}
                  />
                </div>
                <p className="mt-3 min-h-10 text-pretty text-center text-sm text-ink-3">{preset ? d.portfolio.presets[preset][1] : s.customBody}</p>
              </div>
            )}
          </div>

          <div className="mx-auto mt-auto grid w-full max-w-[240px] gap-2 pt-8 sm:mt-2">
            {(error || act.error) && <ErrorNote>{error ?? act.error}</ErrorNote>}

            {step === 0 &&
              (session ? (
                <p className="flex items-center justify-center gap-2 rounded-full bg-ok-soft py-3.5 text-sm text-ok">
                  <IconCheckCircle size={18} bold />
                  {s.signedInAs} <span className="num font-medium">{short(session.address)}</span>
                </p>
              ) : (
                // One entry point: Privy's own modal offers email and wallet.
                <BigButton onClick={() => signIn()} disabled={!canSignIn}>{s.login}</BigButton>
              ))}

            {step === 1 && <BigButton onClick={() => go(2)} trailing={<IconArrowRight size={20} />}>{d.common.continue}</BigButton>}

            {step === 2 && (
              <>
                <BigButton onClick={() => finish(true)} busy={act.pending}>{preset ? s.finish : d.common.continue}</BigButton>
                <Button variant="ghost" size="lg" block onClick={() => finish(false)}>{s.later}</Button>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/** A made-up but steady price line for the hero card: rising overall, with a few swings so it reads as a market. */
const CHART = [38, 44, 41, 58, 63, 52, 47, 49, 61, 55, 72, 69, 66, 74, 88, 84, 79, 91, 86, 95, 82, 77, 85, 98];

function chartPath(values: number[], w: number, h: number) {
  const max = Math.max(...values);
  const min = Math.min(...values) - 20;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - ((v - min) / (max - min)) * h * 0.85] as const);
  // Catmull-Rom → cubic Bézier, so the line is smooth without a charting library.
  let d = `M${pts[0]![0]},${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return { line: d, area: `${d} L${w},${h} L0,${h} Z` };
}

const CHART_PATH = chartPath(CHART, 600, 300);

/**
 * Shared hero card: a tray with a market line drawn across it and frosted cards floating on top. The height is fixed
 * per breakpoint so the page doesn't jump between steps; `dim` fades the line when the cards carry the story.
 */
function HeroFrame({ children, dim = false }: { children: ReactNode; dim?: boolean }) {
  return (
    <div className="relative h-[280px] shrink-0 overflow-hidden rounded-[32px] border border-line bg-surface-2 sm:h-[340px]" aria-hidden="true">
      <svg viewBox="0 0 600 300" preserveAspectRatio="none" className={cx("absolute inset-x-0 bottom-0 h-[80%] w-full text-ok transition-opacity duration-500", dim && "opacity-30")}>
        <defs>
          <linearGradient id="ob-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={CHART_PATH.area} fill="url(#ob-area)" className="ob-fade" />
        <path d={CHART_PATH.line} pathLength={1} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="ob-draw" />
      </svg>
      {children}
    </div>
  );
}

/** A frosted card floating over the chart; `i` staggers its entrance. */
function GlassCard({ className, i = 0, children }: { className?: string; i?: number; children: ReactNode }) {
  return (
    // Tailwind's translate-* utilities set `translate`, not `transform`, so the pop's scale doesn't undo the centring.
    <div className={cx("ob-pop glass-panel-strong absolute rounded-[20px] px-4 py-3", className)} style={{ "--i": i } as React.CSSProperties}>
      {children}
    </div>
  );
}

/** "↗ $312.48 (3.94%) 24h" — the green gain line under a value. */
function Change({ value, pct, locale }: { value: number; pct: number; locale: Locale }) {
  return (
    <span className="mt-0.5 flex items-center justify-center gap-1.5 text-xs tabular-nums sm:text-[13px]">
      <span className="text-ok">↗ {usd(value, locale)} ({percent(pct, locale, 2)})</span>
      <span className="text-ink-3">24h</span>
    </span>
  );
}

function AssetRows({ rows }: { rows: Array<{ symbol: string; name: string; value: string }> }) {
  return (
    <ul className="grid gap-2.5">
      {rows.map((r) => (
        <li key={r.symbol} className="flex items-center gap-2.5">
          <AssetIcon symbol={r.symbol} size={26} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-semibold">{r.symbol}</span>
            <span className="block max-w-[92px] truncate text-[11px] text-ink-3">{r.name}</span>
          </span>
          <span className="pl-3 text-[13px] font-medium tabular-nums">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

const assetOf = (sym: string) => DEMO_ASSETS.find((a) => a.symbol === sym);

/** Step 1 hero: a preview of Sama once you're in — a portfolio value, a few holdings and one mover (sample figures). */
function WelcomeHero({ locale }: { locale: Locale }) {
  const total = Object.entries(DEMO_HOLDINGS).reduce((sum, [sym, qty]) => sum + qty * (assetOf(sym)?.priceUsd ?? 0), 0);
  const rows = WELCOME_ASSETS.flatMap((sym) => {
    const a = assetOf(sym);
    return a ? [{ symbol: sym, name: a.name, value: usd(a.priceUsd, locale) }] : [];
  });
  const mover = assetOf(WELCOME_MOVER);
  return (
    <HeroFrame>
      <GlassCard className="left-1/2 top-5 -translate-x-1/2 whitespace-nowrap text-center sm:top-6" i={0}>
        <span className="block text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">{usd(total, locale)}</span>
        <Change value={total * 0.0394} pct={0.0394} locale={locale} />
      </GlassCard>
      <GlassCard className="bottom-4 left-4 sm:bottom-6 sm:left-6" i={1}>
        <AssetRows rows={rows} />
      </GlassCard>
      {mover && (
        <GlassCard className="bottom-6 right-6 hidden whitespace-nowrap text-center sm:block" i={2}>
          <span className="flex items-center justify-center gap-2 text-[13px] font-medium">
            <AssetIcon symbol={mover.symbol} size={22} />
            {mover.symbol}
          </span>
          <span className="mt-1.5 block text-xl font-semibold tabular-nums">{usd(mover.priceUsd, locale)}</span>
          <Change value={mover.priceUsd * 0.0212} pct={0.0212} locale={locale} />
        </GlassCard>
      )}
    </HeroFrame>
  );
}

/** Step 2 hero: the same card, now with the user's own wallet value, top holdings and a short summary. */
function PortfolioHero({ portfolio, positions, locale, labels }: { portfolio: Portfolio | null; positions: Row[]; locale: Locale; labels: { walletValue: string; assets: string; largest: string } }) {
  const rows = positions.slice(0, 3).map((p) => ({ symbol: p.symbol, name: assetOf(p.symbol)?.name ?? p.symbol, value: percent(p.pct, locale, 0) }));
  return (
    <HeroFrame>
      <GlassCard className="left-1/2 top-5 min-w-40 -translate-x-1/2 whitespace-nowrap text-center sm:top-6" i={0}>
        {portfolio ? (
          <>
            <span className="block text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">{portfolio.ok ? usd(portfolio.totalUsd, locale) : "—"}</span>
            <span className="text-xs text-ink-3">{labels.walletValue}</span>
          </>
        ) : (
          <Skeleton className="mx-auto h-11 w-32" />
        )}
      </GlassCard>
      {rows.length > 0 && (
        <GlassCard className="bottom-4 left-4 sm:bottom-6 sm:left-6" i={1}>
          <AssetRows rows={rows} />
        </GlassCard>
      )}
      {positions[0] && (
        <GlassCard className="bottom-6 right-6 hidden whitespace-nowrap text-center sm:block" i={2}>
          <span className="block text-[13px] text-ink-3">{labels.assets}</span>
          <span className="mt-1.5 flex items-center justify-center gap-2">
            {/* Overlapping logos of the holdings, like an avatar stack; the count follows. */}
            <span className="flex -space-x-2">
              {positions.slice(0, 4).map((p) => (
                <span key={p.symbol} className="rounded-full bg-surface p-0.5">
                  <AssetIcon symbol={p.symbol} size={22} />
                </span>
              ))}
            </span>
            <span className="text-xl font-semibold tabular-nums">{positions.length}</span>
          </span>
          <span className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-ink-3">
            {labels.largest}
            <AssetIcon symbol={positions[0].symbol} size={16} />
            <span className="font-medium text-ink">{positions[0].symbol}</span>
          </span>
        </GlassCard>
      )}
    </HeroFrame>
  );
}

/** A preset's holdings, largest first. */
const partsOf = (preset: PresetKey) =>
  Object.entries(PRESETS[preset])
    .filter(([, w]) => w > 0)
    .map(([symbol, w]) => ({ symbol, w }))
    .sort((a, b) => b.w - a.w);

/** Overlapping asset logos, like an avatar stack. */
function LogoStack({ symbols, size = 22 }: { symbols: string[]; size?: number }) {
  return (
    <span className="flex -space-x-2">
      {symbols.map((sym) => (
        <span key={sym} className="rounded-full bg-surface p-0.5">
          <AssetIcon symbol={sym} size={size} />
        </span>
      ))}
    </span>
  );
}

/**
 * The mix as a card in the hero's own idiom: the largest holding up top (logo, symbol, weight), then one segmented
 * bar for the whole mix — a pill per asset, sized by weight, with small gaps between them.
 */
function MixCard({ parts, order, locale, label, largestLabel }: { parts: Array<{ symbol: string; w: number }>; order: string[]; locale: Locale; label: string; largestLabel: string }) {
  const top = parts[0];
  if (!top) return null;
  return (
    <div className="w-[176px]">
      <span className="flex items-center justify-center gap-2 text-[13px] font-medium">
        <AssetIcon symbol={top.symbol} size={22} />
        {top.symbol}
      </span>
      <span className="mt-1.5 block text-center text-xl font-semibold tabular-nums">{percent(top.w, locale, 0)}</span>
      <span className="block text-center text-[11px] text-ink-3">{largestLabel}</span>
      <span className="mt-3 flex h-2 gap-[3px]" role="img" aria-label={label}>
        {parts.map((p) => (
          <span key={p.symbol} className="ob-fade h-full min-w-1 rounded-full" style={{ flexGrow: p.w, flexBasis: 0, background: colorFor(p.symbol, order) }} />
        ))}
      </span>
    </div>
  );
}

/**
 * Step 3 hero: the same card as step 1, now describing the chosen mix — its name and logos on top, the biggest
 * weights on the left, the largest holding and a bar of the whole mix on the right. Re-keyed per preset so the cards
 * pop again on every change.
 */
function TargetHero({ preset, order, locale, label, assetsLabel, largestLabel, customLabel, customBody }: { preset: PresetKey | null; order: string[]; locale: Locale; label: string; assetsLabel: string; largestLabel: string; customLabel: string; customBody: string }) {
  if (!preset) {
    return (
      <HeroFrame dim>
        <GlassCard className="left-1/2 top-1/2 w-[260px] -translate-x-1/2 -translate-y-1/2 px-5 py-5 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-surface text-accent">
            <IconTarget size={22} />
          </span>
          <span className="mt-2.5 block text-[15px] font-semibold">{customLabel}</span>
          <span className="mt-1 block text-pretty text-xs leading-relaxed text-ink-3">{customBody}</span>
        </GlassCard>
      </HeroFrame>
    );
  }
  const parts = partsOf(preset);
  const rows = parts.slice(0, 3).map((p) => ({ symbol: p.symbol, name: assetOf(p.symbol)?.name ?? p.symbol, value: percent(p.w, locale, 0) }));
  return (
    <HeroFrame key={preset}>
      <GlassCard className="left-1/2 top-5 -translate-x-1/2 whitespace-nowrap text-center sm:top-6" i={0}>
        <span className="block text-xl font-semibold tracking-tight sm:text-2xl">{label}</span>
        <span className="mt-1.5 flex items-center justify-center gap-2 text-xs tabular-nums text-ink-3">
          <LogoStack symbols={parts.slice(0, 4).map((p) => p.symbol)} size={18} />
          {parts.length} {assetsLabel.toLowerCase()}
        </span>
      </GlassCard>
      <GlassCard className="bottom-4 left-4 sm:bottom-6 sm:left-6" i={1}>
        <AssetRows rows={rows} />
      </GlassCard>
      <GlassCard className="bottom-6 right-6 hidden sm:block" i={2}>
        <MixCard parts={parts} order={order} locale={locale} label={label} largestLabel={largestLabel} />
      </GlassCard>
    </HeroFrame>
  );
}

/**
 * One choice: a native radio (arrow keys move within the group) styled as a card with the mix's logos. The chosen one
 * gets an accent ring and a check instead of flipping to a solid fill, so it matches the glass cards above.
 */
function PresetTile({ checked, onSelect, name, note, visual }: { checked: boolean; onSelect: () => void; name: string; note?: string; visual: ReactNode }) {
  return (
    <label
      className={cx(
        "relative flex min-h-[96px] cursor-pointer flex-col items-start justify-between gap-2 rounded-2xl border bg-surface-2 p-3 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 active:scale-[0.97]",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]",
        checked ? "border-accent shadow-[0_0_0_1px_var(--accent)]" : "border-line hover:bg-surface-3",
      )}
    >
      <input type="radio" name="preset" checked={checked} onChange={onSelect} className="sr-only" />
      {visual}
      <span className={cx("absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full border transition-colors", checked ? "border-accent bg-accent text-on-accent" : "border-line-strong")}>
        {checked && <IconCheck size={12} bold />}
      </span>
      <span className="leading-tight">
        <span className="block text-[14px] font-semibold">{name}</span>
        {note && <span className="block text-[11px] font-medium text-accent">{note}</span>}
      </span>
    </label>
  );
}

function BigButton({ variant = "primary", ...rest }: React.ComponentProps<typeof Button>) {
  return <Button size="lg" block variant={variant} className="h-11 text-[15px]" {...rest} />;
}
