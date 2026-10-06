import { cx } from "@/utils/cx";
import { Bar, Disc, Line, Pill, SkeletonRoot } from "./parts";

/** Circles while it loads: the phone header or the desktop title row, the Mine / Explore tabs, then a grid of cards. */
export function CirclesSkeleton() {
  return (
    <SkeletonRoot>
      {/* Phones: centred title with the language button on the right. */}
      <header className="grid grid-cols-[44px_1fr_44px] items-center pt-2 sm:hidden">
        <span />
        <span className="flex h-7 justify-center items-center"><Bar className="h-4 w-24" /></span>
        <span className="justify-self-end"><Bar className="h-10 w-10 rounded-xl" /></span>
      </header>

      {/* Desktop: title and lead line on the left, the create button on the right. */}
      <header className="mb-6 hidden sm:flex sm:items-end sm:justify-between sm:gap-3">
        <div>
          <span className="flex h-9 items-center"><Bar className="h-7 w-40 rounded-lg" /></span>
          <Line lh={24} h={13} w={300} className="mt-1" />
        </div>
        <Pill w={132} h={44} />
      </header>

      <div className="mt-5 mb-5 flex items-center justify-between gap-3 sm:mt-0">
        <Pill w={228} h={46} className="border border-line bg-surface-2/70" />
        <Disc size={40} className="sm:hidden" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <CardSkeleton key={i} className={cx(i > 2 && "hidden sm:flex", i > 3 && "sm:hidden xl:flex")} />
        ))}
      </div>
    </SkeletonRoot>
  );
}

/** One CircleCard: name and tags, the round row with its button, the members row, and the footer line. */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <article className={cx("flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-line bg-surface", className)}>
      <header className="px-5 pt-5">
        <Line lh={24} h={15} w="56%" />
        <Line lh={16} h={9} w="42%" className="mt-0.5" />
      </header>
      <div className="flex flex-1 flex-col gap-4 px-5 py-4">
        <div className="flex min-h-10 items-center gap-3">
          <Disc size={36} />
          <span className="min-w-0 flex-1">
            <Line lh={20} h={12} w="46%" />
            <Line lh={16} h={9} w="62%" />
          </span>
          <Pill w={64} h={36} />
        </div>
        <div className="flex min-h-10 items-center gap-3">
          <Disc size={36} />
          <span className="min-w-0 flex-1">
            <Line lh={20} h={12} w="38%" />
            <Line lh={16} h={9} w="54%" />
          </span>
          <span className="flex -space-x-2">{[0, 1, 2].map((i) => <Disc key={i} size={22} className="border-2 border-surface" />)}</span>
        </div>
      </div>
      <footer className="mx-5 flex items-center gap-2 border-t border-line py-3.5">
        <Line lh={16} h={9} w={110} />
        <Bar className="ml-auto h-3 w-3" />
      </footer>
    </article>
  );
}
