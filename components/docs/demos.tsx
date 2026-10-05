"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Icon } from "@iconify/react";
import { useEffect, useState, type ReactNode } from "react";
import { AssetIcon, AssetStack } from "@/components/asset-icon";
import { DocIcon, type DocIconName } from "@/components/docs/icon";
import { Panel } from "@/components/landing/scene";
import { UserAvatar } from "@/components/wallet/user-avatar";
import type { DemoKey } from "@/lib/docs/types";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

/*
 * Live demos for docs Preview cards. They sit on a dark cinematic scene, so they use the landing's glass panels and
 * white text in both themes. People are shown with the same generated avatars as the app.
 */

const GREEN = "#7ee2a8";

/** Picks the line for the current language; demos keep both side by side like the docs content. */
function useT() {
  const { locale } = useI18n();
  return (en: string, id: string) => (locale === "id" ? id : en);
}

export function Demo({ demo }: { demo: DemoKey }) {
  switch (demo) {
    case "pair":
      return <PairDemo />;
    case "ring":
      return <RingDemo />;
    case "round":
      return <RoundDemo />;
    case "target":
      return <TargetDemo />;
    case "approval":
      return <ApprovalDemo />;
    case "checks":
      return <ChecksDemo />;
    case "leftover":
      return <LeftoverDemo />;
    case "tiers":
      return <TiersDemo />;
  }
}

function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "ok" | "accent" | "warn" }) {
  const tones = { plain: "bg-white/12 text-white/80", ok: "bg-[#7ee2a8]/18 text-[#7ee2a8]", accent: "bg-accent text-white", warn: "bg-[#ffc178]/18 text-[#ffc178]" };
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", tones[tone])}>{children}</span>;
}

/** Same seed per name, so Maya and Alex look the same in every demo. */
const seed = (name: string) => `sama-docs-${name.toLowerCase()}`;

/* ---------- Pair ---------- */

function PersonRow({ name, line, symbol, side }: { name: string; line: string; symbol: string; side: "out" | "in" }) {
  return (
    <Panel className="flex w-full max-w-[340px] items-center gap-3 px-3.5 py-3">
      <UserAvatar name={seed(name)} size={38} />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] text-white/60">{name}</span>
        <span className="block truncate text-sm font-medium">{line}</span>
      </span>
      <AssetIcon symbol={symbol} size={26} />
      <Chip tone={side === "out" ? "accent" : "ok"}>{side === "out" ? "−3.8" : "+3.8"}</Chip>
    </Panel>
  );
}

function PairDemo() {
  const tr = useT();
  const reduce = useReducedMotion();
  return (
    <div className="flex w-full flex-col items-center">
      <PersonRow name="Maya" line={tr("Sell 4.0 NVDAB", "Jual 4,0 NVDAB")} symbol="NVDAB" side="out" />
      <div className="flex h-16 items-center gap-2.5">
        <span className="h-full w-px bg-gradient-to-b from-white/0 via-white/40 to-white/0" />
        <m.span
          animate={reduce ? undefined : { y: [0, 3, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="glass glass-frost flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
        >
          <DocIcon name="updown" size={13} className="text-[#7ee2a8]" />
          {tr("Wallet to wallet · no pool", "Wallet ke wallet · tanpa pool")}
        </m.span>
      </div>
      <PersonRow name="Alex" line={tr("Buy 3.8 NVDAB", "Beli 3,8 NVDAB")} symbol="NVDAB" side="in" />
      <p className="mt-4 text-center text-xs text-white/60">{tr("0.2 NVDAB stays with Maya as a leftover", "0,2 NVDAB tetap pada Maya sebagai sisa")}</p>
    </div>
  );
}

/* ---------- Ring ---------- */

const RING = [
  { name: "Maya", give: "AAPLB", want: "TSLAB", x: 50, y: 14 },
  { name: "Alex", give: "TSLAB", want: "NVDAB", x: 86, y: 76 },
  { name: "You", give: "NVDAB", want: "AAPLB", x: 14, y: 76 },
] as const;

function RingDemo() {
  const tr = useT();
  const reduce = useReducedMotion();
  const [whole, setWhole] = useState(true);
  const label = (n: string) => (n === "You" ? tr("You", "Kamu") : n);
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="glass glass-frost inline-flex rounded-full p-1 text-xs font-semibold" role="radiogroup" aria-label="Matcher">
        {([
          [false, tr("Pairs only", "Hanya pasangan")],
          [true, tr("Whole round", "Seluruh round")],
        ] as const).map(([v, text]) => (
          <button key={String(v)} type="button" role="radio" aria-checked={whole === v} onClick={() => setWhole(v)} className={cx("rounded-full px-3.5 py-1.5 transition-colors", whole === v ? "bg-white text-black" : "text-white/70 hover:text-white")}>
            {text}
          </button>
        ))}
      </div>

      <div className="relative aspect-[1.15] w-full max-w-[400px]">
        <svg viewBox="0 0 100 87" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
          {RING.map((a, i) => {
            const b = RING[(i + 1) % RING.length]!;
            return (
              <m.line
                key={a.name}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={whole ? GREEN : "rgb(255 255 255 / 0.25)"}
                strokeWidth={0.7}
                strokeLinecap="round"
                strokeDasharray="1.6 2.2"
                animate={reduce || !whole ? { strokeDashoffset: 0 } : { strokeDashoffset: [0, -7.6] }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            );
          })}
        </svg>

        {RING.map((a) => (
          <div key={a.name} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${a.x}%`, top: `${(a.y / 87) * 100}%` }}>
            <div className="flex flex-col items-center gap-2">
              <span className="rounded-full p-1 ring-1 ring-white/25 backdrop-blur-md">
                <UserAvatar name={seed(a.name)} size={44} />
              </span>
              <Panel className="flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-2 text-xs font-medium">
                {label(a.name)}
                <span className="flex items-center gap-0.5 text-white/60">
                  <AssetIcon symbol={a.give} size={16} />
                  <DocIcon name="caretRight" size={10} />
                  <AssetIcon symbol={a.want} size={16} />
                </span>
              </Panel>
            </div>
          </div>
        ))}

        <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2">
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={String(whole)} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.18 }}>
              <Panel className="flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium">
                <DocIcon name={whole ? "checkFill" : "lock"} size={15} className={whole ? "text-[#7ee2a8]" : "text-white/60"} />
                {whole ? tr("Loop closes · 3 transfers, 1 tx", "Putaran tertutup · 3 transfer, 1 tx") : tr("No pair fits", "Tidak ada pasangan")}
              </Panel>
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------- Round phases ---------- */

function RoundDemo() {
  const tr = useT();
  const phases: Array<{ key: string; icon: DocIconName; label: string; states: string; body: string; cta: string | null }> = [
    { key: "join", icon: "pulse", label: tr("Join", "Gabung"), states: "OPEN · COLLECTING", body: tr("Sign your rebalance for this round. Free, and nothing moves.", "Tanda tangani rebalance-mu untuk round ini. Gratis, dan tidak ada yang berpindah."), cta: tr("Sign & join", "Tanda tangan & gabung") },
    { key: "match", icon: "round", label: tr("Match", "Cocokkan"), states: "FROZEN · SOLVING", body: tr("Prices are pinned and the solver looks for changes that cancel out.", "Harga dikunci dan solver mencari perubahan yang saling meniadakan."), cta: null },
    { key: "approve", icon: "shield", label: tr("Approve", "Setujui"), states: "PROPOSED · APPROVING", body: tr("See exactly what you send and receive, then approve within 30 minutes.", "Lihat persis apa yang kamu kirim dan terima, lalu setujui dalam 30 menit."), cta: tr("Approve & allow", "Setujui & izinkan") },
    { key: "settle", icon: "swap", label: tr("Settle", "Settle"), states: "READY_TO_SETTLE · SETTLING", body: tr("One transaction moves every matched transfer, then an independent check runs.", "Satu transaksi memindahkan semua transfer yang berpasangan, lalu cek independen berjalan."), cta: tr("Submit settlement", "Kirim settlement") },
    { key: "finish", icon: "book", label: tr("Finish", "Selesai"), states: "COMPLETE", body: tr("Decide what happens to leftovers and open your verified receipt.", "Putuskan nasib sisa dan buka struk terverifikasi."), cta: tr("View receipt", "Lihat struk") },
  ];
  const [i, setI] = useState(2);
  const p = phases[i]!;
  return (
    <div className="w-full max-w-[460px]">
      <Panel className="grid grid-cols-5 gap-1 p-1.5">
        {phases.map((ph, j) => (
          <button
            key={ph.key}
            type="button"
            onClick={() => setI(j)}
            aria-current={i === j ? "step" : undefined}
            className={cx("flex flex-col items-center gap-1 rounded-[14px] py-2 text-[11px] font-medium transition-colors", i === j ? "bg-white text-black" : j < i ? "text-white" : "text-white/55 hover:text-white")}
          >
            <DocIcon name={j < i ? "checkFill" : ph.icon} size={18} className={j < i && i !== j ? "text-[#7ee2a8]" : undefined} />
            {ph.label}
          </button>
        ))}
      </Panel>
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={p.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
          <Panel className="mt-3 p-4">
            <p className="font-mono text-[11px] text-white/55">{p.states}</p>
            <p className="mt-1.5 text-[15px] leading-relaxed">{p.body}</p>
            {p.cta && <span className="mt-3.5 inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-semibold text-white">{p.cta}</span>}
          </Panel>
        </m.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------- Target ---------- */

const NOW: Record<string, number> = { NVDAB: 55, AAPLB: 15, USDT: 30 };
const PRESETS = { balanced: { NVDAB: 40, AAPLB: 30, USDT: 30 }, growth: { NVDAB: 50, AAPLB: 40, USDT: 10 }, conservative: { NVDAB: 20, AAPLB: 20, USDT: 60 } } satisfies Record<string, Record<string, number>>;
const COLORS: Record<string, string> = { NVDAB: "#7ee2a8", AAPLB: "#8fb4ff", USDT: "#ffc178" };
const WALLET_USD = 2_000;

function Mix({ weights, label }: { weights: Record<string, number>; label: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium text-white/60">{label}</p>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {Object.entries(weights).map(([s, w]) => (
          <m.span key={s} layout className="h-full rounded-full" style={{ width: `${w}%`, background: COLORS[s] }} transition={{ type: "spring", stiffness: 260, damping: 30 }} />
        ))}
      </div>
    </div>
  );
}

function TargetDemo() {
  const tr = useT();
  const [preset, setPreset] = useState<keyof typeof PRESETS>("balanced");
  const target: Record<string, number> = PRESETS[preset];
  const trades = Object.keys(NOW)
    .map((s) => ({ s, gap: (target[s] ?? 0) - NOW[s]! }))
    .filter((x) => Math.abs(x.gap) >= 1);
  const names = { balanced: tr("Balanced", "Seimbang"), growth: tr("Growth", "Tumbuh"), conservative: tr("Conservative", "Konservatif") };
  return (
    <div className="w-full max-w-[360px]">
      <div className="glass glass-frost inline-flex rounded-full p-1">
        {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((k) => (
          <button key={k} type="button" aria-pressed={preset === k} onClick={() => setPreset(k)} className={cx("h-8 rounded-full px-3 text-xs font-semibold transition-colors", preset === k ? "bg-white text-black" : "text-white/70 hover:text-white")}>
            {names[k]}
          </button>
        ))}
      </div>
      <Panel className="mt-3 grid gap-3.5 p-4">
        <Mix weights={NOW} label={tr("Now", "Sekarang")} />
        <Mix weights={target} label={tr("Target", "Target")} />
        <div className="flex gap-3 text-[11px] text-white/60">
          {Object.keys(NOW).map((s) => (
            <span key={s} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: COLORS[s] }} />{s}</span>
          ))}
        </div>
        <ul className="grid gap-2 border-t border-white/12 pt-3">
          {trades.map((x) => (
            <li key={x.s} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium"><AssetIcon symbol={x.s} size={22} />{x.s}</span>
              <Chip tone={x.gap < 0 ? "accent" : "ok"}>
                {x.gap < 0 ? tr("Sell", "Jual") : tr("Buy", "Beli")} ${Math.round((Math.abs(x.gap) / 100) * WALLET_USD).toLocaleString("en-US")}
              </Chip>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* ---------- Approval ---------- */

function ApprovalDemo() {
  const tr = useT();
  const reduce = useReducedMotion();
  const steps = [
    { label: tr("Sign the plan approval", "Tanda tangani persetujuan rencana"), tag: tr("Free", "Gratis"), tone: "ok" as const, icon: "shield" as DocIconName },
    { label: tr("Allow exactly 0.2 NVDAB", "Izinkan persis 0,2 NVDAB"), tag: "Gas", tone: "plain" as const, icon: "wallet" as DocIconName },
    { label: tr("Send the settlement", "Kirim settlement"), tag: "Gas", tone: "plain" as const, icon: "swap" as DocIconName },
  ];
  const [done, setDone] = useState(-1);
  useEffect(() => {
    if (done < 0 || done >= steps.length) return;
    const id = window.setTimeout(() => setDone((d) => d + 1), reduce ? 0 : 900);
    return () => window.clearTimeout(id);
  }, [done, reduce, steps.length]);
  return (
    <Panel className="w-full max-w-[360px] p-4">
      <div className="flex items-center gap-2.5">
        <UserAvatar name={seed("You")} size={32} />
        <p className="text-sm font-medium">{tr("Your wallet will ask you 3 times", "Wallet-mu akan meminta 3 kali")}</p>
      </div>
      <ul className="mt-3.5 grid gap-2">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-3 rounded-[14px] bg-white/[0.07] px-3 py-2.5">
            <span className={cx("grid size-7 shrink-0 place-items-center rounded-full", i < done ? "bg-[#7ee2a8]/20 text-[#7ee2a8]" : i === done ? "bg-accent/25 text-white" : "bg-white/10 text-white/60")}>
              {i < done ? <DocIcon name="check" size={14} /> : i === done ? <m.span className="size-2 rounded-full bg-accent" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} /> : <DocIcon name={s.icon} size={15} />}
            </span>
            <span className="min-w-0 flex-1 text-sm">{s.label}</span>
            <Chip tone={s.tone}>{s.tag}</Chip>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setDone(done >= steps.length ? -1 : 0)} className="mt-4 h-10 w-full rounded-full bg-accent text-sm font-semibold text-white transition-[filter] hover:brightness-110">
        {done >= steps.length ? tr("Done · replay", "Selesai · ulangi") : done >= 0 ? tr("Waiting for your wallet…", "Menunggu wallet…") : tr("Approve & allow", "Setujui & izinkan")}
      </button>
    </Panel>
  );
}

/* ---------- Checks ---------- */

const CHECKS: Array<[string, string]> = [
  ["Receipt status is success", "Status receipt sukses"],
  ["Called the settlement contract", "Memanggil kontrak settlement"],
  ["Chain is BNB Smart Chain", "Chain adalah BNB Smart Chain"],
  ["Calldata matches the approved plan", "Calldata cocok dengan rencana"],
  ["PlanSettled event emitted", "Event PlanSettled terpancar"],
  ["One event per transfer", "Satu event per transfer"],
  ["Only planned transfers happened", "Hanya transfer terencana yang terjadi"],
  ["Approval used on-chain", "Persetujuan dipakai on-chain"],
  ["Plan marked settled on-chain", "Rencana ditandai selesai on-chain"],
  ["Approval nonces consumed", "Nonce persetujuan terpakai"],
  ["Every participant approved", "Semua peserta menyetujui"],
  ["Balances moved exactly", "Saldo berubah persis"],
  ["Contract holds nothing", "Kontrak tidak memegang apa pun"],
  ["Settled within the valid window", "Diselesaikan dalam jendela waktu"],
  ["Prices match the round snapshot", "Harga cocok dengan snapshot round"],
  ["Prices cross-checked on-chain", "Harga dicek silang on-chain"],
  ["Read through an independent provider", "Dibaca lewat penyedia independen"],
];

function ChecksDemo() {
  const tr = useT();
  const reduce = useReducedMotion();
  const [n, setN] = useState(CHECKS.length);
  useEffect(() => {
    if (n >= CHECKS.length) return;
    const id = window.setTimeout(() => setN((x) => x + 1), reduce ? 0 : 90);
    return () => window.clearTimeout(id);
  }, [n, reduce]);
  const all = n >= CHECKS.length;
  return (
    <Panel className="w-full max-w-[420px] p-4">
      <div className="flex items-center gap-3">
        <span className="relative grid size-9 place-items-center rounded-full bg-[#7ee2a8]/20 text-[#7ee2a8]">
          {all && <span className="ps-ping absolute inset-0 rounded-full ring-1 ring-[#7ee2a8]" />}
          <DocIcon name="shield" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{tr("Independent verifier", "Verifier independen")}</p>
          <p className={cx("text-xs tabular-nums", all ? "text-[#7ee2a8]" : "text-white/60")}>{n}/{CHECKS.length} {tr("passed", "lolos")}</p>
        </div>
        <button type="button" onClick={() => setN(0)} className="glass glass-frost rounded-full px-3 py-1.5 text-xs font-semibold">{tr("Run again", "Jalankan lagi")}</button>
      </div>
      <ul className="compact-scroll mt-3 grid max-h-56 gap-0.5 overflow-y-auto pr-1">
        {CHECKS.map(([e, i], j) => (
          <li key={e} className={cx("flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-[13px] transition-colors", j < n ? "text-white" : "text-white/35")}>
            <DocIcon name={j < n ? "checkFill" : "lock"} size={15} className={j < n ? "text-[#7ee2a8]" : "text-white/30"} />
            {tr(e, i)}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ---------- Leftover ---------- */

function LeftoverDemo() {
  const tr = useT();
  const [cap, setCap] = useState(100);
  const swapCostBps = 140;
  const recommended = swapCostBps > cap ? "carry" : "swap";
  const [picked, setPicked] = useState<string | null>(null);
  const choices: Array<{ key: string; icon: string; title: string; body: string }> = [
    { key: "carry", icon: "ph:arrows-clockwise-duotone", title: tr("Roll into the next round", "Bawa ke round berikutnya"), body: tr("Free. Tried again next time.", "Gratis. Dicoba lagi di round berikutnya.") },
    { key: "swap", icon: "ph:shopping-cart-duotone", title: tr("Swap now on PancakeSwap", "Swap sekarang di PancakeSwap"), body: tr("Est. cost 1.4% all-in.", "Perkiraan biaya 1,4% total.") },
    { key: "skip", icon: "ph:skip-forward-duotone", title: tr("Skip it", "Lewati"), body: tr("Target stays; nothing trades.", "Target tetap; tidak ada trade.") },
  ];
  return (
    <div className="w-full max-w-[380px]">
      <Panel className="grid gap-2 px-4 py-3">
        <span className="flex items-center justify-between text-xs font-medium text-white/70">
          {tr("Your cost cap", "Batas biayamu")}
          <span className="tabular-nums font-semibold text-white">{(cap / 100).toFixed(1)}%</span>
        </span>
        <input type="range" min={50} max={300} step={10} value={cap} onChange={(e) => setCap(Number(e.target.value))} className="accent-[var(--accent)]" aria-label={tr("Your cost cap", "Batas biayamu")} />
      </Panel>
      <ul className="mt-2.5 grid gap-2" role="radiogroup" aria-label={tr("Leftover choice", "Pilihan sisa")}>
        {choices.map((c) => {
          const on = (picked ?? recommended) === c.key;
          return (
            <li key={c.key}>
              <button type="button" role="radio" aria-checked={on} onClick={() => setPicked(c.key)} className={cx("glass glass-frost flex w-full items-center gap-3 rounded-[18px] px-3.5 py-3 text-left transition-shadow", on && "shadow-[0_0_0_1.5px_var(--accent)]")}>
                <span className={cx("grid size-9 shrink-0 place-items-center rounded-full", on ? "bg-accent text-white" : "bg-white/10 text-white/80")}><Icon icon={c.icon} width={18} height={18} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {c.title}
                    {recommended === c.key && <Chip tone="ok">{tr("Recommended", "Disarankan")}</Chip>}
                  </span>
                  <span className="block text-xs text-white/60">{c.body}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-center text-xs text-white/60">
        {recommended === "carry"
          ? tr("Swapping would cost 1.4%, above your cap, so Sama suggests rolling over.", "Swap akan memakan 1,4%, di atas batasmu, jadi Sama menyarankan membawanya ke round berikutnya.")
          : tr("Swapping costs 1.4%, within your cap.", "Swap memakan 1,4%, masih dalam batasmu.")}
      </p>
    </div>
  );
}

/* ---------- Tiers ---------- */

function TiersDemo() {
  const tr = useT();
  const tiers = [
    { tier: "A", count: 18, symbols: ["NVDAB", "AAPLB", "SPYB"], price: tr("Binance + on-chain TWAP", "Binance + TWAP on-chain"), swap: true, note: null, color: "#7ee2a8" },
    { tier: "B", count: 11, symbols: ["NFLXB", "AMDB"], price: "Binance", swap: false, note: null, color: "#8fb4ff" },
    { tier: "C", count: 59, symbols: ["SOXLB", "GMEB"], price: "Binance", swap: false, note: tr("Few holders or leveraged", "Pemegang sedikit atau leverage"), color: "#ffc178" },
  ];
  return (
    <div className="grid w-full max-w-[600px] gap-2.5 sm:grid-cols-3">
      {tiers.map((x) => (
        <Panel key={x.tier} className="p-4">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-xl text-sm font-bold" style={{ background: `${x.color}26`, color: x.color }}>{x.tier}</span>
            <span className="text-xs tabular-nums text-white/60">{x.count} {tr("assets", "aset")}</span>
          </div>
          <AssetStack symbols={x.symbols} size={28} max={3} className="mt-3.5" />
          <p className="mt-3.5 text-xs text-white/70">{x.price}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
            <Icon icon={x.swap ? "ph:check-circle-fill" : "ph:lock-simple-duotone"} width={14} height={14} className={x.swap ? "text-[#7ee2a8]" : "text-white/50"} aria-hidden="true" />
            {x.swap ? tr("Leftovers can be swapped", "Sisa bisa di-swap") : tr("Roll over or skip", "Bawa atau lewati")}
          </p>
          {x.note && <p className="mt-1.5 text-[11px] text-[#ffc178]">{x.note}</p>}
        </Panel>
      ))}
    </div>
  );
}
