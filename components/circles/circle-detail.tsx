"use client";

import { m } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AssetIcon, AssetStack as Stack } from "@/components/asset-icon";
import { IconArrowLeft, IconArrowRight, IconCalendar, IconChevronRight, IconCircles, IconClock, IconCopy, IconLayers, IconPlay, IconShare, IconShield, IconSwap, IconUsers } from "@/components/icons";
import { Stagger, rise } from "@/components/motion";
import { Badge, stateTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListRow, ListSection } from "@/components/ui/list";
import { Money } from "@/components/ui/money";
import { EmptyState, ErrorNote, PageSkeleton } from "@/components/ui/states";
import { sama } from "@/lib/api";
import type { Circle } from "@/lib/api/types";
import { useAction, useApi } from "@/lib/api/use-api";
import { cadence, duration } from "@/lib/circle-words";
import { clock, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";
import { forgetInvite, pendingInvite } from "./invite-landing";

/**
 * Circle detail laid out like a token page on a DEX. Web: breadcrumb, identity row, the headline number, stats grid,
 * about + links and a past-rounds table on the left, with the round panel on the right where a swap box would be.
 * Phones: the same content as one column with list-style stats and the main action pinned above the tab bar.
 */
export function CircleDetail({ id }: { id: string }) {
  const { d, fmt, locale } = useI18n();
  const router = useRouter();
  const { data: c, error, refresh } = useApi(() => sama.circle(id), [id], { pollMs: 10_000 });
  const act = useAction();
  const [invite, setInvite] = useState<string | null>(null);
  const [copied, setCopied] = useState<"invite" | "link" | null>(null);
  const [typedCode, setTypedCode] = useState("");
  const now = useNow();

  if (!c) return error ? <ErrorNote>{error}</ErrorNote> : <PageSkeleton />;

  const cd = d.circles.detail;
  const live = c.liveRound;
  const matched = c.history.reduce((s, h) => s + h.crossedUsd, 0);
  const tag = locale === "id" ? "id-ID" : "en-US";
  const ended = new Intl.DateTimeFormat(tag, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  // One contextual primary action (PRD §19.4.5): join → go to round → start a round (organizer, on demand).
  // Invite-only circles need the code from the invite link (kept in the URL or, across sign-in, in session storage).
  const join = () =>
    act.run(async () => {
      const code = typedCode.trim() || pendingInvite(c.id, new URLSearchParams(window.location.search).get("invite"));
      if (c.visibility !== "PUBLIC" && !code) throw new Error(d.invite.needed);
      await sama.joinCircle(c.id, code);
      forgetInvite(c.id);
      await refresh();
    });
  const primary: { label: string; run: () => void } | null = !c.role
    ? { label: d.circles.join, run: join }
    : live
      ? { label: d.circles.enterRound, run: () => router.push(`/rounds/${live.id}`) }
      : c.role === "ORGANIZER"
        ? { label: d.circles.openRound, run: () => act.run(async () => { const { roundId } = await sama.openRound(c.id); router.push(`/rounds/${roundId}`); }) }
        : null;

  const makeInvite = () =>
    act.run(async () => {
      const { url } = await sama.invite(c.id);
      setInvite(url);
      await navigator.clipboard?.writeText(url).then(() => setCopied("invite"), () => {});
    });
  const copyLink = () => void navigator.clipboard?.writeText(window.location.href).then(() => { setCopied("link"); window.setTimeout(() => setCopied(null), 1500); }, () => {});
  const shareText = encodeURIComponent(`${c.name} — Sama`);
  const status = live ? (
    <>
      <Badge tone={stateTone(live.state)} dot>{d.states[live.state]}</Badge>
      <span className="tabular-nums text-sm text-ink-2">{fmt(d.circles.closesIn, { time: clock(live.freezesAt - now) })}</span>
    </>
  ) : (
    <span className="text-sm text-ink-3">{c.nextRoundAt ? fmt(cd.next, { when: ended.format(new Date(c.nextRoundAt)) }) : cd.noLive}</span>
  );

  const stats: Array<{ icon: ReactNode; label: string; value: string }> = [
    { icon: <IconUsers size={22} />, label: d.circles.visibility[c.visibility], value: fmt(d.circles.members, { n: c.memberCount }) },
    { icon: <IconCalendar size={22} />, label: d.circles.schedule, value: cadence(c.cadenceSec, d, locale) },
    { icon: <IconClock size={22} />, label: d.circles.window, value: duration(c.durationSec, locale) },
    { icon: <IconCircles size={22} />, label: d.circles.new.minPeople, value: String(c.minParticipants) },
    { icon: <IconLayers size={22} />, label: d.circles.leftovers, value: d.portfolio.residualStyles[c.residualBehavior] },
    { icon: <IconShield size={22} />, label: d.circles.new.who, value: d.circles.visibility[c.visibility] },
  ];

  const links = (
    <div className="flex flex-wrap gap-2">
      {c.role === "ORGANIZER" && (
        <button type="button" onClick={makeInvite} className={pill}><IconUsers size={18} />{copied === "invite" ? d.common.copied : d.circles.invite}</button>
      )}
      {invite && (
        <>
          <a className={pill} href={`https://t.me/share/url?url=${encodeURIComponent(invite)}&text=${shareText}`} target="_blank" rel="noreferrer"><IconShare size={18} />Telegram</a>
          <a className={pill} href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(invite)}`} target="_blank" rel="noreferrer"><IconShare size={18} />WhatsApp</a>
        </>
      )}
      <button type="button" onClick={copyLink} className={pill}><IconCopy size={18} />{copied === "link" ? cd.copied : cd.copyLink}</button>
      <Link href="/docs" className={pill}><IconPlay size={18} />{d.nav.learn}</Link>
    </div>
  );

  return (
    <Stagger>
      {/* Phones: back · share, like an app screen. Web: a breadcrumb. */}
      <m.div variants={rise} className="mb-4 flex items-center justify-between md:hidden">
        <button type="button" onClick={() => router.push("/circles")} aria-label={d.activity.detail.back} className="glass-panel grid size-11 place-items-center rounded-full text-ink transition-[filter] hover:brightness-95"><IconArrowLeft size={22} /></button>
        <button type="button" onClick={copyLink} aria-label={cd.copyLink} className="glass-panel grid size-11 place-items-center rounded-full text-ink-2 transition-[filter] hover:brightness-95"><IconShare size={20} /></button>
      </m.div>
      <m.nav variants={rise} aria-label="Breadcrumb" className="mb-6 hidden items-center gap-1 text-[15px] md:flex">
        <Link href="/circles" className="text-ink-3 hover:text-ink">{d.circles.title}</Link>
        <IconChevronRight size={16} className="text-ink-3" />
        <span className="truncate font-medium text-ink">{c.name}</span>
      </m.nav>

      <m.header variants={rise} className="flex items-center justify-between gap-4 border-line md:border-b md:pb-6">
        <div className="flex min-w-0 items-center gap-4">
          <AssetStack symbols={c.assetSymbols} />
          <div className="min-w-0">
            <h1 className="line-clamp-2 text-xl font-semibold leading-tight tracking-tight text-ink md:truncate md:text-3xl">{c.name}</h1>
            <p className="truncate text-sm text-ink-3 md:text-base">{d.circles.visibility[c.visibility]} · {fmt(d.circles.members, { n: c.memberCount })}</p>
          </div>
        </div>
        <button type="button" onClick={copyLink} aria-label={cd.copyLink} title={cd.copyLink} className="hidden size-11 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink md:grid"><IconShare size={20} /></button>
      </m.header>

      {act.error && <div className="mt-4"><ErrorNote>{act.error}</ErrorNote></div>}

      <div className="mt-6 grid gap-10 md:mt-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <m.section variants={rise} aria-label={cd.matched}>
            <p className="text-sm font-medium text-ink-3">{cd.matched}</p>
            <p className="mt-1 text-[40px] font-semibold leading-none tracking-[-0.03em] text-ink md:text-5xl">
              <Money value={matched} locale={locale} className="tabular-nums" />
            </p>
            <p className="mt-2 text-sm font-medium text-ink-2 md:text-base">{fmt(cd.across, { n: c.history.length })}</p>
          </m.section>

          {/* Phones: the round card sits right under the number, like the "Earn" card on a token screen. */}
          <m.div variants={rise} className="mt-6 lg:hidden">
            <RoundCard c={c} status={status} onOpen={live ? () => router.push(`/rounds/${live.id}`) : undefined} title={cd.live} />
          </m.div>

          <m.section variants={rise} className="mt-8 md:mt-10" aria-labelledby="circle-stats">
            <h2 id="circle-stats" className="text-lg font-semibold tracking-tight text-ink md:text-2xl">{cd.stats}</h2>
            <ul className="mt-2 grid grid-cols-1 md:hidden">
              {stats.map((s) => <ListRow key={s.label} icon={s.icon} label={s.label} value={s.value} />)}
            </ul>
            <dl className="mt-5 hidden grid-cols-3 gap-x-6 gap-y-7 md:grid">
              {stats.map((s) => (
                <div key={s.label} className="min-w-0">
                  <dt className="truncate text-sm text-ink-3">{s.label}</dt>
                  <dd className="mt-1 truncate text-2xl font-semibold tracking-tight text-ink">{s.value}</dd>
                </div>
              ))}
            </dl>
          </m.section>

          <m.section variants={rise} className="mt-8 md:mt-10" aria-labelledby="circle-about">
            <h2 id="circle-about" className="text-lg font-semibold tracking-tight text-ink md:text-2xl">{cd.about}</h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2 md:text-base">{c.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.assetSymbols.map((s) => (
                <span key={s} className="inline-flex h-9 items-center gap-2 rounded-full bg-surface-2 pl-1.5 pr-3 text-sm font-medium text-ink"><AssetIcon symbol={s} size={24} />{s}</span>
              ))}
            </div>
          </m.section>

          <m.section variants={rise} className="mt-8" aria-labelledby="circle-links">
            <h2 id="circle-links" className="text-lg font-semibold tracking-tight text-ink md:sr-only">{cd.links}</h2>
            <div className="mt-3 md:mt-0">{links}</div>
          </m.section>

          <m.section variants={rise} className="mt-10" aria-labelledby="circle-history">
            <h2 id="circle-history" className="text-lg font-semibold tracking-tight text-ink md:text-2xl">{d.circles.history}</h2>
            {c.history.length === 0 ? (
              <div className="mt-4"><EmptyState title={d.circles.noHistory} /></div>
            ) : (
              <>
                <ul className="mt-2 grid grid-cols-1 md:hidden">
                  {c.history.map((h) => (
                    <ListRow key={h.id} icon={<IconSwap size={22} />} label={fmt(d.round.crumb, { seq: h.sequence })} sub={ended.format(new Date(h.endedAt))} value={h.crossedUsd > 0 ? usd(h.crossedUsd, locale, 0) : d.states[h.state]} href={`/rounds/${h.id}`} />
                  ))}
                </ul>
                <table className="mt-4 hidden w-full border-separate border-spacing-0 md:table">
                  <thead>
                    <tr>
                      {[cd.table.round, cd.table.status, cd.table.matched, cd.table.ended].map((h, i) => (
                        <th key={h} scope="col" className={cx("bg-surface-2 px-4 py-3.5 text-sm font-medium text-ink-3 first:rounded-l-2xl last:rounded-r-2xl", i >= 2 ? "text-right" : "text-left")}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {c.history.map((h) => (
                      <tr key={h.id} onClick={() => router.push(`/rounds/${h.id}`)} className="cursor-pointer transition-colors hover:bg-surface-2/60 [&>td]:border-b [&>td]:border-line last:[&>td]:border-0">
                        <td className="px-4 py-4"><Link href={`/rounds/${h.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-ink hover:underline">{fmt(d.round.crumb, { seq: h.sequence })}</Link></td>
                        <td className="px-4 py-4"><Badge tone={stateTone(h.state)}>{d.states[h.state]}</Badge></td>
                        <td className="tabular-nums px-4 py-4 text-right font-medium text-ink">{h.crossedUsd > 0 ? usd(h.crossedUsd, locale, 0) : "—"}</td>
                        <td className="tabular-nums px-4 py-4 text-right text-ink-2">{ended.format(new Date(h.endedAt))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </m.section>
        </div>

        {/* Web: the round panel stays in view on the right, where a DEX puts its swap box. */}
        <m.aside variants={rise} className="hidden lg:block">
          <div className="sticky top-6 grid gap-3 rounded-[24px] border border-line bg-surface p-5">
            <p className="text-sm font-medium text-ink-3">{cd.live}</p>
            {live ? (
              <p className="text-2xl font-semibold tracking-tight text-ink">{fmt(d.round.crumb, { seq: live.sequence })}</p>
            ) : (
              <p className="text-lg font-semibold text-ink">{d.circles.title}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">{status}</div>
            <div className="mt-2 rounded-2xl bg-surface-2 p-4">
              <p className="text-sm text-ink-3">{d.circles.assets}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {c.assetSymbols.map((s) => <span key={s} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink"><AssetIcon symbol={s} size={20} />{s}</span>)}
              </div>
            </div>
            {!c.role && c.visibility !== "PUBLIC" && (
              <label className="grid gap-1.5">
                <span className="text-sm text-ink-3">{d.invite.codeLabel}</span>
                <input value={typedCode} onChange={(e) => setTypedCode(e.target.value)} placeholder={d.invite.codePlaceholder} autoComplete="off" className="h-12 w-full rounded-2xl bg-surface-2 px-4 text-ink outline-none placeholder:text-ink-3" />
              </label>
            )}
            {primary && <Button size="lg" block busy={act.pending} trailing={live ? <IconArrowRight size={18} /> : undefined} onClick={primary.run}>{primary.label}</Button>}
            <p className="text-center text-xs text-ink-3">{fmt(d.circles.minPeople, { n: c.minParticipants })}</p>
          </div>
        </m.aside>
      </div>

      {/* Phones: the main action pinned above the tab bar, like "Buy with cash" on a token screen. */}
      {primary && (
        <>
          {/* No tab bar sits under this route (see app-shell.tsx), so the button rests on the safe area itself. */}
          <div className="h-24 md:hidden" aria-hidden="true" />
          <div className="fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-30 md:hidden">
            <Button size="lg" block busy={act.pending} trailing={live ? <IconArrowRight size={18} /> : undefined} onClick={primary.run} className="h-14 text-base">{primary.label}</Button>
          </div>
        </>
      )}
    </Stagger>
  );
}

const pill = "inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2";

/** Up to three asset logos overlapping, as the Circle's "token icon". */
function AssetStack({ symbols }: { symbols: string[] }) {
  return (
    <>
      <Stack symbols={symbols} size={36} max={3} className="md:hidden" />
      <Stack symbols={symbols} size={44} max={3} className="hidden md:flex" />
    </>
  );
}

function RoundCard({ c, status, onOpen, title }: { c: Circle; status: ReactNode; onOpen?: () => void; title: string }) {
  const { d, fmt } = useI18n();
  const body = (
    <>
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent"><IconSwap size={24} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-ink">{c.liveRound ? fmt(d.round.crumb, { seq: c.liveRound.sequence }) : title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-2">{status}</span>
      </span>
      {onOpen && <IconChevronRight size={20} className="shrink-0 text-ink-3" />}
    </>
  );
  const cls = "flex w-full items-center gap-3 rounded-[20px] border border-line p-4 text-left";
  return onOpen ? <button type="button" onClick={onOpen} className={cx(cls, "transition-colors active:bg-surface-2")}>{body}</button> : <div className={cls}>{body}</div>;
}

function useNow() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}
