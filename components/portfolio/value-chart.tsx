"use client";

import { m } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { spring } from "@/components/motion";
import { Money } from "@/components/ui/money";
import { API_MODE, sama } from "@/lib/api";
import type { HistoryPoint, HistoryRange } from "@/lib/api/types";
import { useApi } from "@/lib/api/use-api";
import { percent, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

const RANGES: HistoryRange[] = ["1H", "1D", "1W", "1M", "1Y", "ALL"];
const H = 260; // plot height in px
const AXIS_W = 64; // room for the price labels on the right
const AXIS_H = 28; // room for the time labels underneath

/**
 * Portfolio value chart in the style of a wallet app: the total as a hero number with its change over the chosen
 * window, an area line over a dotted grid with prices on the right, and range pills underneath. Hovering (or
 * arrow keys) scrubs the line, and the hero number follows the point under the cursor.
 * `live` is today's total from Home; the chart's last point is replaced with it so both always agree.
 */
export function ValueChart({ live, below }: { live: number; below?: ReactNode }) {
  // While scrubbing, the hero number shows the hovered value and the tooltip on the line shows when it was.
  const { d, locale } = useI18n();
  const c = d.home.chart;
  const [range, setRange] = useState<HistoryRange>("1D");
  const { data, error } = useApi(() => sama.portfolioHistory(range), [range]);
  const [hover, setHover] = useState<number | null>(null);

  const points: HistoryPoint[] = data && data.length ? [...data.slice(0, -1), { t: data[data.length - 1]!.t, usd: live }] : [];
  const shown = hover !== null && points[hover] ? points[hover]! : null;
  const first = points[0]?.usd ?? live;
  const value = shown?.usd ?? live;
  const change = value - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  const up = change >= 0;

  return (
    <div className="min-w-0">
      <p className="text-[44px] font-semibold leading-none tracking-[-0.03em] text-ink sm:text-6xl">
        <Money value={value} locale={locale} className="tabular-nums" />
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-sm font-medium sm:text-base">
        {points.length > 1 ? (
          <>
            <span className={cx("inline-flex items-center gap-1", up ? "text-ok" : "text-danger")}>
              <Triangle up={up} />
              <span className="tabular-nums">{usd(Math.abs(change), locale)} ({percent(Math.abs(changePct), locale, 2)})</span>
            </span>
            <span className="text-ink-3">{c.period[range]}</span>
          </>
        ) : (
          <span className="text-ink-3">&nbsp;</span>
        )}
      </p>
      {below}

      {/* Phones show just the number and its change, as wallet apps do; the plot starts at tablet width. */}
      <div className="mt-6 hidden sm:block">
        {/* No history endpoint yet means no plot, not a placeholder. In demo mode the history is generated, so say so. */}
        {!error && (
          <>
            <Plot points={points} up={up} hover={hover} onHover={setHover} range={range} label={`${c.label}, ${c.period[range]}`} />
            {API_MODE === "mock" && <p className="mt-2 text-xs text-ink-3">{c.demoNote}</p>}
          </>
        )}
      </div>

      <div role="radiogroup" aria-label={c.label} className="mt-4 hidden rounded-full border border-line p-1 sm:inline-flex">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={r === range}
            onClick={() => { setRange(r); setHover(null); }}
            className={cx("relative h-8 min-w-11 rounded-full px-3 text-sm font-semibold transition-colors", r === range ? "text-ink" : "text-ink-3 hover:text-ink")}
          >
            {r === range && <m.span layoutId="value-chart-range" transition={spring} className="absolute inset-0 rounded-full bg-surface-3" aria-hidden="true" />}
            <span className="relative">{c.ranges[r]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Plot({ points, up, hover, onHover, range, label }: { points: HistoryPoint[]; up: boolean; hover: number | null; onHover: (i: number | null) => void; range: HistoryRange; label: string }) {
  const { locale } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const gradient = useId();

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e!.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Drop the hover point when the data underneath it changes length (new range loaded).
  useEffect(() => onHover(null), [points.length, onHover]);

  const plotW = Math.max(0, width - AXIS_W);
  const values = points.map((p) => p.usd);
  const lo = values.length ? Math.min(...values) : 0;
  const hi = values.length ? Math.max(...values) : 1;
  const { min, max, ticks } = niceScale(lo, hi);
  const t0 = points[0]?.t ?? 0;
  const t1 = points[points.length - 1]?.t ?? 1;
  const x = (t: number) => (t1 === t0 ? plotW : ((t - t0) / (t1 - t0)) * plotW);
  const y = (v: number) => H - ((v - min) / (max - min || 1)) * H;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.usd).toFixed(1)}`).join("");
  const area = points.length ? `${line}L${x(t1).toFixed(1)},${H}L0,${H}Z` : "";
  const stroke = up ? "var(--ok)" : "var(--danger)";
  const last = points[points.length - 1];
  const active = hover !== null ? points[hover] : null;
  const timeTicks = timeAxis(t0, t1, plotW, locale);

  const pick = (clientX: number) => {
    const el = box.current;
    if (!el || points.length < 2) return;
    const px = clientX - el.getBoundingClientRect().left;
    const t = t0 + (Math.max(0, Math.min(plotW, px)) / plotW) * (t1 - t0);
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(points[i]!.t - t) < Math.abs(points[best]!.t - t)) best = i;
    onHover(best);
  };

  return (
    <div
      ref={box}
      className="relative select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] rounded-xl"
      style={{ height: H + AXIS_H }}
      tabIndex={0}
      role="img"
      aria-label={last && points[0] ? `${label}: ${usd(points[0].usd, locale)} → ${usd(last.usd, locale)}` : label}
      onPointerMove={(e) => pick(e.clientX)}
      onPointerLeave={() => onHover(null)}
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const i = hover ?? points.length - 1;
        onHover(Math.max(0, Math.min(points.length - 1, i + (e.key === "ArrowLeft" ? -1 : 1))));
      }}
      onBlur={() => onHover(null)}
    >
      {/* Dotted grid behind the plot, as in wallet apps; recessive so the line reads first. */}
      <div className="absolute left-0 top-0 opacity-60" style={{ width: plotW, height: H, backgroundImage: "radial-gradient(var(--line-strong) 1px, transparent 1px)", backgroundSize: "24px 24px" }} aria-hidden="true" />

      {width > 0 && points.length > 1 && (
        <svg width={width} height={H + AXIS_H} className="absolute inset-0 overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>

          <m.path key={`a${points.length}${t0}`} d={area} fill={`url(#${gradient})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
          <m.path key={`l${points.length}${t0}`} d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />

          {ticks.map((v) => (
            <text key={v} x={plotW + 12} y={y(v)} dominantBaseline="middle" className="fill-[var(--ink-3)] text-xs tabular-nums">{usd(v, locale, 0)}</text>
          ))}
          {timeTicks.map((tk) => (
            <text key={tk.t} x={x(tk.t)} y={H + 20} textAnchor="middle" className="fill-[var(--ink-3)] text-xs">{tk.label}</text>
          ))}

          {active ? (
            <>
              <line x1={x(active.t)} x2={x(active.t)} y1={0} y2={H} stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={x(active.t)} cy={y(active.usd)} r={5} fill={stroke} stroke="var(--bg)" strokeWidth={2} />
            </>
          ) : (
            last && (
              <>
                <circle cx={x(last.t)} cy={y(last.usd)} r={9} fill={stroke} opacity={0.2} />
                <circle cx={x(last.t)} cy={y(last.usd)} r={4.5} fill={stroke} stroke="var(--bg)" strokeWidth={2} />
              </>
            )
          )}
        </svg>
      )}

      {active && (
        <span
          className="tabular-nums pointer-events-none absolute top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-semibold text-[var(--bg)]"
          style={{ left: Math.max(40, Math.min(plotW - 40, x(active.t))) }}
        >
          {new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", range === "1H" || range === "1D" ? { hour: "numeric", minute: "2-digit" } : { day: "numeric", month: "short", year: range === "1Y" || range === "ALL" ? "numeric" : undefined }).format(active.t)}
        </span>
      )}
    </div>
  );
}

/** Four or five round price ticks with headroom above and below, so a calm portfolio reads as calm, not as a cliff. */
function niceScale(lo: number, hi: number): { min: number; max: number; ticks: number[] } {
  const spread = Math.max(hi - lo, Math.abs(hi) * 0.04, 1);
  const raw = (spread * 2) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw) ?? 10 * mag;
  const mid = (hi + lo) / 2;
  const min = Math.max(0, Math.floor((mid - spread) / step) * step);
  const max = Math.ceil((mid + spread) / step) * step;
  const ticks: number[] = [];
  for (let v = min; v <= max + step / 2; v += step) ticks.push(v);
  return { min, max, ticks };
}

/** Evenly spaced time labels, about one per 110 px, worded for the window (hours for a day, dates beyond). */
function timeAxis(t0: number, t1: number, width: number, locale: string): Array<{ t: number; label: string }> {
  if (t1 <= t0 || width <= 0) return [];
  const n = Math.max(2, Math.min(8, Math.floor(width / 110)));
  const span = t1 - t0;
  const tag = locale === "id" ? "id-ID" : "en-US";
  const opts: Intl.DateTimeFormatOptions = span <= 2 * 86_400_000 ? { hour: "numeric", minute: span <= 3 * 3_600_000 ? "2-digit" : undefined } : span <= 60 * 86_400_000 ? { day: "numeric", month: "short" } : { month: "short", year: "2-digit" };
  const f = new Intl.DateTimeFormat(tag, opts);
  return Array.from({ length: n }, (_, i) => {
    const t = t0 + ((i + 0.5) / n) * span;
    return { t, label: f.format(t) };
  });
}

function Triangle({ up }: { up: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={up ? "" : "rotate-180"}>
      <path d="M5 1.5 9 8.5H1Z" fill="currentColor" />
    </svg>
  );
}
