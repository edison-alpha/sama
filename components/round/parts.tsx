"use client";

import { useEffect, useState } from "react";
import { AssetIcon } from "@/components/asset-icon";
import { IconCheck, IconExternal, IconGas, IconPen, IconSpinner, IconWallet } from "@/components/icons";
import type { ProgressWords } from "@/lib/api/contract";
import { txUrl } from "@/lib/chain";
import { clock, short, tokens, usd } from "@/lib/format";
import type { Dict } from "@/lib/i18n/dict";
import { fmt } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

export function useNow() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/** Large countdown; announced politely, not every second. */
export function Countdown({ until, label }: { until: number; label: string }) {
  const now = useNow();
  const left = until - now;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">{label}</p>
      <p className="num mt-1 text-5xl font-semibold tracking-tight" aria-live={left % 60 === 0 ? "polite" : "off"}>{clock(left)}</p>
    </div>
  );
}

/** "Member 2" from the API, or a bare number from mock data, rendered in the user's language. */
export function who(counterparty: string, d: Dict) {
  const n = counterparty.match(/\d+/)?.[0];
  return n ? fmt(d.common.member, { n }) : counterparty;
}

/** One line per token amount: direction, token amount, USD. Icons plus words so colour is never the only cue. */
export function AmountRow({ direction, amount, symbol, usdValue, label }: { direction: "SEND" | "RECEIVE" | "SELL" | "BUY"; amount: number; symbol: string; usdValue: number; label: string }) {
  const { locale } = useI18n();
  const out = direction === "SEND" || direction === "SELL";
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3">
      <span className="flex items-center gap-3">
        <span className={cx("grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold", out ? "bg-rest-soft text-rest" : "bg-match-soft text-match")} aria-hidden="true">{out ? "↑" : "↓"}</span>
        <span className="text-sm">{label}</span>
      </span>
      <span className="flex items-center gap-2.5 text-right">
        <span>
          <span className="num block text-sm font-medium">{tokens(amount, locale)} {symbol}</span>
          <span className="num text-xs text-ink-3">{usd(usdValue, locale)}</span>
        </span>
        <AssetIcon symbol={symbol} size={28} />
      </span>
    </li>
  );
}

export type Prompt = { kind: "sign" | "tx"; label: string };

/**
 * Before any wallet action: list every prompt the wallet will show, whether it is a free signature or a transaction,
 * and who pays the gas (PRD §19.4.6).
 */
export function WalletPromptPreview({ prompts, sponsored }: { prompts: Prompt[]; sponsored: boolean }) {
  const { d, fmt: f } = useI18n();
  if (prompts.length === 0) return null;
  return (
    <div className="rounded-2xl border border-line p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><IconWallet size={18} />{f(d.round.walletPrompts, { n: prompts.length })}</p>
      <ol className="grid gap-2">
        {prompts.map((p, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="num grid size-6 place-items-center rounded-full bg-surface-2 text-xs">{i + 1}</span>
              {p.label}
            </span>
            <span className={cx("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", p.kind === "sign" || sponsored ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn")}>
              {p.kind === "sign" ? <><IconPen size={12} />{d.common.free}</> : sponsored ? <><IconGas size={12} />{d.common.sponsored}</> : <><IconGas size={12} />{d.common.needsGas}</>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Live progress line shown while a multi-step action runs. */
export function ActionStatus({ status }: { status: string | null }) {
  if (!status) return null;
  return (
    <p role="status" className="flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-sm">
      <IconSpinner size={16} />
      {status}
    </p>
  );
}

export function TxLink({ hash }: { hash: string }) {
  const { d } = useI18n();
  return (
    <a href={txUrl(hash)} target="_blank" rel="noreferrer" className="num inline-flex items-center gap-1 text-sm text-accent hover:underline" title={d.common.viewOnExplorer}>
      {short(hash, 10, 6)} <IconExternal size={14} />
    </a>
  );
}

export function RailStep({ done, active, failed, title, detail }: { done: boolean; active: boolean; failed?: boolean; title: string; detail?: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className={cx("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full", failed ? "bg-danger-soft text-danger" : done ? "bg-ok text-white" : active ? "bg-accent-soft text-accent" : "bg-surface-2 text-ink-3")}>
        {done ? <IconCheck size={16} /> : active ? <IconSpinner size={14} /> : <span className="size-1.5 rounded-full bg-current" />}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {detail && <div className="text-sm text-ink-3">{detail}</div>}
      </div>
    </li>
  );
}

export function progressWords(d: Dict): ProgressWords {
  const p = d.round.progress;
  return { sign: p.sign, submit: p.submit, approvePlan: p.approvePlan, allow: (amount, symbol) => fmt(p.allow, { amount: tokens(amount), symbol }), settle: p.settle, verifying: p.verifying, quote: p.quote, swap: p.swap };
}
