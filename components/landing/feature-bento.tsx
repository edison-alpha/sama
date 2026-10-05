"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "@iconify/react";
import { ThinkingOrb, type OrbState } from "thinking-orbs";
import { AssetIcon } from "@/components/asset-icon";
import { Panel, Scene, useInView } from "@/components/landing/scene";
import { TONES, type Tone } from "@/components/landing/scene-tones";

/**
 * Feature bento: heading + lead, then a tall card, a wide card and two small ones. Each card is a cinematic scene
 * with a glass UI overlay showing the feature at work, and its copy set over the bottom of the image.
 * Styles live in globals.css under "Problem carousel" and "Feature bento".
 */

type Copy = readonly string[];

/** Types out each phrase, holds it, erases it, moves on. Rests on the first phrase with reduced motion. */
function useTypewriter(phrases: string[], running: boolean) {
  const [state, setState] = useState({ text: phrases[0]!, index: 0 });
  useEffect(() => {
    if (!running || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let n = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const phrase = phrases[i]!;
      if (!deleting && n < phrase.length) n++;
      else if (!deleting) deleting = true;
      else if (n > 0) n -= 2;
      else {
        deleting = false;
        i = (i + 1) % phrases.length;
      }
      n = Math.max(0, n);
      setState({ text: phrases[i]!.slice(0, n), index: i });
      const pause = !deleting && n === phrases[i]!.length ? 1800 : deleting ? 22 : 48;
      timer = setTimeout(tick, pause);
    };
    n = 0;
    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [phrases, running]);
  return state;
}

function Card({ i, tone, className, copy, narrow = false, children }: { i: number; tone: Tone; className: string; copy: Copy; narrow?: boolean; children: ReactNode }) {
  return (
    <article className={`ps-card ${className}`} style={{ "--i": i } as CSSProperties}>
      <Scene tone={tone} className="size-full">
        {children}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent p-6 pt-20 sm:p-8 sm:pt-20">
          <h3 className={`${narrow ? "max-w-sm" : "max-w-md"} text-balance text-2xl font-normal leading-tight tracking-[-0.02em] sm:text-[26px]`}>{copy[0]}</h3>
          <p className={`mt-2 ${narrow ? "max-w-sm" : "max-w-md"} text-pretty text-[15px] leading-relaxed text-white/75`}>{copy[1]}</p>
        </div>
      </Scene>
    </article>
  );
}

/* ---------- Tall: the solver finds rings ---------- */
const STOCKS = ["AAPLB", "NVDAB", "TSLAB", "MSFTB"];
const R = 42;
const at = (deg: number) => [50 + R * Math.cos((deg * Math.PI) / 180), 50 + R * Math.sin((deg * Math.PI) / 180)] as const;
const arc = (from: number, to: number) => {
  const [x1, y1] = at(from);
  const [x2, y2] = at(to);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};
const PROMPTS = ["Netting 24 stock rebalances…", "AAPLB → NVDAB → TSLAB → AAPLB", "Found a 3-wallet ring", "Only 6% left for the market"];
/** Orb animation per prompt: scanning the round, wiring the ring, solving it, then the settled result. */
const ORB_STATES: OrbState[] = ["searching", "connecting", "solving", "working"];

function SolverVisual({ running }: { running: boolean }) {
  const { text, index } = useTypewriter(PROMPTS, running);
  const angles = [-90, 0, 90, 180];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 pb-44 pt-6 sm:px-8 sm:pb-48">
      <div className="relative aspect-square w-[56%] max-w-[270px] sm:w-[64%]">
        <div className="ps-orbit absolute inset-0">
          <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(255 255 255 / 0.4)" strokeWidth="0.5" strokeDasharray="1.2 2.2" />
            {angles.map((a, i) => (
              <path key={a} className="ps-draw" d={arc(a + 16, a + 74)} pathLength={1} style={{ animationDelay: `${i * 0.9}s` }} />
            ))}
          </svg>
          {STOCKS.map((symbol, i) => {
            const [x, y] = at(angles[i]!);
            return (
              <div key={symbol} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
                <div className="ps-counter grid size-14 place-items-center rounded-full bg-black/50 shadow-[0_8px_24px_rgb(0_0_0/0.35)] ring-1 ring-white/20 backdrop-blur-md">
                  <AssetIcon symbol={symbol} size={30} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute inset-0 grid place-items-center">
          <span className="num text-3xl font-light tracking-tight">94%</span>
        </div>
      </div>
      <Panel className="flex w-full max-w-[380px] items-center gap-3 rounded-full py-2 pl-2 pr-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-black/80">
          <ThinkingOrb state={ORB_STATES[index]} size={32} theme="dark" paused={!running} aria-label="Matching" />
        </span>
        <span className="min-w-0 truncate text-[15px]" aria-live="off">
          {text}
          <span className="ps-caret ml-px inline-block h-[1.1em] w-px translate-y-[3px] bg-white" />
        </span>
      </Panel>
    </div>
  );
}

/* ---------- Wide: one transaction, all or nothing ---------- */
const LEGS: Array<[string, string, string]> = [
  ["AAPLB", "2.00", "0x7a…41c → 0x19…be2"],
  ["NVDAB", "2.55", "0x19…be2 → 0xc4…07f"],
  ["TSLAB", "1.10", "0xc4…07f → 0x7a…41c"],
  ["MSFTB", "0.80", "0x3e…9d1 → 0x19…be2"],
];

function SettlementVisual() {
  return (
    <div className="flex h-full justify-center px-6 pt-6 sm:justify-end sm:p-8">
      <Panel className="ps-float h-fit w-full max-w-[340px] p-3.5">
        <div className="flex items-center justify-between text-[11px] text-white/60">
          <span>Settlement · 1 transaction</span>
          <span className="num">4 legs</span>
        </div>
        <ul className="mt-2.5 grid gap-2">
          {LEGS.map(([symbol, amount, route], i) => (
            <li key={symbol} className="ps-leg flex items-center gap-2.5 text-sm" style={{ "--i": i } as CSSProperties}>
              <AssetIcon symbol={symbol} size={22} />
              <p className="num w-24 shrink-0">{amount} {symbol}</p>
              <p className="num min-w-0 flex-1 truncate text-[11px] text-white/55">{route}</p>
              <Icon icon="ph:check-circle-fill" width={16} height={16} className="ps-check text-[#7ee2a8]" aria-hidden="true" />
            </li>
          ))}
        </ul>
        <div className="ps-settled mt-3 flex items-center justify-between rounded-full bg-white/12 py-1.5 pl-2 pr-3 text-xs">
          <span className="flex items-center gap-1.5">
            <Icon icon="cryptocurrency-color:bnb" width={18} height={18} aria-hidden="true" />
            Settled on BNB Chain
          </span>
          <span className="num text-white/60">#48,213,907</span>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Small: exact approvals ---------- */
function ApprovalVisual() {
  return (
    <div className="flex justify-center px-6 pt-6 sm:px-8 sm:pt-8">
      <Panel className="ps-float w-full max-w-[300px] p-4">
        <p className="text-[11px] text-white/60">Token allowance</p>
        <div className="mt-3 flex items-center gap-2.5">
          <AssetIcon symbol="AAPLB" size={30} />
          <div className="flex-1">
            <p className="relative w-fit text-xs text-white/50">
              Unlimited
              <span className="ps-strike absolute inset-x-0 top-1/2 h-px bg-accent" />
            </p>
            <p className="ps-exact num text-lg font-medium">Exactly 2.00 AAPLB</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Small: checked twice ---------- */
function VerifyVisual() {
  const checks = ["Read back from BNB Chain", "Amounts match the plan", "Receipt published"];
  return (
    <div className="flex justify-center px-6 pt-6 sm:px-8 sm:pt-8">
      <Panel className="ps-float w-full max-w-[300px] p-4">
        <div className="flex items-center gap-2.5">
          <span className="relative grid size-8 place-items-center rounded-full bg-[#7ee2a8]/20 text-[#7ee2a8]">
            <span className="ps-ping absolute inset-0 rounded-full ring-1 ring-[#7ee2a8]" />
            <Icon icon="ph:shield-check-fill" width={18} height={18} aria-hidden="true" />
          </span>
          <p className="text-sm font-medium">Independent verifier</p>
        </div>
        <ul className="mt-2.5 grid gap-1.5">
          {checks.map((c, i) => (
            <li key={c} className="ps-leg flex items-center gap-2 text-[13px]" style={{ "--i": i } as CSSProperties}>
              <Icon icon="ph:check-bold" width={14} height={14} className="ps-check text-[#7ee2a8]" aria-hidden="true" />
              {c}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export function FeatureBento({ title, lead, ring, atomic, exact, verify }: { title: string; lead: string; ring: Copy; atomic: Copy; exact: Copy; verify: Copy }) {
  const [section, inView] = useInView<HTMLElement>();
  return (
    <section ref={section} className="ps mx-auto max-w-[1400px] px-4 py-20 sm:px-8 sm:py-28 lg:px-16" data-inview={inView || undefined}>
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
        <h2 className="ps-card max-w-3xl whitespace-pre-line text-balance text-4xl font-normal leading-[1.04] tracking-[-0.035em] sm:text-5xl lg:text-[64px]" style={{ "--i": 0 } as CSSProperties}>{title}</h2>
        <p className="ps-card max-w-sm text-pretty text-base leading-relaxed text-ink-2 sm:text-lg" style={{ "--i": 1 } as CSSProperties}>{lead}</p>
      </div>

      <div className="mt-10 grid gap-3 sm:mt-12 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[340px_340px]">
        <Card i={2} tone={TONES.ocean} copy={ring} className="h-[520px] md:col-span-2 lg:col-span-1 lg:row-span-2 lg:h-auto">
          <SolverVisual running={inView} />
        </Card>
        <Card i={3} narrow tone={TONES.navy} copy={atomic} className="h-[460px] md:col-span-2 lg:h-auto">
          <SettlementVisual />
        </Card>
        <Card i={4} tone={TONES.amber} copy={exact} className="h-[360px] lg:h-auto">
          <ApprovalVisual />
        </Card>
        <Card i={5} tone={TONES.forest} copy={verify} className="h-[360px] lg:h-auto">
          <VerifyVisual />
        </Card>
      </div>
    </section>
  );
}
