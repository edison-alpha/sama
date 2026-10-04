"use client";

import { m } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { IconArrowLeft, IconCheck, IconChevronRight, IconShare } from "@/components/icons";
import { Stagger, rise } from "@/components/motion";
import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorNote, PageSkeleton } from "@/components/ui/states";
import { sama } from "@/lib/api";
import { useApi } from "@/lib/api/use-api";
import { blockUrl } from "@/lib/chain";
import { short, tokens, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { AmountRow, TxLink, who } from "./parts";
import { VerifierChecks } from "./receipt";

/**
 * A round's receipt, laid out like a transaction detail in a wallet: one centred summary card (verified mark, what you
 * received and sent), then the transfers and the onchain references as plain lists, with the independent checks in a
 * compact panel beside them.
 */
export function ReceiptPage({ roundId }: { roundId: string }) {
  const { d, fmt, locale } = useI18n();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const { data: v, error } = useApi(() => sama.round(roundId), [roundId]);
  if (!v) return error ? <ErrorNote>{error}</ErrorNote> : <PageSkeleton />;

  const ver = v.round.verification;
  const verified = ver?.status === "PASS";
  const round = fmt(d.round.crumb, { seq: v.round.sequence });
  const total = (dir: "SEND" | "RECEIVE") => v.you.legs.filter((l) => l.direction === dir).reduce((s, l) => s + l.valueUsd, 0);
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
    <Stagger>
      {/* Phones: back · share. Web: breadcrumb. */}
      <m.div variants={rise} className="mb-4 flex items-center justify-between md:hidden">
        <button type="button" onClick={() => router.push(`/rounds/${v.round.id}`)} aria-label={round} className="glass-panel grid size-11 place-items-center rounded-full text-ink transition-[filter] hover:brightness-95"><IconArrowLeft size={22} /></button>
        <span className="text-lg font-semibold text-ink">{d.receipt.title}</span>
        <button type="button" onClick={() => void share()} aria-label={d.round.share} className="glass-panel grid size-11 place-items-center rounded-full text-ink-2 transition-[filter] hover:brightness-95"><IconShare size={20} /></button>
      </m.div>
      <m.nav variants={rise} aria-label="Breadcrumb" className="mb-6 hidden min-w-0 items-center gap-1 text-[15px] md:flex">
        <Link href="/circles" className="shrink-0 text-ink-3 hover:text-ink">{d.circles.title}</Link>
        <IconChevronRight size={16} className="shrink-0 text-ink-3" />
        <Link href={`/circles/${v.circle.id}`} className="truncate text-ink-3 hover:text-ink">{v.circle.name}</Link>
        <IconChevronRight size={16} className="shrink-0 text-ink-3" />
        <Link href={`/rounds/${v.round.id}`} className="shrink-0 text-ink-3 hover:text-ink">{round}</Link>
        <IconChevronRight size={16} className="shrink-0 text-ink-3" />
        <span className="shrink-0 font-medium text-ink">{d.receipt.title}</span>
      </m.nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start lg:gap-10">
        <div className="grid min-w-0 gap-8">
          <m.section variants={rise} className="rounded-[28px] border border-line bg-surface px-6 py-8 text-center">
            <span className={verified ? "mx-auto grid size-16 place-items-center rounded-full bg-ok text-white" : "mx-auto grid size-16 place-items-center rounded-full bg-surface-2 text-ink-2"} aria-hidden="true">
              <IconCheck size={30} />
            </span>
            <p className="mt-4 text-sm text-ink-3">{v.circle.name} · {round}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink md:text-3xl">{verified ? d.receipt.verified : d.states[v.round.state]}</h1>
            {v.you.legs.length > 0 ? (
              <div className="mx-auto mt-6 grid max-w-md grid-cols-2 divide-x divide-line">
                <div className="px-3">
                  <p className="text-sm text-ink-3">{d.round.totalReceived}</p>
                  <p className="num mt-1 text-2xl font-semibold tracking-tight text-ok md:text-3xl">+{usd(total("RECEIVE"), locale)}</p>
                </div>
                <div className="px-3">
                  <p className="text-sm text-ink-3">{d.round.totalSent}</p>
                  <p className="num mt-1 text-2xl font-semibold tracking-tight text-ink md:text-3xl">−{usd(total("SEND"), locale)}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-ink-2">{d.receipt.nothing}</p>
            )}
          </m.section>

          {v.you.legs.length > 0 && (
            <m.section variants={rise} aria-labelledby="receipt-transfers">
              <h2 id="receipt-transfers" className="text-lg font-semibold tracking-tight text-ink">{d.round.yourTransfers}</h2>
              <ul className="mt-1 grid grid-cols-1 divide-y divide-line">
                {v.you.legs.map((l, i) => (
                  <AmountRow key={i} direction={l.direction} amount={l.amountTokens} symbol={l.symbol} usdValue={l.valueUsd} label={fmt(l.direction === "SEND" ? d.receipt.sent : d.receipt.received, { amount: tokens(l.amountTokens, locale), symbol: l.symbol, who: who(l.counterparty, d) })} />
                ))}
              </ul>
            </m.section>
          )}

          <m.section variants={rise} aria-labelledby="receipt-details">
            <h2 id="receipt-details" className="text-lg font-semibold tracking-tight text-ink">{d.round.details}</h2>
            <dl className="mt-1 grid grid-cols-1 divide-y divide-line">
              {v.round.settlementTx && <Row k={d.receipt.settlement} v={<TxLink hash={v.round.settlementTx} />} />}
              {ver?.blockNumber && <Row k={d.receipt.block} v={<a className="num text-accent hover:underline" href={blockUrl(ver.blockNumber)} target="_blank" rel="noreferrer">{ver.blockNumber}</a>} />}
              {v.round.planHash && <Row k={d.round.plan} v={<span className="num" title={v.round.planHash}>{short(v.round.planHash, 10, 6)}</span>} />}
              <Row k={d.receipt.snapshot} v={<span className="num" title={v.round.snapshotHash}>{short(v.round.snapshotHash, 10, 6)}</span>} />
              <Row k={d.receipt.leftovers} v={decision} />
            </dl>
          </m.section>

          <m.div variants={rise} className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={<IconShare size={18} />} onClick={() => void share()}>{copied ? d.common.copied : d.round.share}</Button>
              <ButtonLink href={`/rounds/${v.round.id}`} variant="ghost">{round}</ButtonLink>
            </div>
            <p className="text-xs text-ink-3">{d.receipt.shareNote}</p>
          </m.div>
        </div>

        <m.aside variants={rise} className="lg:sticky lg:top-6">
          <VerifierChecks v={v} />
        </m.aside>
      </div>

      <p className="mt-10 text-xs text-ink-3">{d.common.notInvestmentAdvice}</p>
    </Stagger>
  );
}

function Row({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 text-[15px]">
      <dt className="text-ink-3">{k}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-ink">{v}</dd>
    </div>
  );
}
