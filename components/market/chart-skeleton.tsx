import { cx } from "@/utils/cx";

// Same geometry as Plot in components/portfolio/value-chart.tsx, so the real chart replaces this without a jump.
const H = 260;
const AXIS_W = 64;
const AXIS_H = 28;

// Two soft waves across the plot, as a placeholder line while real prices load.
const WAVE = Array.from({ length: 81 }, (_, i) => {
  const x = (i / 80) * 1000;
  const y = H * 0.5 - Math.sin((i / 80) * Math.PI * 4 + 0.9) * H * 0.26 + 20;
  return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
}).join("");

/** Just the plot area (wave, price-label bars, time-label bars). It does not pulse: put it inside something that does. */
export function ChartPlotSkeleton({ className }: { className?: string }) {
  return (
    <div className={cx("relative", className)} style={{ height: H + AXIS_H }} aria-hidden="true">
      <svg viewBox={`0 0 1000 ${H}`} preserveAspectRatio="none" className="absolute left-0 top-0" style={{ width: `calc(100% - ${AXIS_W}px)`, height: H }}>
        <path d={WAVE} fill="none" stroke="var(--line-strong)" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {[0.06, 0.3, 0.54, 0.78, 1].map((p) => (
        <span key={p} className="absolute h-1.5 w-8 -translate-y-1/2 rounded-full bg-surface-3" style={{ right: 8, top: Math.min(H - 6, p * H) }} />
      ))}
      <div className="absolute bottom-1 left-0 flex justify-around" style={{ width: `calc(100% - ${AXIS_W}px)` }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="h-1.5 w-12 rounded-full bg-surface-3" />
        ))}
      </div>
    </div>
  );
}

/** A chart while its data loads: the plot placeholder, pulsing. `hero` adds bars for the big price and its change. */
export function ChartSkeleton({ hero = false, className }: { hero?: boolean; className?: string }) {
  return (
    <div className={cx("animate-sama-pulse", className)} role="status" aria-busy="true" aria-label="Loading chart">
      {hero && (
        <div className="mb-6" aria-hidden="true">
          <div className="h-10 w-48 rounded-lg bg-surface-3 sm:h-14 sm:w-60" />
          <div className="mt-3 h-4 w-24 rounded-md bg-surface-3" />
        </div>
      )}
      <ChartPlotSkeleton />
    </div>
  );
}
