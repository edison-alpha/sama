"use client";

import Link from "next/link";
import { useState } from "react";
import { IconArrowRight, IconCheck, IconX } from "@/components/icons";
import { Badge, stateTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorNote, PageSkeleton } from "@/components/ui/states";
import { Term } from "@/components/ui/term";
import { useSession } from "@/components/wallet/session";
import { API_MODE, sama } from "@/lib/api";
import type { RoundView } from "@/lib/api/types";
import { useAction, useApi } from "@/lib/api/use-api";
import { addressUrl } from "@/lib/chain";
import { percent, short, tokens, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { journey, STEP_ORDER, type StepKey, type StepStatus } from "@/lib/journey";
import { cx } from "@/utils/cx";
import { ActionStatus, AmountRow, Countdown, progressWords, RailStep, TxLink, WalletPromptPreview, who, type Prompt } from "./parts";
import { ReceiptSummary } from "./receipt";

type Props = { v: RoundView; refresh: () => Promise<void> };

/**
 * The whole round on one page (PRD §19.4.6): a vertical stepper where finished steps collapse to a line, the current
 * step is open with exactly one primary action, and upcoming steps say in one line what will happen.
 */
export function RoundJourney({ roundId }: { roundId: string }) {
  const { d, fmt } = useI18n();
  const { data: v, error, refresh } = useApi(() => sama.round(roundId), [roundId], {
    pollMs: API_MODE === "mock" ? 1_000 : 4_000,
    stopWhen: (r) => r.round.terminal && (r.you.decision !== null || !r.you.residual.some((x) => !x.dust)),
  });

  if (!v) return error ? <ErrorNote action={<button className="underline" onClick={() => void refresh()}>{d.common.retry}</button>}>{error}</ErrorNote> : <PageSkeleton />;
  const { current, status } = journey(v);

  return (
    <>
      <header className="mb-6">
        <Link href={`/circles/${v.circle.id}`} className="text-sm text-ink-3 hover:text-accent">{v.circle.name}</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{fmt(d.round.crumb, { seq: v.round.sequence })}</h1>
          <Badge tone={stateTone(v.round.state)} dot={!v.round.terminal}>{d.states[v.round.state]}</Badge>
        </div>
      </header>
      {error && <p className="mb-4 text-sm text-warn">{error}</p>}

      <ol className="relative grid gap-3" aria-label={d.round.crumb.replace("{seq}", String(v.round.sequence))}>
        {STEP_ORDER.map((key, i) => (
          <Step key={key} index={i} k={key} status={status[key]} current={current === key}>
            {current === key && <StepBody k={key} v={v} refresh={refresh} />}
          </Step>
        ))}
      </ol>
    </>
  );
}

function Step({ k, index, status, current, children }: { k: StepKey; index: number; status: StepStatus; current: boolean; children: React.ReactNode }) {
  const { d } = useI18n();
  const copy = d.round.steps[k];
  return (
    <li aria-current={current ? "step" : undefined} className={cx("rounded-[var(--radius-card)] border transition-colors", current ? "border-line bg-surface p-5 shadow-card sm:p-6" : "border-transparent px-5 py-3")}>
      <div className="flex items-center gap-3">
        <span className={cx("grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold", status === "done" && "bg-ok text-white", status === "active" && "bg-accent text-on-accent", status === "failed" && "bg-danger-soft text-danger", status === "upcoming" && "bg-surface-2 text-ink-3", status === "skipped" && "bg-surface-2 text-ink-3 line-through")}>
          {status === "done" ? <IconCheck size={16} /> : status === "failed" ? <IconX size={16} /> : index + 1}
        </span>
        <div className="min-w-0">
          <p className={cx("font-semibold", status === "upcoming" || status === "skipped" ? "text-ink-3" : "text-ink", current && "text-lg")}>{copy.title}</p>
          {status === "upcoming" && <p className="text-sm text-ink-3">{copy.upcoming}</p>}
        </div>
      </div>
      {children && <div className="mt-5 sm:pl-11">{children}</div>}
    </li>
  );
}

function StepBody({ k, v, refresh }: { k: StepKey } & Props) {
  switch (k) {
    case "join": return <JoinStep v={v} refresh={refresh} />;
    case "match": return <MatchStep v={v} refresh={refresh} />;
    case "result": return <ResultStep v={v} refresh={refresh} />;
    case "approve": return <ApproveStep v={v} refresh={refresh} />;
    case "settle": return <SettleStep v={v} refresh={refresh} />;
    case "leftovers": return <LeftoversStep v={v} refresh={refresh} />;
    case "receipt": return <ReceiptSummary v={v} compact />;
  }
}

/** Sticky on phones so the one action is always reachable (PRD §19.4.6). */
function CtaBar({ children }: { children: React.ReactNode }) {
  return <div className="sticky bottom-[76px] z-20 -mx-2 mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-surface/95 p-2 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0">{children}</div>;
}

function JoinStep({ v, refresh }: Props) {
  const { d, fmt } = useI18n();
  const { signer } = useSession();
  const act = useAction();
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid gap-4">
        <p className="text-sm font-medium">{d.round.yourPlan}</p>
        <ul className="grid gap-2">
          {v.you.intent.map((r) => <AmountRow key={r.symbol + r.side} direction={r.side} amount={r.amountTokens} symbol={r.symbol} usdValue={r.valueUsd} label={r.side === "SELL" ? d.round.sellUpTo : d.round.buyUpTo} />)}
        </ul>
        {v.you.outsideCircle.length > 0 && <p className="text-xs text-ink-3">{fmt(d.round.outside, { list: v.you.outsideCircle.join(", ") })}</p>}
        <p className="text-sm text-ink-2">{d.round.joinExplain}</p>
        <WalletPromptPreview prompts={[{ kind: "sign", label: d.glossary.freeSignature[0] }]} sponsored={v.gasSponsored} />
        <ActionStatus status={act.status} />
        {act.error && <ErrorNote>{act.error}</ErrorNote>}
        <CtaBar>
          <Button size="lg" busy={act.pending} onClick={() => act.run(async (say) => { await sama.signIntent(v, signer, say, progressWords(d)); await refresh(); })}>{d.round.signJoin}</Button>
        </CtaBar>
      </div>
      <RoundFacts v={v} refresh={refresh} />
    </div>
  );
}

function RoundFacts({ v, refresh }: Props) {
  const { d, fmt, locale } = useI18n();
  const act = useAction();
  const collecting = ["OPEN", "COLLECTING"].includes(v.round.state);
  return (
    <Card tone="soft" className="grid content-start gap-4">
      {collecting && <Countdown until={v.round.freezesAt} label={d.round.closesIn} />}
      <div>
        <div className="mb-1.5 flex justify-between text-sm"><span>{fmt(d.round.joined, { a: v.aggregate.signed, b: v.circle.memberCount })}</span></div>
        <div className="h-2 rounded-full bg-surface-3"><div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min(100, (v.aggregate.signed / Math.max(1, v.circle.memberCount)) * 100)}%` }} /></div>
        <p className="mt-1.5 text-xs text-ink-3">{fmt(d.round.needed, { n: v.circle.minParticipants })}</p>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">{d.round.prices}</p>
        <ul className="grid gap-1 text-sm">{v.round.prices.map((p) => <li key={p.symbol} className="flex justify-between"><span>{p.symbol}</span><span className="num">{usd(p.priceUsd, locale)}</span></li>)}</ul>
      </div>
      {collecting && v.circle.isOrganizer && (
        <Button variant="secondary" size="sm" busy={act.pending} disabled={v.aggregate.signed === 0} onClick={() => act.run(async () => { await sama.closeCollection(v.round.id); await refresh(); })}>{d.round.closeNow}</Button>
      )}
    </Card>
  );
}

function MatchStep({ v, refresh }: Props) {
  const { d } = useI18n();
  const collecting = ["OPEN", "COLLECTING"].includes(v.round.state);
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex items-center gap-5 rounded-[var(--radius-card)] bg-sky p-6 text-on-sky">
        <span className="relative grid size-16 shrink-0 place-items-center" aria-hidden="true">
          <span className="absolute inset-0 rounded-full border-2 border-dashed border-white/40 animate-sama-orbit" />
          <span className="size-3 rounded-full bg-accent" />
        </span>
        <div>
          <p className="font-medium">{collecting ? d.round.signedIn : d.round.matching}</p>
          <p className="mt-1 text-sm text-white/70">{d.round.matchingHint}</p>
        </div>
      </div>
      <RoundFacts v={v} refresh={refresh} />
    </div>
  );
}

function YourLegs({ v }: { v: RoundView }) {
  const { d, fmt, locale } = useI18n();
  return (
    <ul className="grid gap-2">
      {v.you.legs.map((l, i) => (
        <AmountRow key={i} direction={l.direction} amount={l.amountTokens} symbol={l.symbol} usdValue={l.valueUsd} label={fmt(l.direction === "SEND" ? d.round.youSend : d.round.youReceive, { amount: tokens(l.amountTokens, locale), symbol: l.symbol, who: who(l.counterparty, d) })} />
      ))}
    </ul>
  );
}

function ResultStep({ v }: Props) {
  const { d, fmt, locale } = useI18n();
  const s = v.round.state;
  const back = <ButtonLink href={`/circles/${v.circle.id}`} variant="secondary">{d.round.backToCircle}</ButtonLink>;
  if (!v.you.signed) return <EmptyState title={d.round.notJoinedTitle} body={d.round.notJoinedBody} action={back} />;
  if (s === "EXPIRED") return <EmptyState title={d.round.expiredTitle} body={d.round.expiredBody} action={back} />;
  if (s === "INSUFFICIENT_PARTICIPANTS") return <EmptyState title={d.round.insufficientTitle} body={fmt(d.round.insufficientBody, { a: v.aggregate.signed, b: v.circle.minParticipants })} action={back} />;
  if (s === "PLAN_STALE") return <EmptyState title={d.round.staleTitle} body={d.round.staleBody} action={back} />;
  if (s === "PLAN_REJECTED" || s === "CANCELLED") return <EmptyState title={d.round.rejectedTitle} body={d.round.rejectedBody} action={back} />;
  if (!v.you.inPlan) return <EmptyState title={d.round.noCrossTitle} body={d.round.noCrossBody} />;
  return (
    <div className="grid gap-4">
      <YourLegs v={v} />
      <p className="text-sm text-ink-2">{fmt(d.round.roundTotals, { amount: usd(v.aggregate.crossedUsd, locale, 0), legs: v.aggregate.legCount, cycles: v.aggregate.cycleCount })}</p>
    </div>
  );
}

function ApproveStep({ v, refresh }: Props) {
  const { d, fmt, locale } = useI18n();
  const { signer } = useSession();
  const act = useAction();
  const sent = v.you.legs.filter((l) => l.direction === "SEND");
  const sentUsd = sent.reduce((s, l) => s + l.valueUsd, 0);
  const requested = v.you.intent.filter((r) => r.side === "SELL").reduce((s, r) => s + r.valueUsd, 0);
  const missing = v.you.allowances.filter((a) => !a.sufficient);
  const unfunded = v.you.allowances.filter((a) => !a.funded);
  const prompts: Prompt[] = [
    ...(v.you.approved ? [] : [{ kind: "sign" as const, label: d.round.promptSign }]),
    ...missing.map((a) => ({ kind: "tx" as const, label: fmt(d.round.promptAllow, { amount: tokens(a.amountTokens, locale), symbol: a.symbol }) })),
  ];
  const deadline = v.round.planValidUntil ? new Date(v.round.planValidUntil * 1000).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat label={d.round.matchedShare} value={requested > 0 ? percent((sentUsd / requested) * 100, locale, 0) : "—"} tone="match" />
          <Stat label={d.round.leftover} value={usd(Math.max(0, requested - sentUsd), locale, 0)} tone="rest" />
        </div>
        <YourLegs v={v} />
        <div className="rounded-2xl bg-surface-2 p-4">
          <p className="font-semibold">{d.round.authorizing}</p>
          <p className="mt-1 text-sm text-ink-2">{fmt(d.round.authorizingBody, { time: deadline })}</p>
        </div>
        {unfunded.length > 0 && <ErrorNote>{fmt(d.round.unfunded, { list: unfunded.map((a) => a.symbol).join(", ") })}</ErrorNote>}
        <WalletPromptPreview prompts={prompts} sponsored={v.gasSponsored} />
        <ActionStatus status={act.status} />
        {act.error && <ErrorNote>{act.error}</ErrorNote>}
        <CtaBar>
          <Button size="lg" busy={act.pending} disabled={unfunded.length > 0} onClick={() => act.run(async (say) => { await sama.approveAndAllow(v, signer, say, progressWords(d)); await refresh(); })}>{d.round.approveAllow}</Button>
        </CtaBar>
      </div>
      <PlanFacts v={v} deadline={deadline} />
    </div>
  );
}

function PlanFacts({ v, deadline }: { v: RoundView; deadline: string }) {
  const { d, fmt } = useI18n();
  return (
    <Card tone="soft" className="grid content-start gap-3 text-sm">
      <Fact k={d.round.approvals} v={fmt(d.common.of, { a: v.aggregate.approvals, b: v.aggregate.participants })} />
      <Fact k={d.round.deadline} v={deadline} />
      <Fact k={<Term k="atomic">{d.round.contract}</Term>} v={<a className="num text-accent hover:underline" href={addressUrl(v.round.settlementContract)} target="_blank" rel="noreferrer">{short(v.round.settlementContract, 8, 6)}</a>} />
      {v.round.planHash && <Fact k={d.round.plan} v={<span className="num" title={v.round.planHash}>{short(v.round.planHash, 10, 6)}</span>} />}
    </Card>
  );
}

function SettleStep({ v, refresh }: Props) {
  const { d, fmt } = useI18n();
  const { signer } = useSession();
  const act = useAction();
  const s = v.round.state;
  const allApproved = v.aggregate.approvals === v.aggregate.participants && v.aggregate.participants > 0;
  const sent = Boolean(v.round.settlementTx) && s !== "SETTLEMENT_REVERTED";
  const v9 = v.round.verification;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid gap-4">
        <ol className="grid gap-4">
          <RailStep done={allApproved} active={!allApproved} title={d.round.rail.approvals} detail={fmt(d.common.of, { a: v.aggregate.approvals, b: v.aggregate.participants })} />
          <RailStep done={v.you.approved && v.you.allowances.every((a) => a.sufficient)} active={false} title={d.round.rail.allowance} />
          <RailStep done={sent} active={allApproved && !sent} failed={s === "SETTLEMENT_REVERTED"} title={d.round.rail.tx} detail={v.round.settlementTx ? <TxLink hash={v.round.settlementTx} /> : null} />
          <RailStep done={v9?.status === "PASS"} active={sent && !v9} failed={s === "VERIFICATION_FAILED"} title={<Term k="verifier">{d.round.rail.verify}</Term> as unknown as string} detail={v9 ? fmt(d.round.verified, { a: v9.checks.filter((c) => c.status === "PASS").length, b: v9.checks.length }) : null} />
        </ol>
        {s === "SETTLEMENT_REVERTED" && <ErrorNote>{d.round.revertedTitle}. {d.round.revertedBody}</ErrorNote>}
        {s === "VERIFICATION_FAILED" && <ErrorNote>{d.round.verifyFailTitle}. {d.round.verifyFailBody}</ErrorNote>}
        {!allApproved && <p className="text-sm text-ink-2">{fmt(d.round.approvedWaiting, { a: v.aggregate.approvals, b: v.aggregate.participants })}</p>}
        {s === "READY_TO_SETTLE" && (
          <>
            <p className="text-sm text-ink-2">{d.round.settleReady}</p>
            <WalletPromptPreview prompts={[{ kind: "tx", label: d.round.promptSettle }]} sponsored={v.gasSponsored} />
            <ActionStatus status={act.status} />
            {act.error && <ErrorNote>{act.error}</ErrorNote>}
            <CtaBar>
              <Button size="lg" busy={act.pending} onClick={() => act.run(async (say) => { await sama.settle(v, signer, say, progressWords(d)); await refresh(); })}>{d.round.sendSettlement}</Button>
            </CtaBar>
          </>
        )}
      </div>
      <YourLegsCard v={v} />
    </div>
  );
}

function YourLegsCard({ v }: { v: RoundView }) {
  const { d } = useI18n();
  return (
    <Card tone="soft" className="grid content-start gap-3">
      <p className="text-sm font-semibold">{d.round.steps.result.title}</p>
      <YourLegs v={v} />
    </Card>
  );
}

function LeftoversStep({ v, refresh }: Props) {
  const { d, locale } = useI18n();
  const { signer } = useSession();
  const act = useAction();
  const real = v.you.residual.filter((r) => !r.dust);
  const rec = v.you.recommendation;
  if (real.length === 0) return <p className="text-sm text-ink-2">{v.you.residual.length ? d.round.dustOnly : d.round.nothingLeft}</p>;

  const recommended = rec?.decision === "EXECUTE_NOW" ? "swap" : rec?.decision === "CANCEL" ? "drop" : "carry";
  const choices = [
    { key: "carry", run: () => act.run(async () => { await sama.decideResidual(v, "CARRY_FORWARD"); await refresh(); }) },
    ...(rec?.canExecute ? [{ key: "swap", run: () => act.run(async (say) => { await sama.swapResidual(v, signer, say, progressWords(d)); await refresh(); }) }] : []),
    { key: "drop", run: () => act.run(async () => { await sama.decideResidual(v, "CANCEL"); await refresh(); }) },
  ] as const;

  return (
    <div className="grid gap-4">
      {v.round.state === "NO_CROSS" && <EmptyState title={d.round.noCrossTitle} body={d.round.noCrossBody} />}
      <p className="text-sm text-ink-2">{d.round.leftoverBody}</p>
      <ul className="grid gap-2">
        {real.map((r) => <AmountRow key={r.symbol + r.side} direction={r.side} amount={r.amountTokens} symbol={r.symbol} usdValue={r.valueUsd} label={r.side === "SELL" ? d.round.stillSell : d.round.stillBuy} />)}
      </ul>
      {rec && (
        <div className="rounded-2xl bg-accent-soft p-4 text-sm">
          <p className="font-semibold">{d.round.suggestion}: {d.round.choices[recommended][0]}</p>
          {rec.reasons.map((r) => <p key={r} className="mt-1 text-ink-2">{r}</p>)}
          {rec.costPct !== null && <p className="num mt-1 text-xs text-ink-3">PancakeSwap ≈ {percent(rec.costPct, locale)}</p>}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {choices.map((c) => {
          const [title, body] = d.round.choices[c.key as "carry" | "swap" | "drop"];
          return (
            <button key={c.key} type="button" disabled={act.pending} onClick={c.run} className={cx("rounded-2xl border p-4 text-left transition-colors disabled:opacity-50", c.key === recommended ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong")}>
              <span className="flex items-center justify-between font-semibold">{title}{c.key === recommended && <IconArrowRight size={16} />}</span>
              <span className="mt-1 block text-sm text-ink-2">{body}</span>
            </button>
          );
        })}
      </div>
      <ActionStatus status={act.status} />
      {act.error && <ErrorNote>{act.error}</ErrorNote>}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "match" | "rest" }) {
  return (
    <div className={cx("rounded-2xl p-4", tone === "match" ? "bg-match-soft" : "bg-rest-soft")}>
      <p className="text-xs font-medium text-ink-2">{label}</p>
      <p className={cx("num mt-1 text-2xl font-semibold", tone === "match" ? "text-match" : "text-rest")}>{value}</p>
    </div>
  );
}

function Fact({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-3">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
