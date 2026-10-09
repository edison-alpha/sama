"use client";

import { useState } from "react";
import { IconCheck, IconShare, IconX } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import type { RoundView } from "@/lib/api/types";
import { addressUrl, blockUrl, txUrl } from "@/lib/chain";
import { short, tokens } from "@/lib/format";
import type { Dict } from "@/lib/i18n/dict";
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

/**
 * A check's label in the user's language, by its stable id. Per-participant checks carry "(you)" or "(member 2)" in the
 * server's English name; that suffix is translated too. Unknown ids fall back to the server's label.
 */
function checkLabel(c: { id?: string; name: string }, d: Dict): string {
  const labels = d.receipt.checkLabels as Record<string, string>;
  const base = c.id ? labels[c.id] : undefined;
  if (!base) return c.name;
  const suffix = /\((you|member \d+)\)$/.exec(c.name)?.[1];
  return suffix ? `${base} (${suffix === "you" ? d.receipt.you : who(suffix, d)})` : base;
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
          {v.round.settlementTx && (
            <p className="mt-3 flex items-center justify-between gap-3 text-xs text-ink-3">
              <span>{d.receipt.settlement}</span>
              <TxLink hash={v.round.settlementTx} />
            </p>
          )}
          <ul className="mt-2 grid grid-cols-1 divide-y divide-line">
            {ver.checks.map((c) => (
              <li key={c.name} className="flex gap-2.5 py-2">
                <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${c.status === "PASS" ? "bg-ok text-white" : c.status === "FAIL" ? "bg-danger text-white" : "bg-warn-soft text-warn"}`}>{c.status === "PASS" ? <IconCheck size={10} /> : <IconX size={10} />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-snug text-ink">{checkLabel(c, d)}</span>
                  <CheckDetail text={c.detail} pass={c.status === "PASS"} tx={v.round.settlementTx} matches={d.receipt.matches} />
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

// Hashes, addresses and nonces: too long to read and without spaces to wrap on.
const LONG = /0x[0-9a-fA-F]{40,}|\b\d{16,}\b/g;

/**
 * A check's detail without the raw codes: the full text is only on hover. A passing "expected X, saw X" comparison
 * reads "nonce · matches"; other hashes and nonces are hidden on a pass and shortened on a failure (where they help);
 * addresses and the settlement tx stay as short explorer links.
 */
function CheckDetail({ text, pass, tx, matches }: { text: string; pass: boolean; tx?: string | null; matches: string }) {
  const values = text.match(LONG) ?? [];
  if (pass && values.length === 2 && values[0].toLowerCase() === values[1].toLowerCase()) {
    const label = text.slice(0, text.indexOf(values[0])).replace(/^expected\s+/i, "").trim();
    return (
      <span title={text} className="mt-0.5 block text-xs leading-snug text-ink-3">
        {label} <span className="text-ok">· {matches}</span>
      </span>
    );
  }
  const parts = text.split(LONG);
  return (
    <span title={text} className="mt-0.5 block text-xs leading-snug text-ink-3 [overflow-wrap:anywhere]">
      {parts.map((p, i) => (
        <span key={i}>{p}{i < values.length && <Value v={values[i]} tx={tx} pass={pass} />}</span>
      ))}
    </span>
  );
}

function Value({ v, tx, pass }: { v: string; tx?: string | null; pass: boolean }) {
  const link = "num text-accent hover:underline";
  if (/^0x[0-9a-fA-F]{40}$/.test(v)) return <a href={addressUrl(v)} target="_blank" rel="noreferrer" className={link}>{short(v, 6, 4)}</a>;
  if (tx && v.toLowerCase() === tx.toLowerCase()) return <a href={txUrl(v)} target="_blank" rel="noreferrer" className={link}>{short(v, 8, 6)}</a>;
  if (pass) return <>…</>;
  return <span className="num text-ink-2">{v.startsWith("0x") ? short(v, 8, 6) : `${v.slice(0, 6)}…${v.slice(-6)}`}</span>;
}

function Fact({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-3">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
