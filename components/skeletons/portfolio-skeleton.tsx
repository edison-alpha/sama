import { Bar, Line, Pill, SkeletonRoot, TokenListSkeleton, WalletHeaderSkeleton } from "./parts";

/** Portfolio while it loads: wallet header, the Tokens / Target tabs, the total with its buttons, then the token list. */
export function PortfolioSkeleton() {
  return (
    <SkeletonRoot>
      <WalletHeaderSkeleton />

      <nav className="mb-8 flex gap-6 border-b border-line">
        <span className="pb-3"><Line lh={28} h={17} w={62} /></span>
        <span className="pb-3"><Line lh={28} h={17} w={56} /></span>
      </nav>

      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <span className="flex h-12 items-center"><Bar className="h-10 w-56 rounded-xl" /></span>
          <Line lh={20} h={12} w={72} className="mt-2" />
        </div>
        <div className="flex shrink-0 gap-2">
          <Pill w={92} h={48} />
          <Pill w={72} h={48} />
        </div>
      </div>

      <TokenListSkeleton rows={8} />
    </SkeletonRoot>
  );
}
