"use client";

import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/card";
import { ErrorNote, PageSkeleton } from "@/components/ui/states";
import { sama } from "@/lib/api";
import { useApi } from "@/lib/api/use-api";
import { useI18n } from "@/lib/i18n/provider";
import { ReceiptSummary, VerifierChecks } from "./receipt";
import { Stagger } from "@/components/motion";

export function ReceiptPage({ roundId }: { roundId: string }) {
  const { d, fmt } = useI18n();
  const { data: v, error } = useApi(() => sama.round(roundId), [roundId]);
  if (!v) return error ? <ErrorNote>{error}</ErrorNote> : <PageSkeleton />;
  return (
    <Stagger>
      <PageHeader title={d.receipt.title} sub={<Link href={`/rounds/${v.round.id}`} className="hover:text-accent">{v.circle.name} · {fmt(d.round.crumb, { seq: v.round.sequence })}</Link>} />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card><ReceiptSummary v={v} /></Card>
        <VerifierChecks v={v} />
      </div>
      <p className="mt-6 text-xs text-ink-3">{d.common.notInvestmentAdvice}</p>
    </Stagger>
  );
}
