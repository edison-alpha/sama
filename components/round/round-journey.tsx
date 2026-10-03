"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { IconAlert, IconArrowLeft, IconCheck, IconChevronRight, IconClock, IconPen, IconSpinner } from "@/components/icons";
import { Stagger } from "@/components/motion";
import { Badge, stateTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorNote, PageSkeleton } from "@/components/ui/states";
import { Term } from "@/components/ui/term";
import { useSession } from "@/components/wallet/session";
import { API_MODE, sama } from "@/lib/api";
import type { RoundView } from "@/lib/api/types";
import { useAction, useApi } from "@/lib/api/use-api";
import { addressUrl, blockUrl } from "@/lib/chain";
import { percent, short, tokens, usd } from "@/lib/format";
import type { Locale } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";
import { journey, type StepKey, type StepStatus } from "@/lib/journey";
import { cx } from "@/utils/cx";
import { ActionStatus, AmountRow, Countdown, progressWords, RailStep, TxLink, WalletPromptPreview, who, type Prompt } from "./parts";
import { ReceiptSummary } from "./receipt";

type Props = { v: RoundView; refresh: () => Promise<void> };

/**
 * The whole round on one page (PRD §19.4.6). A five-phase progress strip says where the round is; below it one card
 * says, in plain words, what is happening now and offers at most one primary action. Prices, contract and hashes sit
 * in a collapsed "Round details" section for the curious.
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
    <Stagger>
      <div className="mx-auto grid max-w-3xl gap-4">
        <header className="mb-2 grid gap-6">
          <div>
            <Link href={`/circles/${v.circle.id}`} className="inline-flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink">
              <IconArrowLeft size={16} />
              {v.circle.name}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{fmt(d.round.crumb, { seq: v.round.sequence })}</h1>
              <Badge tone={stateTone(v.round.state)} dot={!v.round.terminal}>{d.states[v.round.state]}</Badge>
            </div>
          </div>
          <Progress current={current} status={status} />
        </header>
        {error && <p className="text-sm text-warn">{error}</p>}
        <StepBody k={current} v={v} refresh={refresh} />
        <RoundDetails v={v} />
      </div>
    </Stagger>
  );
}

type Phase = "join" | "match" | "approve" | "settle" | "finish";

/** The seven journey steps grouped into the five phases a member actually notices. */
const PHASES: Array<[Phase, StepKey[]]> = [
  ["join", ["join"]],
  ["match", ["match", "result"]],
  ["approve", ["approve"]],
  ["settle", ["settle"]],
  ["finish", ["leftovers", "receipt"]],
];

function phaseStatus(steps: StepKey[], current: StepKey, status: Record<StepKey, StepStatus>): StepStatus {
  const all = steps.map((k) => status[k]);
  if (all.includes("failed")) return "failed";
  // The receipt is the end of the road, not something left to do.
  if (current === "receipt" && steps.includes("receipt")) return "done";
  if (steps.includes(current)) return "active";
  if (all.every((s) => s === "skipped")) return "skipped";
  return all.includes("done") ? "done" : "upcoming";
}

function Progress({ current, status }: { current: StepKey; status: Record<StepKey, StepStatus> }) {
  const { d } = useI18n();
  return (
    <ol className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {PHASES.map(([phase, steps]) => {
        const s = phaseStatus(steps, current, status);
        return (
          <li key={phase} aria-current={s === "active" ? "step" : undefined} className="grid min-w-0 gap-2">
            <span className={cx("h-1 rounded-full", s === "done" ? "bg-ok" : s === "active" ? "bg-accent" : s === "failed" ? "bg-danger" : "bg-surface-3")} />
            <span className={cx("flex min-w-0 items-center gap-1 text-xs font-medium sm:text-sm", s === "active" || s === "failed" ? "text-ink" : s === "done" ? "text-ink-2" : "text-ink-3", s === "skipped" && "line-through")}>
              {s === "done" && <IconCheck size={14} className="shrink-0 text-ok" />}
              <span className="truncate">{d.round.phases[phase]}</span>
            </span>
          </li>
        );
      })}
    </ol>
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
    case "receipt": return <DoneStep v={v} />;
  }
}

/** todo: your move · wait: someone else's move · busy: Sama is working · done · info: ended, nothing moved · stop: a real failure. */
type Mood = "todo" | "wait" | "busy" | "done" | "info" | "stop";

const MOOD_CHIP: Record<Mood, string> = {
  todo: "bg-accent-soft text-accent",
  wait: "bg-surface-2 text-ink-2",
  busy: "bg-match-soft text-match",
  done: "bg-ok-soft text-ok",
  info: "bg-surface-2 text-ink-2",
  stop: "bg-danger-soft text-danger",
};

/** The one card that says what is happening now. */
function Hero({ mood, title, body, children }: { mood: Mood; title: ReactNode; body?: ReactNode; children?: ReactNode }) {
  return (
    <Card className="grid gap-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className={cx("grid size-11 shrink-0 place-items-center rounded-full", MOOD_CHIP[mood])} aria-hidden="true">
          {mood === "todo" ? <IconPen size={20} /> : mood === "wait" ? <IconClock size={20} /> : mood === "busy" ? <IconSpinner size={20} /> : mood === "done" ? <IconCheck size={22} /> : <IconAlert size={20} />}
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
          {body && <p className="mt-1.5 text-ink-2">{body}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function Stat({ label, value, note, tone }: { label: ReactNode; value: ReactNode; note?: ReactNode; tone?: "match" | "rest" }) {
  return (
    <div className={cx("min-w-0 rounded-2xl px-4 py-3", tone === "match" ? "bg-match-soft" : tone === "rest" ? "bg-rest-soft" : "bg-surface-2")}>
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd className={cx("num mt-0.5 truncate text-2xl font-semibold tracking-tight", tone === "match" && "text-match", tone === "rest" && "text-rest")}>{value}</dd>
      {note && <dd className="mt-0.5 text-xs text-ink-3">{note}</dd>}
    </div>
  );
}

/** Small "tell me more" fold inside a card. */
function More({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {summary}
        <IconChevronRight size={16} className="shrink-0 text-ink-3 transition-transform group-open:rotate-90" />
      </summary>
      <div className="px-4 pb-4 text-sm leading-relaxed text-ink-2">{children}</div>
    </details>
  );
}

/** Sticky on phones so the one action is always reachable (PRD §19.4.6). */
function CtaBar({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-[76px] z-20 -mx-2 flex flex-wrap items-center gap-3 rounded-2xl bg-surface/95 p-2 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">{children}</div>;
}

const deadlineOf = (v: RoundView, locale: Locale) => (v.round.planValidUntil ? new Date(v.round.planValidUntil * 1000).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : "—");

function CollectingStats({ v }: { v: RoundView }) {
  const { d, fmt } = useI18n();
  const { signed } = v.aggregate;
  const { memberCount, minParticipants } = v.circle;
  return (
    <dl className="grid grid-cols-2 gap-3">
      <Stat label={d.round.closesIn} value={<Countdown until={v.round.freezesAt} />} />
      {/* The member count can lag behind signatures (e.g. a brand-new Circle), so never show "5 of 1". */}
      <Stat label={d.round.joinedLabel} value={memberCount >= signed ? fmt(d.common.of, { a: signed, b: memberCount }) : signed} note={signed >= minParticipants ? d.round.enough : fmt(d.round.needed, { n: minParticipants })} />
    </dl>
  );
}

function CloseNow({ v, refresh, variant }: Props & { variant: "secondary" | "ghost" }) {
  const { d } = useI18n();
  const act = useAction();
  if (!v.circle.isOrganizer) return null;
  return (
    <>
      <Button variant={variant} busy={act.pending} disabled={v.aggregate.signed === 0} onClick={() => act.run(async () => { await sama.closeCollection(v.round.id); await refresh(); })}>{d.round.closeNow}</Button>
      {act.error && <ErrorNote>{act.error}</ErrorNote>}
    </>
  );
}

/** What the member signs into the round: the most they will sell and buy. */
function PlanRows({ v }: { v: RoundView }) {
  const { d, fmt } = useI18n();
  return (
    <div className="grid gap-2">
      <ul className="grid gap-2">
        {v.you.intent.map((r) => <AmountRow key={r.symbol + r.side} direction={r.side} amount={r.amountTokens} symbol={r.symbol} usdValue={r.valueUsd} label={r.side === "SELL" ? d.round.sellUpTo : d.round.buyUpTo} />)}
      </ul>
      {v.you.outsideCircle.length > 0 && <p className="text-xs text-ink-3">{fmt(d.round.outside, { list: v.you.outsideCircle.join(", ") })}</p>}
    </div>
  );
}

/** Once signed, the plan is background: one line with the totals, rows on demand. */
function PlanFold({ v }: { v: RoundView }) {
  const { d, fmt, locale } = useI18n();
  const sum = (side: "SELL" | "BUY") => usd(v.you.intent.filter((r) => r.side === side).reduce((s, r) => s + r.valueUsd, 0), locale, 0);
  return (
    <More summary={<span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3">{d.round.yourPlan}<span className="num text-xs font-normal text-ink-3">{fmt(d.round.planSummary, { sell: sum("SELL"), buy: sum("BUY") })}</span></span>}>
      <PlanRows v={v} />
    </More>
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

function JoinStep({ v, refresh }: Props) {
  const { d } = useI18n();
  const { signer } = useSession();
  const act = useAction();
  return (
    <Hero mood="todo" title={d.round.joinTitle} body={d.round.joinBody}>
      <CollectingStats v={v} />
      <div className="grid gap-3">
        <h3 className="text-sm font-semibold">{d.round.yourPlan}</h3>
        <PlanRows v={v} />
      </div>
      <div className="grid gap-3">
        <ActionStatus status={act.status} />
        {act.error && <ErrorNote>{act.error}</ErrorNote>}
        <CtaBar>
          <Button size="lg" busy={act.pending} onClick={() => act.run(async (say) => { await sama.signIntent(v, signer, say, progressWords(d)); await refresh(); })}>{d.round.signJoin}</Button>
          <CloseNow v={v} refresh={refresh} variant="ghost" />
        </CtaBar>
        <WalletPromptPreview prompts={[{ kind: "sign", label: d.glossary.freeSignature[0] }]} sponsored={v.gasSponsored} />
      </div>
    </Hero>
  );
}

function MatchStep({ v, refresh }: Props) {
  const { d } = useI18n();
  const collecting = ["OPEN", "COLLECTING"].includes(v.round.state);
  return collecting ? (
    <Hero mood="wait" title={d.round.waitingTitle} body={d.round.waitingBody}>
      <CollectingStats v={v} />
      <PlanFold v={v} />
      {v.circle.isOrganizer && <div className="flex flex-wrap gap-3"><CloseNow v={v} refresh={refresh} variant="secondary" /></div>}
    </Hero>
  ) : (
    <Hero mood="busy" title={d.round.matchingTitle} body={d.round.matchingBody}>
      <PlanFold v={v} />
    </Hero>
  );
}

/** The round ended for you before anything moved: say why in one sentence and point back to the Circle. */
function ResultStep({ v }: Props) {
  const { d, fmt } = useI18n();
  const s = v.round.state;
  const [title, body] =
    !v.you.signed ? [d.round.notJoinedTitle, d.round.notJoinedBody]
    : s === "EXPIRED" ? [d.round.expiredTitle, d.round.expiredBody]
    : s === "INSUFFICIENT_PARTICIPANTS" ? [d.round.insufficientTitle, fmt(d.round.insufficientBody, { a: v.aggregate.signed, b: v.circle.minParticipants })]
    : s === "PLAN_STALE" ? [d.round.staleTitle, d.round.staleBody]
    : s === "PLAN_REJECTED" || s === "CANCELLED" ? [d.round.rejectedTitle, d.round.rejectedBody]
    : [d.round.noCrossTitle, d.round.noCrossBody];
  return (
    <Hero mood="info" title={title} body={body}>
      <div><ButtonLink href={`/circles/${v.circle.id}`} variant="secondary">{d.round.backToCircle}</ButtonLink></div>
    </Hero>
  );
}

function ApproveStep({ v, refresh }: Props) {
  const { d, fmt, locale } = useI18n();
  const { signer } = useSession();
  const act = useAction();
  const sentUsd = v.you.legs.filter((l) => l.direction === "SEND").reduce((s, l) => s + l.valueUsd, 0);
  const requested = v.you.intent.filter((r) => r.side === "SELL").reduce((s, r) => s + r.valueUsd, 0);
  const missing = v.you.allowances.filter((a) => !a.sufficient);
  const unfunded = v.you.allowances.filter((a) => !a.funded);
  const prompts: Prompt[] = [
    ...(v.you.approved ? [] : [{ kind: "sign" as const, label: d.round.promptSign }]),
    ...missing.map((a) => ({ kind: "tx" as const, label: fmt(d.round.promptAllow, { amount: tokens(a.amountTokens, locale), symbol: a.symbol }) })),
  ];
  const deadline = deadlineOf(v, locale);

  return (
    <Hero mood="todo" title={d.round.approveTitle} body={fmt(d.round.approveBody, { time: deadline })}>
      <dl className="grid grid-cols-2 gap-3">
        <Stat label={d.round.matchedShare} value={requested > 0 ? percent((sentUsd / requested) * 100, locale, 0) : "—"} tone="match" />
        <Stat label={d.round.leftover} value={usd(Math.max(0, requested - sentUsd), locale, 0)} tone="rest" />
      </dl>
      <div className="grid gap-3">
        <h3 className="text-sm font-semibold">{d.round.yourTransfers}</h3>
        <YourLegs v={v} />
      </div>
      <More summary={d.round.authorizing}>{fmt(d.round.authorizingBody, { time: deadline })}</More>
      {unfunded.length > 0 && <ErrorNote>{fmt(d.round.unfunded, { list: unfunded.map((a) => a.symbol).join(", ") })}</ErrorNote>}
      <div className="grid gap-3">
        <WalletPromptPreview prompts={prompts} sponsored={v.gasSponsored} />
        <ActionStatus status={act.status} />
        {act.error && <ErrorNote>{act.error}</ErrorNote>}
        <CtaBar>
          <Button size="lg" busy={act.pending} disabled={unfunded.length > 0} onClick={() => act.run(async (say) => { await sama.approveAndAllow(v, signer, say, progressWords(d)); await refresh(); })}>{d.round.approveAllow}</Button>
        </CtaBar>
      </div>
    </Hero>
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
  const ready = s === "READY_TO_SETTLE";

  const [mood, title, body]: [Mood, string, string] =
    s === "SETTLEMENT_REVERTED" ? ["stop", d.round.revertedTitle, d.round.revertedBody]
    : s === "VERIFICATION_FAILED" ? ["stop", d.round.verifyFailTitle, d.round.verifyFailBody]
    : ready ? ["todo", d.round.readyTitle, d.round.settleReady]
    : !allApproved || s === "PROPOSED" || s === "APPROVING" ? ["wait", d.round.waitOthersTitle, fmt(d.round.approvedWaiting, { a: v.aggregate.approvals, b: v.aggregate.participants })]
    : ["busy", d.round.settlingTitle, d.round.settlingBody];

  return (
    <Hero mood={mood} title={title} body={body}>
      <ol className="grid gap-4 rounded-2xl bg-surface-2 p-4">
        <RailStep done={allApproved} active={!allApproved} title={d.round.rail.approvals} detail={fmt(d.common.of, { a: v.aggregate.approvals, b: v.aggregate.participants })} />
        <RailStep done={v.you.approved && v.you.allowances.every((a) => a.sufficient)} active={false} title={d.round.rail.allowance} />
        <RailStep done={sent} active={allApproved && !sent && !ready} failed={s === "SETTLEMENT_REVERTED"} title={d.round.rail.tx} detail={v.round.settlementTx ? <TxLink hash={v.round.settlementTx} /> : null} />
        <RailStep done={v9?.status === "PASS"} active={sent && !v9} failed={s === "VERIFICATION_FAILED"} title={<Term k="verifier">{d.round.rail.verify}</Term>} detail={v9 ? fmt(d.round.verified, { a: v9.checks.filter((c) => c.status === "PASS").length, b: v9.checks.length }) : null} />
      </ol>
      {ready && (
        <div className="grid gap-3">
          <ActionStatus status={act.status} />
          {act.error && <ErrorNote>{act.error}</ErrorNote>}
          <CtaBar>
            <Button size="lg" busy={act.pending} onClick={() => act.run(async (say) => { await sama.settle(v, signer, say, progressWords(d)); await refresh(); })}>{d.round.sendSettlement}</Button>
          </CtaBar>
          <WalletPromptPreview prompts={[{ kind: "tx", label: d.round.promptSettle }]} sponsored={v.gasSponsored} />
        </div>
      )}
      <More summary={d.round.yourTransfers}><YourLegs v={v} /></More>
    </Hero>
  );
}

type Choice = "carry" | "swap" | "drop";

/** Pick first, then confirm: one tap no longer trades or drops anything by accident. */
function LeftoversStep({ v, refresh }: Props) {
  const { d, fmt, locale } = useI18n();
  const { signer } = useSession();
  const act = useAction();
  const real = v.you.residual.filter((r) => !r.dust);
  const rec = v.you.recommendation;
  const recommended: Choice = rec?.decision === "EXECUTE_NOW" && rec.canExecute ? "swap" : rec?.decision === "CANCEL" ? "drop" : "carry";
  const [picked, setPicked] = useState<Choice>(recommended);
  const noCross = v.round.state === "NO_CROSS";

  if (real.length === 0) return <Hero mood={noCross ? "info" : "done"} title={noCross ? d.round.noCrossTitle : d.round.doneTitle} body={v.you.residual.length ? d.round.dustOnly : d.round.nothingLeft} />;

  const choices: Choice[] = rec?.canExecute ? ["carry", "swap", "drop"] : ["carry", "drop"];
  const confirm = () =>
    act.run(async (say) => {
      if (picked === "swap") await sama.swapResidual(v, signer, say, progressWords(d));
      else await sama.decideResidual(v, picked === "carry" ? "CARRY_FORWARD" : "CANCEL");
      await refresh();
    });

  return (
    <Hero mood="todo" title={noCross ? d.round.noCrossTitle : d.round.leftoverTitle} body={fmt(d.round.leftoverBody, { amount: usd(real.reduce((s, r) => s + r.valueUsd, 0), locale, 0) })}>
      <ul className="grid gap-2">
        {real.map((r) => <AmountRow key={r.symbol + r.side} direction={r.side} amount={r.amountTokens} symbol={r.symbol} usdValue={r.valueUsd} label={r.side === "SELL" ? d.round.stillSell : d.round.stillBuy} />)}
      </ul>
      <fieldset className="grid gap-2">
        <legend className="sr-only">{d.round.leftoverTitle}</legend>
        {choices.map((key) => {
          const [title, body] = d.round.choices[key];
          const on = picked === key;
          return (
            <label key={key} className={cx("flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors", on ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong", act.pending && "pointer-events-none opacity-60")}>
              <input type="radio" name="leftover" value={key} checked={on} onChange={() => setPicked(key)} className="mt-1 size-4 shrink-0 accent-[var(--accent)]" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold">
                  {title}
                  {key === recommended && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-on-accent">{d.round.recommended}</span>}
                </span>
                <span className="mt-0.5 block text-sm text-ink-2">{body}</span>
                {key === recommended && rec && rec.reasons.length > 0 && <span className="mt-2 block text-xs text-ink-3">{rec.reasons.join(" ")}</span>}
                {key === "swap" && rec?.costPct != null && <span className="num mt-1 block text-xs text-ink-3">PancakeSwap ≈ {percent(rec.costPct, locale)}</span>}
              </span>
            </label>
          );
        })}
      </fieldset>
      <div className="grid gap-3">
        <ActionStatus status={act.status} />
        {act.error && <ErrorNote>{act.error}</ErrorNote>}
        <CtaBar>
          <Button size="lg" busy={act.pending} onClick={confirm}>{d.round.confirmChoice}</Button>
        </CtaBar>
      </div>
    </Hero>
  );
}

function DoneStep({ v }: { v: RoundView }) {
  const { d, fmt, locale } = useI18n();
  const total = (dir: "SEND" | "RECEIVE") => usd(v.you.legs.filter((l) => l.direction === dir).reduce((s, l) => s + l.valueUsd, 0), locale);
  return (
    <Hero mood="done" title={d.round.doneTitle} body={v.you.legs.length ? fmt(d.round.doneBody, { sent: total("SEND"), received: total("RECEIVE") }) : d.receipt.nothing}>
      <ReceiptSummary v={v} compact />
    </Hero>
  );
}

/** Everything a member might want to double-check, folded away by default. */
function RoundDetails({ v }: { v: RoundView }) {
  const { d, fmt, locale } = useI18n();
  const ver = v.round.verification;
  const hash = (h: string) => <span className="num" title={h}>{short(h, 10, 6)}</span>;
  return (
    <Card className="p-0 sm:p-0">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-medium sm:px-6 [&::-webkit-details-marker]:hidden">
          {d.round.details}
          <IconChevronRight size={18} className="shrink-0 text-ink-3 transition-transform group-open:rotate-90" />
        </summary>
        <div className="grid gap-6 px-5 pb-5 text-sm sm:grid-cols-2 sm:px-6 sm:pb-6">
          <div>
            <p className="mb-2 text-ink-3">{d.round.prices}</p>
            <ul className="grid gap-1.5">
              {v.round.prices.map((p) => <li key={p.symbol} className="flex justify-between gap-3"><span>{p.symbol}</span><span className="num">{usd(p.priceUsd, locale)}</span></li>)}
            </ul>
          </div>
          <dl className="grid content-start gap-1.5">
            {v.aggregate.participants > 0 && <Fact k={d.round.approvals} v={fmt(d.common.of, { a: v.aggregate.approvals, b: v.aggregate.participants })} />}
            {v.round.planValidUntil && <Fact k={d.round.deadline} v={deadlineOf(v, locale)} />}
            <Fact k={<Term k="atomic">{d.round.contract}</Term>} v={<a className="num text-accent hover:underline" href={addressUrl(v.round.settlementContract)} target="_blank" rel="noreferrer">{short(v.round.settlementContract, 8, 6)}</a>} />
            {v.round.planHash && <Fact k={d.round.plan} v={hash(v.round.planHash)} />}
            <Fact k={d.receipt.snapshot} v={hash(v.round.snapshotHash)} />
            {v.round.settlementTx && <Fact k={d.receipt.settlement} v={<TxLink hash={v.round.settlementTx} />} />}
            {ver?.blockNumber && <Fact k={d.receipt.block} v={<a className="num text-accent hover:underline" href={blockUrl(ver.blockNumber)} target="_blank" rel="noreferrer">{ver.blockNumber}</a>} />}
          </dl>
        </div>
      </details>
    </Card>
  );
}

function Fact({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-3">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
