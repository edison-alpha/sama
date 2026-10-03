"use client";

import { useEffect, useRef, useState } from "react";
import { scrollToY } from "@/components/smooth-scroll";
import { cx } from "@/utils/cx";

/**
 * Sticky-scroll flow: the panel pins to the viewport while the section scrolls past, and each slice of that scroll
 * swaps the background photo, the headline and the active row in the glass card. After the last item the page moves on.
 */
export function FlowSteps({ items, images }: { items: string[][]; images: string[] }) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const n = items.length;

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      const progress = range > 0 ? -rect.top / range : 0;
      setActive(Math.min(n - 1, Math.max(0, Math.floor(progress * n))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [n]);

  function jump(i: number) {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    scrollToY(top + ((i + 0.5) / n) * range);
  }

  const [, title, body] = items[active]!;

  return (
    <section ref={ref} className="relative mx-2 sm:mx-3" style={{ height: `${n * 100}svh` }}>
      <div className="sticky top-2 h-[calc(100svh-16px)] overflow-hidden rounded-[var(--radius-panel)] bg-ink text-white sm:top-3.5 sm:h-[calc(100svh-28px)]">
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            loading={i === 0 ? "eager" : "lazy"}
            className={cx("flow-bg absolute inset-0 size-full object-cover", i === active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0")}
          />
        ))}
        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" aria-hidden="true" />
        <span className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-transparent" aria-hidden="true" />

        <div className="relative flex h-full flex-col justify-end gap-6 p-6 sm:p-10 lg:flex-row lg:items-end lg:justify-between lg:p-16">
          <div key={active} className="flow-in order-2 max-w-md lg:order-1">
            <h2 className="text-balance text-4xl font-medium leading-[1.04] tracking-[-0.035em] [text-shadow:0_2px_24px_rgb(0_0_0/0.3)] sm:text-5xl lg:text-[3.5rem]">{title}</h2>
            <p className="mt-3.5 max-w-sm text-pretty text-sm leading-relaxed text-white/80 sm:text-[15px]">{body}</p>
          </div>

          <ol className="glass glass-frost order-1 grid w-full gap-0.5 rounded-[18px] p-1.5 sm:max-w-[340px] lg:order-2">
            {items.map(([label], i) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => jump(i)}
                  aria-current={i === active ? "step" : undefined}
                  className={cx(
                    "flex w-full items-center justify-between rounded-[12px] px-3.5 py-2 text-left text-[15px] transition-[background-color,color] duration-300 sm:px-4 sm:py-2.5 sm:text-base",
                    i === active ? "bg-white/15 font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]" : "text-white/55 hover:text-white/80",
                  )}
                >
                  {label}
                  <span className="num text-[11px]">{String(i + 1).padStart(2, "0")}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
