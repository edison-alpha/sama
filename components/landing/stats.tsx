"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useInView } from "@/components/landing/scene";

/**
 * Stats section: centered two-tone heading, then a 2×2 grid of "description · big number" rows. Numbers roll from
 * `from` to `to` the first time the section is on screen (straight to `to` with reduced motion).
 */

type Stat = readonly [from: number, to: number, unit: string, body: string];

function Counter({ from, to, run }: { from: number; to: number; run: boolean }) {
  const [value, setValue] = useState(to);
  useEffect(() => {
    if (!run || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const duration = 1600;
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [from, to, run]);
  return <>{value}</>;
}

export function Stats({ title, stats }: { title: readonly string[]; stats: readonly Stat[] }) {
  const [section, inView] = useInView<HTMLElement>(0.25);
  const [played, setPlayed] = useState(false);
  useEffect(() => {
    if (inView) setPlayed(true);
  }, [inView]);

  return (
    <section ref={section} className="ps mx-auto max-w-[1400px] px-4 py-24 sm:px-8 sm:py-36 lg:px-16" data-inview={played || undefined}>
      <h2 className="ps-card text-balance text-center text-4xl font-normal leading-[1.04] tracking-[-0.035em] sm:text-6xl lg:text-[80px]">
        {title[0]}
        <br />
        <span className="text-ink-3">{title[1]}</span>
      </h2>

      <dl className="mt-20 grid gap-x-24 sm:mt-32 md:grid-cols-2">
        {stats.map(([from, to, unit, body], i) => (
          <div
            key={body}
            className="ps-card flex flex-col-reverse gap-4 border-b border-ink/10 pb-8 pt-14 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:pb-10 sm:pt-24"
            style={{ "--i": i + 1 } as CSSProperties}
          >
            <dt className="max-w-xs text-pretty text-base leading-relaxed text-ink-2 sm:text-lg">{body}</dt>
            <dd className="shrink-0 whitespace-nowrap text-6xl font-light leading-none tracking-[-0.04em] tabular-nums lg:text-[88px]">
              <Counter from={from} to={to} run={played} />
              {unit}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
