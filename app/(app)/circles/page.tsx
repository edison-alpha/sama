"use client";

import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { CircleCard } from "@/components/circles/circle-card";
import { CreateCircleModal } from "@/components/circles/create-circle-modal";
import { LocaleButton } from "@/components/shell/preferences";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState, ErrorNote, PageSkeleton } from "@/components/ui/states";
import { sama } from "@/lib/api";
import { useApi } from "@/lib/api/use-api";
import { useI18n } from "@/lib/i18n/provider";
import { Stagger, rise } from "@/components/motion";
import { m } from "motion/react";

export default function CirclesPage() {
  const { d } = useI18n();
  const { data, error } = useApi(() => sama.circles(), [], { pollMs: 10_000 });
  const [tab, setTab] = useState<"mine" | "explore">("mine");
  const [creating, setCreating] = useState(false);
  // Home's new-Circle tile and the old /circles/new route land here with ?create=1.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("create") === "1") {
      setCreating(true);
      window.history.replaceState(null, "", "/circles");
    }
  }, []);
  if (!data) return error ? <ErrorNote>{error}</ErrorNote> : <PageSkeleton />;

  const mine = data.filter((c) => c.role);
  const explore = data.filter((c) => !c.role);
  const list = tab === "mine" ? mine : explore;
  const createButton = <Button icon={<Icon icon="fa7-solid:add" width={16} height={16} aria-hidden="true" />} onClick={() => setCreating(true)}>{d.circles.create}</Button>;

  return (
    <Stagger>
      {/* Phones get the app's own header (the global top bar is hidden there, see app-shell.tsx's TopBar):
          a centred title, styled like Activity's mobile header, with the locale switch on the right. */}
      <m.header variants={rise} className="grid grid-cols-[44px_1fr_44px] items-center pt-2 sm:hidden">
        <span />
        <h1 className="text-center text-xl font-bold tracking-tight text-ink">{d.circles.title}</h1>
        <span className="justify-self-end"><LocaleButton /></span>
      </m.header>

      {/* Desktop carries the page title, the lead line and the action in one row instead. */}
      <m.header variants={rise} className="mb-6 hidden sm:flex sm:items-end sm:justify-between sm:gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">{d.circles.title}</h1>
          <p className="mt-1 text-ink-2">{d.circles.lead}</p>
        </div>
        {createButton}
      </m.header>

      <m.div variants={rise} className="mt-5 mb-5 flex items-center justify-between gap-3 sm:mt-0">
        <Segmented label={d.circles.title} value={tab} onChange={setTab} options={[{ value: "mine", label: `${d.circles.mine} (${mine.length})` }, { value: "explore", label: `${d.circles.explore} (${explore.length})` }]} />
        {/* Compact circular twin of createButton: the tabs already take most of a phone's width, so the labelled
            button (fine on desktop, where it has its own row) would wrap here. */}
        <button
          type="button"
          onClick={() => setCreating(true)}
          aria-label={d.circles.create}
          title={d.circles.create}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/92 text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] backdrop-blur-md transition-[background-color,transform] duration-150 hover:bg-accent-strong/92 active:scale-[0.97] sm:hidden"
        >
          <Icon icon="fa7-solid:add" width={18} height={18} aria-hidden="true" />
        </button>
      </m.div>

      {list.length === 0 ? (
        <EmptyState title={d.circles.noneMine} action={<button type="button" className="text-sm font-medium text-accent" onClick={() => setTab("explore")}>{d.circles.explore} →</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map((c) => <CircleCard key={c.id} circle={c} />)}</div>
      )}
      <CreateCircleModal open={creating} onClose={() => setCreating(false)} />
    </Stagger>
  );
}
