import { ChartPlotSkeleton } from "@/components/market/chart-skeleton";
import { cx } from "@/utils/cx";
import { Bar, Disc, Line, Pill, SkeletonRoot, TokenListSkeleton, WalletHeaderSkeleton } from "./parts";

/** Home while it loads: the same blocks in the same places as app/(app)/home/page.tsx, on phones and on desktop. */
export function HomeSkeleton() {
  return (
    <SkeletonRoot>
      <WalletHeaderSkeleton />

      <section className="grid gap-6 sm:gap-8 xl:grid-cols-[1fr_340px]">
        {/* ValueChart: hero number, change, status line, then (from sm) the plot and range pills. */}
        <div className="min-w-0">
          <span className="flex h-[44px] items-center sm:h-[60px]"><Bar className="h-9 w-48 rounded-xl sm:h-12 sm:w-64" /></span>
          <span className="mt-2 flex h-5 items-center sm:h-6"><Bar className="h-3.5 w-40" /></span>
          <Line lh={20} h={12} w={176} className="mt-1" />
          <div className="mt-6 hidden sm:block"><ChartPlotSkeleton /></div>
          <Pill w={274} h={42} className="mt-4 hidden border border-line bg-transparent sm:block" />
        </div>

        {/* Quick actions: a scroller of five tiles on phones, four tiles from sm, two columns on xl. */}
        <div className="-mx-4 flex gap-3 overflow-hidden sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible xl:mt-36 xl:grid-cols-2 xl:content-start">
          <span className="w-4 shrink-0 sm:hidden" />
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={cx("flex h-24 w-32 shrink-0 flex-col justify-between rounded-[20px] bg-surface-2 p-4 sm:h-28 sm:w-auto", i === 3 && "sm:hidden")}>
              <Disc size={22} />
              <Bar className="h-4 w-16" />
            </span>
          ))}
          <span className="w-4 shrink-0 sm:hidden" />
        </div>
      </section>

      {/* NextStepCard: a tap-through card on phones, a slim banner with a button from sm. */}
      <div className="mt-6 sm:mt-8">
        <div className="flex gap-3 rounded-[20px] border border-line bg-surface-2/60 p-4 sm:hidden">
          <Disc size={22} className="mt-0.5" />
          <span className="min-w-0 flex-1">
            <Line lh={24} h={15} w="72%" />
            <Line lh={20} h={11} w="94%" className="mt-1" />
            <Line lh={20} h={11} w="60%" />
            <Line lh={20} h={12} w={84} className="mt-2" />
          </span>
        </div>
        <div className="hidden items-center gap-5 rounded-[24px] border border-line bg-surface-2/60 p-5 sm:flex">
          <div className="min-w-0 flex-1">
            <Line lh={16} h={9} w={80} />
            <Line lh={28} h={16} w="42%" className="mt-1" />
            <Line lh={20} h={11} w="64%" className="mt-0.5" />
          </div>
          <Pill w={150} h={44} />
        </div>
      </div>

      <div className="mt-8 grid gap-10 sm:mt-10 sm:border-t sm:border-line sm:pt-10 xl:grid-cols-[1fr_340px]">
        <section className="min-w-0">
          <div className="mb-4">
            <Line lh={28} h={18} w={84} />
            <Line lh={20} h={11} w={70} className="mt-0.5" />
          </div>
          <TokenListSkeleton compact rows={6} />
        </section>

        {/* Rounds and recent activity only exist from sm. */}
        <div className="hidden content-start gap-10 sm:grid">
          <section>
            <Line lh={28} h={18} w={120} className="mb-4" />
            {[0, 1].map((i) => <SideRow key={i} />)}
          </section>
          <section>
            <div className="mb-4">
              <Line lh={28} h={18} w={140} />
              <Line lh={20} h={11} w={96} className="mt-0.5" />
            </div>
            {[0, 1, 2, 3].map((i) => <SideRow key={i} time />)}
            <Pill w={148} h={40} className="mt-4 border border-line bg-transparent" />
          </section>
        </div>
      </div>
    </SkeletonRoot>
  );
}

/** A row of the rounds / recent lists (ActivityRow): square chip, two lines, then a time or badge. */
function SideRow({ time = false }: { time?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="block size-9 shrink-0 rounded-xl bg-surface-3" />
      <span className="min-w-0 flex-1">
        <Line lh={20} h={12} w="68%" />
        <Line lh={16} h={9} w="34%" />
      </span>
      {time ? <Bar className="h-3 w-10" /> : <Pill w={72} h={24} />}
    </div>
  );
}
