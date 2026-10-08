"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";
import { AssetIcon } from "@/components/asset-icon";
import { Mark } from "@/components/brand";
import { Panel, Scene, useInView } from "@/components/landing/scene";
import { TONES as T } from "@/components/landing/scene-tones";

const TONES = [T.navy, T.forest, T.amber, T.plum, T.slate];

/**
 * Problem carousel: large heading + lead, then a row of cinematic cards. Each card is a dark ambient scene (drifting
 * light blobs, grain, vignette) with a clean glass UI overlay that animates the problem it describes. Animations only
 * run while the section is on screen; with reduced motion every scene rests on its final, readable state.
 * Styles live in globals.css under "Problem carousel".
 */


/* ---------- 1. Two wallets, opposite trades ---------- */
function TradeRow({ wallet, action, fee, delay }: { wallet: string; action: string; fee: string; delay: string }) {
  return (
    <Panel className="flex items-center gap-3 px-3.5 py-3">
      <AssetIcon symbol="NVDAB" size={32} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-white/60">{wallet}</p>
        <p className="text-sm font-medium">{action}</p>
      </div>
      <span className="ps-fee num rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold" style={{ animationDelay: delay }}>{fee}</span>
    </Panel>
  );
}

function OppositeScene() {
  return (
    <div className="ps-float w-full max-w-[300px]">
      <TradeRow wallet="Maya" action="Sell 4.0 NVDAB" fee="−$3.10" delay="0s" />
      <div className="relative h-24">
        <svg className="absolute inset-0 size-full" viewBox="0 0 100 96" preserveAspectRatio="none" aria-hidden="true">
          <path className="ps-flow" d="M50 0 V34" />
          <path className="ps-flow" d="M50 96 V62" />
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="glass glass-frost flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-xs font-medium">
            <Icon icon="cryptocurrency-color:cake" width={20} height={20} aria-hidden="true" />
            Public pool
          </div>
        </div>
      </div>
      <TradeRow wallet="Alex" action="Buy 3.8 NVDAB" fee="−$2.96" delay="1.4s" />
    </div>
  );
}

/* ---------- 2. Three-way swaps nobody spots ---------- */
const RING = ["AAPLB", "TSLAB", "NVDAB"];
const R = 44;
const at = (deg: number) => [50 + R * Math.cos((deg * Math.PI) / 180), 50 + R * Math.sin((deg * Math.PI) / 180)] as const;
const arc = (from: number, to: number) => {
  const [x1, y1] = at(from);
  const [x2, y2] = at(to);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};

function RingScene() {
  const angles = [-90, 30, 150];
  return (
    <div className="relative aspect-square w-[68%]">
      <div className="ps-orbit absolute inset-0">
        <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(255 255 255 / 0.45)" strokeWidth="0.5" strokeDasharray="1.2 2.2" />
          {angles.map((a, i) => (
            <path key={a} className="ps-draw" d={arc(a + 20, a + 100)} pathLength={1} style={{ animationDelay: `${i * 1.3}s` }} />
          ))}
        </svg>
        {RING.map((symbol, i) => {
          const [x, y] = at(angles[i]!);
          return (
            <div key={symbol} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
              <div className="ps-counter grid size-14 place-items-center rounded-full bg-black/55 shadow-[0_8px_24px_rgb(0_0_0/0.35)] ring-1 ring-white/20 backdrop-blur-md">
                <AssetIcon symbol={symbol} size={30} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Panel className="whitespace-nowrap px-4 py-2.5 text-center">
          <p className="text-sm font-medium">No pair matches</p>
          <p className="num mt-0.5 text-[11px] text-white/60">3 swaps · 3 fees</p>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- 3. Thin pools, big impact ---------- */
const DEPTH = [0.95, 0.8, 0.68, 0.55, 0.44, 0.34, 0.24, 0.16, 0.16, 0.24, 0.34, 0.44, 0.55, 0.68, 0.8, 0.95];

function PoolScene() {
  return (
    <Panel className="ps-float w-full max-w-[310px] p-4">
      <div className="flex items-center gap-2.5">
        <AssetIcon symbol="NOKB" size={28} />
        <div className="flex-1">
          <p className="text-sm font-medium">NOKB / USDT</p>
          <p className="text-[11px] text-white/60">A thin pool</p>
        </div>
      </div>
      <div className="relative mt-4 flex h-20 items-end gap-[3px]">
        {DEPTH.map((h, i) => (
          <span
            key={i}
            className="ps-bar flex-1 rounded-t-[3px] bg-white/35"
            style={{ height: `${h * 100}%`, animationDelay: `${Math.abs(i - 7.5) * 0.08}s`, "--d": i > 7 ? 0.35 : 0.9 } as CSSProperties}
          />
        ))}
        <span className="ps-sweep absolute bottom-0 top-0 w-0.5 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-sm">
        <span className="text-white/60">Cost of a $10K swap</span>
        <span className="ps-impact num font-semibold text-accent">−7.7%</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-white/60">
        <span>In NVDAB's deep pool</span>
        <span className="num">−0.26%</span>
      </div>
    </Panel>
  );
}

/* ---------- 4. Gas before you start ---------- */
function GasScene() {
  const rows: Array<[string, string, boolean]> = [["NVDAB", "12.40", false], ["AAPLB", "8.00", false], ["BNB", "0.0000", true]];
  return (
    <div className="ps-float relative w-full max-w-[300px]">
      <Panel className="p-4">
        <p className="text-[11px] text-white/60">Your wallet</p>
        <ul className="mt-2 grid gap-2.5">
          {rows.map(([symbol, amount, empty]) => (
            <li key={symbol} className="flex items-center gap-2.5 text-sm">
              <AssetIcon symbol={symbol} size={24} />
              <span className="flex-1">{symbol}</span>
              <span className={`num ${empty ? "text-accent" : ""}`}>{amount}</span>
            </li>
          ))}
        </ul>
        <div className="ps-approve mt-4 grid h-10 place-items-center rounded-full text-sm font-medium">Approve</div>
      </Panel>
      <div className="absolute inset-x-0 -bottom-14 flex justify-center">
        <div className="ps-toast">
          <div className="glass glass-frost flex items-center gap-2 rounded-full py-2 pl-2.5 pr-3.5 text-xs font-medium">
            <Mark size={14} white />
            Gas sponsored by Sama
            <Icon icon="ph:check-circle-fill" width={16} height={16} className="text-[#7ee2a8]" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 5. Signing blind ---------- */
function SignScene() {
  const readable: Array<[string, string, string]> = [["Out", "2.00 AAPLB", "AAPLB"], ["In", "2.55 NVDAB", "NVDAB"]];
  return (
    <Panel className="ps-float w-full max-w-[310px] p-4">
      <div className="flex items-center gap-2 text-[11px] text-white/60">
        <span className="size-1.5 rounded-full bg-accent" />
        Signature request
      </div>
      <div className="relative mt-3 h-[112px] overflow-hidden">
        <div className="ps-hex num absolute inset-0 break-all text-[11px] leading-[1.6] text-white/45 blur-[0.4px]">
          0x095ea7b3000000000000000000000000 10ed43c718714eb63d5aa57b78b54704e256024e ffffffffffffffffffffffffffffffffffffff 5f3c1a9b0e6d...
        </div>
        <div className="ps-read absolute inset-0 grid content-start gap-2.5">
          {readable.map(([label, value, symbol]) => (
            <div key={label} className="flex items-center gap-2.5 text-sm">
              <AssetIcon symbol={symbol} size={24} />
              <span className="flex-1 text-white/70">{label}</span>
              <span className="num font-medium">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Network fee</span>
            <span>Sponsored</span>
          </div>
        </div>
        <span className="ps-scan absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-white/25 to-transparent" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-medium">
        <span className="grid h-9 place-items-center rounded-full bg-white/12">Reject</span>
        <span className="grid h-9 place-items-center rounded-full bg-accent">Sign</span>
      </div>
    </Panel>
  );
}

const SCENES = [OppositeScene, RingScene, PoolScene, GasScene, SignScene];

export function ProblemCarousel({ title, lead, items }: { title: string; lead: string; items: ReadonlyArray<readonly string[]> }) {
  const [section, inView] = useInView<HTMLElement>();
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const onScroll = () => {
    const t = track.current;
    if (!t) return;
    setEdge({ start: t.scrollLeft < 8, end: t.scrollLeft + t.clientWidth > t.scrollWidth - 8 });
  };
  useEffect(onScroll, []);

  const step = (dir: 1 | -1) => {
    const t = track.current;
    const card = t?.querySelector("li");
    if (t && card) t.scrollBy({ left: dir * (card.getBoundingClientRect().width + 20), behavior: "smooth" });
  };

  return (
    <section ref={section} className="ps pb-16 pt-4 sm:pb-24" data-inview={inView || undefined}>
      <div className="mx-auto grid max-w-[1400px] gap-5 px-4 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16 lg:px-16">
        <h2 className="ps-card max-w-3xl text-balance text-4xl font-normal leading-[1.04] tracking-[-0.035em] sm:text-5xl lg:text-[56px]" style={{ "--i": 0 } as CSSProperties}>{title}</h2>
        <p className="ps-card max-w-sm text-pretty text-base leading-relaxed text-ink-2 sm:text-lg" style={{ "--i": 1 } as CSSProperties}>{lead}</p>
      </div>

      <ul
        ref={track}
        onScroll={onScroll}
        className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mt-12 sm:px-8 lg:px-[max(4rem,calc((100vw-1400px)/2+4rem))] [&::-webkit-scrollbar]:hidden"
      >
        {items.map(([heading = "", body = ""], i) => {
          const Visual = SCENES[i % SCENES.length]!;
          return (
            <li key={heading} className="ps-card w-[78vw] max-w-[380px] shrink-0 snap-start sm:w-[40vw] lg:w-[23vw]" style={{ "--i": i + 2 } as CSSProperties}>
              <Scene tone={TONES[i % TONES.length]!} className="aspect-[20/19]"><div className="grid size-full place-items-center p-[8%]"><Visual /></div></Scene>
              <h3 className="mt-4 text-xl font-normal tracking-[-0.02em] sm:text-[22px]">{heading}</h3>
              <p className="mt-1.5 text-pretty text-[15px] leading-relaxed text-ink-2">{body}</p>
            </li>
          );
        })}
      </ul>

      <div className="mx-auto mt-6 flex max-w-[1400px] justify-end gap-2 px-4 sm:px-8 lg:px-16">
        {([[-1, "ph:arrow-left", "Previous", edge.start], [1, "ph:arrow-right", "Next", edge.end]] as const).map(([dir, icon, label, disabled]) => (
          <button
            key={label}
            type="button"
            onClick={() => step(dir)}
            disabled={disabled}
            aria-label={label}
            className="grid size-12 place-items-center rounded-full border border-ink/15 text-ink transition hover:bg-ink hover:text-bg disabled:pointer-events-none disabled:opacity-30"
          >
            <Icon icon={icon} width={20} height={20} />
          </button>
        ))}
      </div>
    </section>
  );
}
