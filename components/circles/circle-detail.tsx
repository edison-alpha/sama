"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconArrowRight, IconCopy, IconShare } from "@/components/icons";
import { Badge, stateTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { EmptyState, ErrorNote, PageSkeleton } from "@/components/ui/states";
import { Term } from "@/components/ui/term";
import { sama } from "@/lib/api";
import { useAction, useApi } from "@/lib/api/use-api";
import { cadence, duration } from "@/lib/circle-words";
import { dateTime, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { Stagger } from "@/components/motion";

export function CircleDetail({ id }: { id: string }) {
  const { d, fmt, locale } = useI18n();
  const router = useRouter();
  const { data: c, error, refresh } = useApi(() => sama.circle(id), [id], { pollMs: 10_000 });
  const act = useAction();
  const [invite, setInvite] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!c) return error ? <ErrorNote>{error}</ErrorNote> : <PageSkeleton />;

  const live = c.liveRound;
  // One contextual primary action (PRD §19.4.5): join → go to round → start a round (organizer, on demand).
  const primary = !c.role ? (
    <Button size="lg" busy={act.pending} onClick={() => act.run(async () => { await sama.joinCircle(c.id); await refresh(); })}>{d.circles.join}</Button>
  ) : live ? (
    <Button size="lg" trailing={<IconArrowRight size={18} />} onClick={() => router.push(`/rounds/${live.id}`)}>{d.circles.enterRound}</Button>
  ) : c.role === "ORGANIZER" ? (
    <Button size="lg" busy={act.pending} onClick={() => act.run(async () => { const { roundId } = await sama.openRound(c.id); router.push(`/rounds/${roundId}`); })}>{d.circles.openRound}</Button>
  ) : null;

  const makeInvite = () =>
    act.run(async () => {
      const { url } = await sama.invite(c.id);
      setInvite(url);
      await navigator.clipboard?.writeText(url).then(() => setCopied(true), () => {});
    });

  const shareText = encodeURIComponent(`${c.name} — Sama`);

  return (
    <Stagger>
      <PageHeader title={c.name} sub={c.description} actions={primary} />
      {act.error && <div className="mb-4"><ErrorNote>{act.error}</ErrorNote></div>}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title={d.circles.history} />
          {c.history.length === 0 ? (
            <EmptyState title={d.circles.noHistory} />
          ) : (
            <ul className="divide-y divide-line">
              {c.history.map((h) => (
                <li key={h.id}>
                  <Link href={`/rounds/${h.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-accent">
                    <span>
                      <span className="font-medium">{fmt(d.round.crumb, { seq: h.sequence })}</span>
                      <span className="block text-xs text-ink-3">{dateTime(h.endedAt, locale)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {h.crossedUsd > 0 && <span className="num text-sm text-match">{fmt(d.circles.crossed, { amount: usd(h.crossedUsd, locale, 0) })}</span>}
                      <Badge tone={stateTone(h.state)}>{d.states[h.state]}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid content-start gap-6">
          <Card tone="soft">
            <CardHeader title={<><Term k="circle">{d.circles.rules}</Term></>} />
            <dl className="grid gap-3 text-sm">
              <Row k={d.circles.assets} v={<span className="flex flex-wrap justify-end gap-1">{c.assetSymbols.map((s) => <span key={s} className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium">{s}</span>)}</span>} />
              <Row k={d.circles.schedule} v={cadence(c.cadenceSec, d, locale)} />
              <Row k={d.circles.window} v={duration(c.durationSec, locale)} />
              <Row k={d.circles.leftovers} v={d.portfolio.residualStyles[c.residualBehavior]} />
              <Row k={d.circles.visibility[c.visibility]} v={fmt(d.circles.members, { n: c.memberCount })} />
            </dl>
            <p className="mt-4 text-xs text-ink-3">{fmt(d.circles.minPeople, { n: c.minParticipants })}</p>
          </Card>

          {c.role === "ORGANIZER" && (
            <Card>
              <CardHeader title={d.circles.invite} />
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" icon={<IconCopy size={18} />} onClick={makeInvite} busy={act.pending}>{copied ? d.common.copied : d.circles.invite}</Button>
                {invite && (
                  <>
                    <a className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium hover:bg-surface-2" href={`https://t.me/share/url?url=${encodeURIComponent(invite)}&text=${shareText}`} target="_blank" rel="noreferrer"><IconShare size={16} />{d.circles.shareTelegram}</a>
                    <a className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium hover:bg-surface-2" href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(invite)}`} target="_blank" rel="noreferrer"><IconShare size={16} />{d.circles.shareWhatsapp}</a>
                  </>
                )}
              </div>
              {copied && <p className="mt-3 text-sm text-ok">{d.circles.inviteCopied}</p>}
            </Card>
          )}
        </div>
      </div>
    </Stagger>
  );
}

function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-ink-3">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
