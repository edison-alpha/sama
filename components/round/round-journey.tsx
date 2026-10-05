"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AssetIcon, AssetStack } from "@/components/asset-icon";
import { IconAlert, IconArrowLeft, IconCheck, IconChevronRight, IconClock, IconPen, IconSpinner } from "@/components/icons";
import { Stagger } from "@/components/motion";
import { Badge, stateTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
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
 * The whole round on one page (PRD §19.4.6), laid out like a token page on a DEX: breadcrumb and title, a five-phase
 * stepper, then what is happening now on the left and an action panel on the right where a swap box would sit (on
 * phones the panel follows the content and its one button is pinned above the tab bar). Prices, contract and hashes
 * sit in a folded "Round details" row at the bottom.
 */
export function RoundJourney({ roundId }: { roundId: string }) {
  const { d, fmt } = useI18n();
  const router = useRouter();
  const { data: v, error, refresh } = useApi(() => sama.round(roundId), [roundId], {
    pollMs: API_MODE === "mock" ? 1_000 : 4_000,
    stopWhen: (r) => r.round.terminal && (r.you.decision !== null || !r.you.residual.some((x) => !x.dust)),
  });

  if (!v) return error ? <ErrorNote action={<button className="underline" onClick={() => void refresh()}>{d.common.retry}</button>}>{error}</ErrorNote> : <PageSkeleton />;
  const { current, status } = journey(v);
  const title = fmt(d.round.crumb, { seq: v.round.sequence });

  return (
    <Stagger>
      {/* Phones: an app-style back button. Web: a breadcrumb. */}
      <div className="mb-4 md:hidden">
        <button type="button" onClick={() => router.push(`/circles/${v.circle.id}`)} aria-label={v.circle.name} className="glass-panel grid size-11 place-items-center rounded-full text-ink transition-[filter] hover:brightness-95"><IconArrowLeft size={22} /></button>
      </div>
      <nav aria-label="Breadcrumb" className="mb-6 hidden min-w-0 items-center gap-1 text-[15px] md:flex">
        <Link href="/circles" className="shrink-0 text-ink-3 hover:text-ink">{d.circles.title}</Link>
        <IconChevronRight size={16} className="shrink-0 text-ink-3" />
        <Link href={`/circles/${v.circle.id}`} className="truncate text-ink-3 hover:text-ink">{v.circle.name}</Link>
        <IconChevronRight size={16} className="shrink-0 text-ink-3" />
        <span className="shrink-0 font-medium text-ink">{title}</span>
      </nav>

      <header className="flex items-center gap-4">
        <AssetStack symbols={v.circle.assetSymbols} size={40} max={3} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">{title}</h1>
            <Badge tone={stateTone(v.round.state)} dot={!v.round.terminal}>{d.states[v.round.state]}</Badge>
          </div>
          <p className="truncate text-sm text-ink-3 md:text-base">{v.circle.name}</p>
        </div>
      </header>

      <div className="mt-6 border-b border-line pb-6 md:mt-8">
        <Stepper current={current} status={status} />
      </div>

      {error && <p className="mt-4 text-sm text-warn">{error}</p>}
      <div className="mt-8">
        <StepBody k={current} v={v} refresh={refresh} />
      </div>
      <RoundDetails v={v} />
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

/** Numbered phases joined by a line: green check when done, accent when now, quiet when ahead. */
function Stepper({ current, status }: { current: StepKey; status: Record<StepKey, StepStatus> }) {
  const { d } = useI18n();
  return (
    <ol className="grid grid-cols-5">
      {PHASES.map(([phase, steps], i) => {
        const s = phaseStatus(steps, current, status);
        return (
          <li key={phase} aria-current={s === "active" ? "step" : undefined} className="relative grid min-w-0 justify-items-center gap-2 text-center">
            {/* Connector from the previous circle to this one, stopping short of both so it never crosses a number. */}
            {i > 0 && <span className={cx("absolute left-[calc(-50%+22px)] right-[calc(50%+22px)] top-3.5 h-0.5 -translate-y-1/2 rounded-full", s === "done" || s === "active" ? "bg-ok/60" : "bg-surface-3")} aria-hidden="true" />}
            <span
              className={cx(
                "relative z-10 grid size-7 place-items-center rounded-full text-[13px] font-semibold",
                s === "done" ? "bg-ok text-white" : s === "active" ? "bg-accent text-on-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_25%,transparent)]" : s === "failed" ? "bg-danger text-white" : "bg-surface-2 text-ink-3",
              )}
            >
              {s === "done" ? <IconCheck size={16} /> : s === "failed" ? <IconAlert size={16} /> : i + 1}
            </span>
            <span className={cx("w-full truncate text-xs font-medium md:text-sm", s === "active" || s === "failed" ? "text-ink" : s === "done" ? "text-ink-2" : "text-ink-3", s === "skipped" && "line-through")}>{d.round.phases[phase]}</span>
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

function MoodIcon({ mood, size = 44 }: { mood: Mood; size?: number }) {
  return (
    <span className={cx("grid shrink-0 place-items-center rounded-full", MOOD_CHIP[mood])} style={{ width: size, height: size }} aria-hidden="true">
      {mood === "todo" ? <IconPen size={20} /> : mood === "wait" ? <IconClock size={20} /> : mood === "busy" ? <IconSpinner size={20} /> : mood === "done" ? <IconCheck size={22} /> : <IconAlert size={20} />}
    </span>
  );
}

/**
 * One phase: what is happening (title + plain-words body + content) on the left, the action panel on the right.
 * The panel always opens with the mood and the round state so it reads the same in every phase.
 */
function Step({ v, mood, title, body, children, panel }: { v: RoundView; mood: Mood; title: ReactNode; body?: ReactNode; children?: ReactNode; panel?: ReactNode }) {
  const { d } = useI18n();
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-10">
      <section className="grid min-w-0 gap-8">
        <div className="flex items-start gap-4">
          <MoodIcon mood={mood} />
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">{title}</h2>
            {body && <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2 md:text-base">{body}</p>}
          </div>
        </div>
        {children}
      </section>
      {/* Without an action the panel only repeats the status, so phones (where it would sit under the content) skip it. */}
      <aside className={cx("grid gap-4 rounded-[24px] border border-line bg-surface p-5 lg:sticky lg:top-6", !panel && "max-lg:hidden")}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-3">{mood === "todo" ? d.home.nextStep : d.round.statusLabel}</span>
          <Badge tone={stateTone(v.round.state)} dot={!v.round.terminal}>{d.states[v.round.state]}</Badge>
        </div>
        {panel}
      </aside>
    </div>
  );
}

/** Big-number stats, like the Stats block on a token page. */
function Stats({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-6 gap-y-6">{children}</dl>;
}

function Stat({ label, value, note, tone }: { label: ReactNode; value: ReactNode; note?: ReactNode; tone?: "match" | "rest" }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-ink-3">{label}</dt>
      <dd className={cx("num mt-1 truncate text-[28px] font-semibold leading-tight tracking-tight md:text-3xl", tone === "match" ? "text-match" : tone === "rest" ? "text-rest" : "text-ink")}>{value}</dd>
      {note && <dd className="mt-0.5 text-sm text-ink-3">{note}</dd>}
    </div>
  );
}

/** A titled token list (no boxes): rows are separated by hairlines, as in a wallet. */
function TokenList({ title, children, note }: { title: ReactNode; children: ReactNode; note?: ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight text-ink">{title}</h3>
      <ul className="mt-1 grid grid-cols-1 divide-y divide-line">{children}</ul>
      {note && <p className="mt-2 text-sm text-ink-3">{note}</p>}
    </div>
  );
}

/** Small "tell me more" fold, styled as a list row with a chevron. */
function More({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <details className="group border-y border-line">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 text-base font-medium text-ink [&::-webkit-details-marker]:hidden">
        {summary}
        <IconChevronRight size={18} className="shrink-0 text-ink-3 transition-transform group-open:rotate-90" />
      </summary>
      <div className="pb-4 text-[15px] leading-relaxed text-ink-2">{children}</div>
    </details>
  );
}

/** The panel's one primary button. On phones it is pinned above the tab bar so it is always reachable (PRD §19.4.6). */
function Cta({ children }: { children: ReactNode }) {
  return (
    <>
      {/* No tab bar sits under this route (see app-shell.tsx), so the button rests on the safe area itself. */}
      <div className="fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-30 md:static [&>button]:h-14 [&>button]:w-full [&>button]:text-base md:[&>button]:h-12">{children}</div>
      <div className="h-24 md:hidden" aria-hidden="true" />
    </>
  );
}

const deadlineOf = (v: RoundView, locale: Locale) => (v.round.planValidUntil ? new Date(v.round.planValidUntil * 1000).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : "—");

function CollectingStats({ v }: { v: RoundView }) {
  const { d, fmt } = useI18n();
  const { signed } = v.aggregate;
  const { memberCount, minParticipants } = v.circle;
  return (
    <Stats>
      <Stat label={d.round.closesIn} value={<Countdown until={v.round.freezesAt} />} />
      {/* The member count can lag behind signatures (e.g. a brand-new Circle), so never show "5 of 1". */}
      <Stat label={d.round.joinedLabel} value={memberCount >= signed ? fmt(d.common.of, { a: signed, b: memberCount }) : signed} note={signed >= minParticipants ? d.round.enough : fmt(d.round.needed, { n: minParticipants })} />
    </Stats>
  );
}

function CloseNow({ v, refresh, variant }: Props & { variant: "secondary" | "ghost" }) {
  const { d } = useI18n();
  const act = useAction();
  if (!v.circle.isOrganizer) return null;
  return (
    <>
      <Button variant={variant} block busy={act.pending} disabled={v.aggregate.signed === 0} onClick={() => act.run(async () => { await sama.closeCollection(v.round.id); await refresh(); })}>{d.round.closeNow}</Button>
      {act.error && <ErrorNote>{act.error}</ErrorNote>}
    </>
  );
}

/**
 * What the round's price snapshot means for this member: outside the regular NYSE session stock prices are the last
 * close, and assets that failed a price check are left out of the round with the reason.
 */
function SnapshotNotes({ v }: { v: RoundView }) {
  const { d, fmt } = useI18n();
  const session = v.round.marketSession;
  const excluded = v.round.excludedAssets ?? [];
  if ((!session || session === "market") && excluded.length === 0) return null;
  return (
    <div className="grid gap-3">
      {session && session !== "market" && (
        <p className="flex items-start gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-ink-2">
          <IconClock size={18} className="mt-0.5 shrink-0 text-ink-3" />
          <span>{session === "closed" ? d.round.market.closed : fmt(d.round.market.session, { session: d.round.market.sessions[session] })}</span>
        </p>
      )}
      {excluded.length > 0 && (
        <div className="rounded-2xl border border-warn/40 bg-warn-soft/40 px-4 py-3">
          <p className="text-sm font-semibold text-ink">{d.round.excluded.title}</p>
          <p className="mt-0.5 text-sm text-ink-2">{d.round.excluded.body}</p>
          <ul className="mt-2 grid gap-2">
            {excluded.map((e) => (
              <li key={e.symbol} className="flex items-start gap-2 text-sm">
                <AssetIcon symbol={e.symbol} size={22} />
                <span className="min-w-0"><span className="font-semibold text-ink">{e.symbol}</span> <span className="text-ink-3">· {e.reason}</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** What the member signs into the round: the most they will sell and buy. */
function PlanRows({ v }: { v: RoundView }) {
  const { d, fmt } = useI18n();
  return (
    <TokenList title={d.round.yourPlan} note={v.you.outsideCircle.length > 0 ? fmt(d.round.outside, { list: v.you.outsideCircle.join(", ") }) : undefined}>
      {v.you.intent.map((r) => <AmountRow key={r.symbol + r.side} direction={r.side} amount={r.amountTokens} symbol={r.symbol} usdValue={r.valueUsd} label={r.side === "SELL" ? d.round.sellUpTo : d.round.buyUpTo} />)}
    </TokenList>
  );
}

/** Once signed, the plan is background: one row with the totals, token rows on demand. */
function PlanFold({ v }: { v: RoundView }) {
  const { d, fmt, locale } = useI18n();
  const sum = (side: "SELL" | "BUY") => usd(v.you.intent.filter((r) => r.side === side).reduce((s, r) => s + r.valueUsd, 0), locale, 0);
  return (
    <More summary={<span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3">{d.round.yourPlan}<span className="num text-sm font-normal text-ink-3">{fmt(d.round.planSummary, { sell: sum("SELL"), buy: sum("BUY") })}</span></span>}>
      <ul className="grid grid-cols-1 divide-y divide-line">
        {v.you.intent.map((r) => <AmountRow key={r.symbol + r.side} direction={r.side} amount={r.amountTokens} symbol={r.symbol} usdValue={r.valueUsd} label={r.side === "SELL" ? d.round.sellUpTo : d.round.buyUpTo} />)}
      </ul>
    </More>
  );
}

function LegRows({ v }: { v: RoundView }) {
  const { d, fmt, locale } = useI18n();
  return (
    <>
      {v.you.legs.map((l, i) => (
        <AmountRow key={i} direction={l.direction} amount={l.amountTokens} symbol={l.symbol} usdValue={l.valueUsd} label={fmt(l.direction === "SEND" ? d.round.youSend : d.round.youReceive, { amount: tokens(l.amountTokens, locale), symbol: l.symbol, who: who(l.counterparty, d) })} />
      ))}
    </>
  );
}

function JoinStep({ v, refresh }: Props) {
  const { d } = useI18n();
  const { signer } = useSession();
  const act = useAction();
  // The server could not build an intent for this wallet (no target, empty wallet, nothing this circle trades): say why
  // and point at the fix instead of offering a signature that would fail.
  if (v.you.joinBlocker) {
    return (
      <Step
        v={v}
        mood="info"
        title={d.round.blocked.title}
        body={v.you.joinBlocker}
        panel={
          <>
            <ButtonLink href="/portfolio?tab=target" size="lg" block>{d.round.blocked.fixTarget}</ButtonLink>
            <ButtonLink href={`/circles/${v.circle.id}`} variant="ghost" block>{d.round.backToCircle}</ButtonLink>
            <CloseNow v={v} refresh={refresh} variant="ghost" />
          </>
        }
      >
        <CollectingStats v={v} />
        <SnapshotNotes v={v} />
      </Step>
    );
  }
  return (
    <Step
      v={v}
      mood="todo"
      title={d.round.joinTitle}
      body={d.round.joinBody}
      panel={
        <>
          <WalletPromptPreview prompts={[{ kind: "sign", label: d.glossary.freeSignature[0] }]} sponsored={v.gasSponsored} />
          <ActionStatus status={act.status} />
          {act.error && <ErrorNote>{act.error}</ErrorNote>}
          <Cta>
            <Button size="lg" busy={act.pending} onClick={() => act.run(async (say) => { await sama.signIntent(v, signer, say, progressWords(d)); await refresh(); })}>{d.round.signJoin}</Button>
          </Cta>
          <CloseNow v={v} refresh={refresh} variant="ghost" />
        </>
      }
    >
      <CollectingStats v={v} />
      <SnapshotNotes v={v} />
      <PlanRows v={v} />
    </Step>
  );
}

function MatchStep({ v, refresh }: Props) {
  const { d } = useI18n();
  const collecting = ["OPEN", "COLLECTING"].includes(v.round.state);
  return collecting ? (
    <Step v={v} mood="wait" title={d.round.waitingTitle} body={d.round.waitingBody} panel={v.circle.isOrganizer ? <CloseNow v={v} refresh={refresh} variant="secondary" /> : undefined}>
      <CollectingStats v={v} />
      <SnapshotNotes v={v} />
      <PlanFold v={v} />
    </Step>
  ) : (
    <Step v={v} mood="busy" title={d.round.matchingTitle} body={d.round.matchingBody} >
      <PlanFold v={v} />
    </Step>
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
  // The server records why a round ended early (e.g. a plan over the safety limit); show it under the plain sentence.
  const reason = v.you.signed ? [...v.round.history].reverse().find((h) => h.state === s)?.reason : null;
  return (
    <Step v={v} mood="info" title={title} body={body} panel={<ButtonLink href={`/circles/${v.circle.id}`} variant="secondary" block>{d.round.backToCircle}</ButtonLink>}>
      {reason && <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-ink-2">{fmt(d.round.endedReason, { reason })}</p>}
    </Step>
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
    <Step
      v={v}
      mood="todo"
      title={d.round.approveTitle}
      body={fmt(d.round.approveBody, { time: deadline })}
      panel={
        <>
          {unfunded.length > 0 && <ErrorNote>{fmt(d.round.unfunded, { list: unfunded.map((a) => a.symbol).join(", ") })}</ErrorNote>}
          <WalletPromptPreview prompts={prompts} sponsored={v.gasSponsored} />
          <ActionStatus status={act.status} />
          {act.error && <ErrorNote>{act.error}</ErrorNote>}
          <Cta>
            <Button size="lg" busy={act.pending} disabled={unfunded.length > 0} onClick={() => act.run(async (say) => { await sama.approveAndAllow(v, signer, say, progressWords(d)); await refresh(); })}>{d.round.approveAllow}</Button>
          </Cta>
        </>
      }
    >
      <Stats>
        <Stat label={d.round.matchedShare} value={requested > 0 ? percent((sentUsd / requested) * 100, locale, 0) : "—"} tone="match" />
        <Stat label={d.round.leftover} value={usd(Math.max(0, requested - sentUsd), locale, 0)} tone="rest" />
      </Stats>
      <TokenList title={d.round.yourTransfers}><LegRows v={v} /></TokenList>
      <More summary={d.round.authorizing}>{fmt(d.round.authorizingBody, { time: deadline })}</More>
    </Step>
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

  const rail = (
    <ol className="grid gap-5">
      <RailStep done={allApproved} active={!allApproved} title={d.round.rail.approvals} detail={fmt(d.common.of, { a: v.aggregate.approvals, b: v.aggregate.participants })} />
      <RailStep done={v.you.approved && v.you.allowances.every((a) => a.sufficient)} active={false} title={d.round.rail.allowance} />
      <RailStep done={sent} active={allApproved && !sent && !ready} failed={s === "SETTLEMENT_REVERTED"} title={d.round.rail.tx} detail={v.round.settlementTx ? <TxLink hash={v.round.settlementTx} /> : null} />
      <RailStep done={v9?.status === "PASS"} active={sent && !v9} failed={s === "VERIFICATION_FAILED"} title={<Term k="verifier">{d.round.rail.verify}</Term>} detail={v9 ? fmt(d.round.verified, { a: v9.checks.filter((c) => c.status === "PASS").length, b: v9.checks.length }) : null} />
    </ol>
  );

  return (
    <Step
      v={v}
      mood={mood}
      title={title}
      body={body}
      panel={
        ready ? (
          <>
            <WalletPromptPreview prompts={[{ kind: "tx", label: d.round.promptSettle }]} sponsored={v.gasSponsored} />
            <ActionStatus status={act.status} />
            {act.error && <ErrorNote>{act.error}</ErrorNote>}
            <Cta>
              <Button size="lg" busy={act.pending} onClick={() => act.run(async (say) => { await sama.settle(v, signer, say, progressWords(d)); await refresh(); })}>{d.round.sendSettlement}</Button>
            </Cta>
          </>
        ) : (
          rail
        )
      }
    >
      {ready && rail}
      <More summary={d.round.yourTransfers}><ul className="grid grid-cols-1 divide-y divide-line"><LegRows v={v} /></ul></More>
    </Step>
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

  if (real.length === 0) return <Step v={v} mood={noCross ? "info" : "done"} title={noCross ? d.round.noCrossTitle : d.round.doneTitle} body={v.you.residual.length ? d.round.dustOnly : d.round.nothingLeft} panel={<ButtonLink href={`/circles/${v.circle.id}`} variant="secondary" block>{d.round.backToCircle}</ButtonLink>} />;

  const choices: Choice[] = rec?.canExecute ? ["carry", "swap", "drop"] : ["carry", "drop"];
  const confirm = () =>
    act.run(async (say) => {
      if (picked === "swap") await sama.swapResidual(v, signer, say, progressWords(d));
      else await sama.decideResidual(v, picked === "carry" ? "CARRY_FORWARD" : "CANCEL");
      await refresh();
    });

  return (
    <Step
      v={v}
      mood="todo"
      title={noCross ? d.round.noCrossTitle : d.round.leftoverTitle}
      body={fmt(d.round.leftoverBody, { amount: usd(real.reduce((s, r) => s + r.valueUsd, 0), locale, 0) })}
      panel={
        <>
          {/* One compact list: radio dot · title (+ small "Recommended") · one line of what it means. The reason for the
              recommendation sits once under the list instead of inside a card. */}
          <fieldset className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-2xl border border-line">
            <legend className="sr-only">{d.round.leftoverTitle}</legend>
            {choices.map((key) => {
              const [title, body] = d.round.choices[key];
              const on = picked === key;
              return (
                <label key={key} className={cx("flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors", on ? "bg-accent-soft/60" : "hover:bg-surface-2", act.pending && "pointer-events-none opacity-60")}>
                  <input type="radio" name="leftover" value={key} checked={on} onChange={() => setPicked(key)} className="sr-only" />
                  <span className={cx("grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors", on ? "border-accent" : "border-line-strong")} aria-hidden="true">
                    <span className={cx("size-2.5 rounded-full bg-accent transition-transform", on ? "scale-100" : "scale-0")} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-semibold text-ink">{title}</span>
                      {key === recommended && <span className="shrink-0 rounded-md bg-accent/15 px-1.5 py-0.5 text-[11px] font-semibold text-accent">{d.round.recommended}</span>}
                    </span>
                    <span className="block text-sm leading-snug text-ink-3">
                      {body}
                      {key === "swap" && rec?.costPct != null && <span className="num"> · ≈ {percent(rec.costPct, locale)}</span>}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          {rec && rec.reasons.length > 0 && <p className="text-xs leading-relaxed text-ink-3">{rec.reasons.join(" ")}</p>}
          <ActionStatus status={act.status} />
          {act.error && <ErrorNote>{act.error}</ErrorNote>}
          <Cta>
            <Button size="lg" busy={act.pending} onClick={confirm}>{d.round.confirmChoice}</Button>
          </Cta>
        </>
      }
    >
      <TokenList title={d.round.leftover}>
        {real.map((r) => <AmountRow key={r.symbol + r.side} direction={r.side} amount={r.amountTokens} symbol={r.symbol} usdValue={r.valueUsd} label={r.side === "SELL" ? d.round.stillSell : d.round.stillBuy} />)}
      </TokenList>
    </Step>
  );
}

function DoneStep({ v }: { v: RoundView }) {
  const { d, fmt, locale } = useI18n();
  const total = (dir: "SEND" | "RECEIVE") => usd(v.you.legs.filter((l) => l.direction === dir).reduce((s, l) => s + l.valueUsd, 0), locale);
  return (
    <Step
      v={v}
      mood="done"
      title={d.round.doneTitle}
      body={v.you.legs.length ? fmt(d.round.doneBody, { sent: total("SEND"), received: total("RECEIVE") }) : d.receipt.nothing}
      panel={<ReceiptSummary v={v} compact />}
    >
      {v.you.legs.length > 0 && (
        <>
          <Stats>
            <Stat label={d.round.totalSent} value={total("SEND")} tone="rest" />
            <Stat label={d.round.totalReceived} value={total("RECEIVE")} tone="match" />
          </Stats>
          <TokenList title={d.round.yourTransfers}><LegRows v={v} /></TokenList>
        </>
      )}
    </Step>
  );
}

/** Everything a member might want to double-check, folded into one row at the bottom of the page. */
function RoundDetails({ v }: { v: RoundView }) {
  const { d, fmt, locale } = useI18n();
  const ver = v.round.verification;
  const hash = (h: string) => <span className="num" title={h}>{short(h, 10, 6)}</span>;
  return (
    <details className="group mt-10 border-t border-line">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 py-4 text-lg font-semibold tracking-tight text-ink [&::-webkit-details-marker]:hidden">
        {d.round.details}
        <IconChevronRight size={20} className="shrink-0 text-ink-3 transition-transform group-open:rotate-90" />
      </summary>
      <div className="grid gap-8 pb-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-ink-3">{d.round.prices}</p>
          <ul className="grid grid-cols-1 divide-y divide-line">
            {v.round.prices.map((p) => (
              <li key={p.symbol} className="flex items-center justify-between gap-3 py-3">
                <span className="flex min-w-0 items-center gap-3">
                  <AssetIcon symbol={p.symbol} size={28} />
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">{p.symbol}</span>
                    {p.source && <span className="block truncate text-xs text-ink-3">{d.round.priceSource[p.source]}{p.uiMultiplier && Math.abs(p.uiMultiplier - 1) > 1e-9 ? ` · ${fmt(d.round.multiplier, { m: p.uiMultiplier.toFixed(4) })}` : ""}</span>}
                  </span>
                </span>
                <span className="num shrink-0 font-medium text-ink">{usd(p.priceUsd, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid content-start grid-cols-1 divide-y divide-line">
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
  );
}

function Fact({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-[15px]">
      <dt className="text-ink-3">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}
