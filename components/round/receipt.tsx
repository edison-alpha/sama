"use client";

import { useState } from "react";
import { IconCheck, IconShare, IconX } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import type { RoundView } from "@/lib/api/types";
import { blockUrl } from "@/lib/chain";
import { short, tokens } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { AmountRow, TxLink, who } from "./parts";

/**
 * Per-user receipt (PRD §19.4.7). `compact` is the last step of the round journey: the step card already says it is
 * verified and the hashes live under "Round details", so it shows only the transfers, the leftover decision and actions.
 */
export function ReceiptSummary({ v, compact = false }: { v: RoundView; compact?: boolean }) {
  const { d, fmt, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const ver = v.round.verification;
  const decision = v.you.decision ? d.round.decided[v.you.decision.choice] : v.you.residual.some((r) => !r.dust) ? "—" : d.round.nothingLeft;

  const share = async () => {
    const url = `${window.location.origin}/rounds/${v.round.id}/receipt`;
    try {
      if (navigator.share) await navigator.share({ title: `${v.circle.name} · Sama`, url });
      else await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // The user closed the share sheet.
    }
  };

  return (
    <div className="grid gap-5">
      {!compact && (
        <div className="flex flex-wrap items-center gap-2">
          {ver?.status === "PASS" ? <Badge tone="ok"><IconCheck size={14} />{d.receipt.verified}</Badge> : <Badge>{d.states[v.round.state]}</Badge>}
        </div>
      )}
      {v.you.legs.length === 0 ? (
        !compact && <p className="text-sm text-ink-2">{d.receipt.nothing}</p>
      ) : (
        <ul className="grid grid-cols-1 divide-y divide-line">
          {v.you.legs.map((l, i) => (
            <AmountRow key={i} direction={l.direction} amount={l.amountTokens} symbol={l.symbol} usdValue={l.valueUsd} label={fmt(l.direction === "SEND" ? d.receipt.sent : d.receipt.received, { amount: tokens(l.amountTokens, locale), symbol: l.symbol, who: who(l.counterparty, d) })} />
          ))}
        </ul>
      )}
      <dl className="grid gap-2 rounded-2xl bg-surface-2 p-4 text-sm">
        {!compact && v.round.settlementTx && <Fact k={d.receipt.settlement} v={<TxLink hash={v.round.settlementTx} />} />}
        {!compact && ver?.blockNumber && <Fact k={d.receipt.block} v={<a className="num text-accent hover:underline" href={blockUrl(ver.blockNumber)} target="_blank" rel="noreferrer">{ver.blockNumber}</a>} />}
        {!compact && v.round.planHash && <Fact k={d.round.plan} v={<span className="num" title={v.round.planHash}>{short(v.round.planHash, 10, 6)}</span>} />}
        {!compact && <Fact k={d.receipt.snapshot} v={<span className="num" title={v.round.snapshotHash}>{short(v.round.snapshotHash, 10, 6)}</span>} />}
        <Fact k={d.receipt.leftovers} v={decision} />
      </dl>
      <div className="flex flex-wrap gap-2">
        {compact && <ButtonLink href={`/rounds/${v.round.id}/receipt`}>{d.round.openReceipt}</ButtonLink>}
        <Button variant="secondary" icon={<IconShare size={18} />} onClick={() => void share()}>{copied ? d.common.copied : d.round.share}</Button>
      </div>
      <p className="text-xs text-ink-3">{d.receipt.shareNote}</p>
    </div>
  );
}

/** Independent checks as a compact panel: a pass count with a progress bar, then one tight row per check. */
export function VerifierChecks({ v }: { v: RoundView }) {
  const { d, fmt } = useI18n();
  const ver = v.round.verification;
  const passed = ver ? ver.checks.filter((c) => c.status === "PASS").length : 0;
  return (
    <section aria-labelledby="checks-title" className="rounded-[24px] border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="checks-title" className="text-lg font-semibold tracking-tight text-ink">{d.receipt.checks}</h2>
        {ver && <span className="num text-sm font-semibold text-ok">{passed}/{ver.checks.length}</span>}
      </div>
      {!ver ? (
        <p className="mt-2 text-sm text-ink-2">{v.round.state === "NO_CROSS" ? d.receipt.noSettlement : d.receipt.notVerified}</p>
      ) : (
        <>
          <p className="mt-0.5 text-sm text-ink-3">{fmt(d.round.verified, { a: passed, b: ver.checks.length })}</p>
          <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
            <span className="block h-full rounded-full bg-ok" style={{ width: `${(passed / Math.max(1, ver.checks.length)) * 100}%` }} />
          </span>
          <ul className="mt-3 grid grid-cols-1 divide-y divide-line">
            {ver.checks.map((c) => (
              <li key={c.name} className="flex gap-3 py-2.5" title={c.detail}>
                <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${c.status === "PASS" ? "bg-ok text-white" : c.status === "FAIL" ? "bg-danger text-white" : "bg-warn-soft text-warn"}`}>{c.status === "PASS" ? <IconCheck size={10} /> : <IconX size={10} />}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{c.name}</span>
                  <span className="block text-xs leading-snug text-ink-3">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          {ver.providers && (
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-3">
              {fmt(d.receipt.providers, { executor: ver.providers.executor, verifier: ver.providers.verifier })} {ver.providers.independent && d.receipt.independent}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function Fact({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-3">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
