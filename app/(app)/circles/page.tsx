"use client";

import { useState } from "react";
import { CircleCard } from "@/components/circles/circle-card";
import { IconPlus } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState, ErrorNote, PageSkeleton } from "@/components/ui/states";
import { sama } from "@/lib/api";
import { useApi } from "@/lib/api/use-api";
import { useI18n } from "@/lib/i18n/provider";
import { Stagger } from "@/components/motion";

export default function CirclesPage() {
  const { d } = useI18n();
  const { data, error } = useApi(() => sama.circles(), [], { pollMs: 10_000 });
  const [tab, setTab] = useState<"mine" | "explore">("mine");
  if (!data) return error ? <ErrorNote>{error}</ErrorNote> : <PageSkeleton />;

  const mine = data.filter((c) => c.role);
  const explore = data.filter((c) => !c.role && c.visibility !== "PRIVATE");
  const list = tab === "mine" ? mine : explore;

  return (
    <Stagger>
      <PageHeader title={d.circles.title} sub={d.circles.lead} actions={<ButtonLink href="/circles/new" icon={<IconPlus size={18} />}>{d.circles.create}</ButtonLink>} />

      <Segmented label={d.circles.title} value={tab} onChange={setTab} options={[{ value: "mine", label: `${d.circles.mine} (${mine.length})` }, { value: "explore", label: `${d.circles.explore} (${explore.length})` }]} className="mb-5" />
      {list.length === 0 ? (
        <EmptyState title={d.circles.noneMine} action={<button type="button" className="text-sm font-medium text-accent" onClick={() => setTab("explore")}>{d.circles.explore} →</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">{list.map((c) => <CircleCard key={c.id} circle={c} />)}</div>
      )}
    </Stagger>
  );
}
