import { Bar, Disc, Line, Pill, SkeletonRoot, WalletHeaderSkeleton } from "./parts";

/**
 * Activity while it loads. The page renders two different layouts, so this does too: a wallet-style history card on
 * phones (below `md`), and the wallet header, filters and table from `md`.
 */
export function ActivitySkeleton() {
  return (
    <SkeletonRoot>
      <div className="md:hidden">
        <header className="grid grid-cols-[44px_1fr_44px] items-center pt-2">
          <span />
          <span className="flex h-7 items-center justify-center"><Bar className="h-4 w-24" /></span>
          <span className="justify-self-end"><Bar className="h-10 w-10 rounded-xl" /></span>
        </header>

        <div className="mt-5 flex items-center gap-2">
          <Pill w={112} h={40} />
          <Disc size={40} />
        </div>

        <section className="mt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <Line lh={28} h={16} w={96} />
              <Line lh={20} h={11} w={150} />
            </div>
            <Pill w={64} h={26} />
          </div>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[24px] bg-surface-2/60">
            {Array.from({ length: 7 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Disc size={44} />
                <span className="min-w-0 flex-1">
                  <Line lh={24} h={14} w={`${50 + ((i * 9) % 30)}%`} />
                  <Line lh={20} h={11} w={`${38 + ((i * 7) % 20)}%`} />
                </span>
                <span className="grid justify-items-end">
                  <Line lh={20} h={12} w={76} />
                  <Line lh={16} h={9} w={58} />
                </span>
                <Bar className="h-3 w-2" />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="hidden md:block">
        <WalletHeaderSkeleton />

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <span className="block h-12 w-40 rounded-2xl border border-line" />
            <span className="block h-12 w-36 rounded-2xl border border-line" />
          </div>
          <span className="block h-12 w-full rounded-2xl border border-line md:w-80" />
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex h-12 items-center rounded-2xl bg-surface-2 px-4">
              <span className="w-28"><Bar className="h-3 w-10" /></span>
              <span className="w-44"><Bar className="h-3 w-10" /></span>
              <span className="flex-1"><Bar className="h-3 w-14" /></span>
              <span className="w-56"><Bar className="h-3 w-16" /></span>
            </div>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex items-center border-b border-line px-4 py-4 last:border-0">
                <span className="w-28"><Bar className="h-3.5 w-14" /></span>
                <span className="flex w-44 items-center gap-2.5">
                  <Bar className="h-[18px] w-[18px] rounded-full" />
                  <Bar className="h-3.5 w-20" />
                </span>
                <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
                  <span className="flex items-center gap-3">
                    <Disc size={36} />
                    <span>
                      <Line lh={20} h={12} w={96} />
                      <Line lh={20} h={11} w={54} />
                    </span>
                  </span>
                  <Bar className="h-3 w-4" />
                  <span className="flex items-center gap-3">
                    <Disc size={36} />
                    <span>
                      <Line lh={20} h={12} w={96} />
                      <Line lh={20} h={11} w={54} />
                    </span>
                  </span>
                </span>
                <span className="w-56">
                  <Line lh={16} h={9} w={30} />
                  <Line lh={20} h={12} w={104} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonRoot>
  );
}
