"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useCallback, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { IconCheck } from "@/components/icons";
import { useDismiss } from "@/lib/hooks/use-dismiss";
import { cx } from "@/utils/cx";

export type DropdownOption<T extends string> = { value: T; label: string; icon?: ReactNode };

/**
 * App-styled select: a trigger you shape yourself and a floating menu in the app's colours (the native select popup
 * is a white OS list that ignores the theme). Listbox semantics; arrows/Home/End move, Enter or Space picks, Escape
 * or a tap outside closes. `children(selected, open)` renders the trigger's content.
 */
export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  label,
  align = "start",
  className,
  triggerClassName,
  menuClassName,
  children,
}: {
  value: T;
  options: Array<DropdownOption<T>>;
  onChange: (value: T) => void;
  label: string;
  align?: "start" | "end";
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  children: (selected: DropdownOption<T> | undefined, open: boolean) => ReactNode;
}) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));

  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, root);

  const show = () => {
    setActive(selectedIndex);
    setOpen(true);
  };
  const pick = (o: DropdownOption<T>) => {
    onChange(o.value);
    setOpen(false);
    trigger.current?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    const last = options.length - 1;
    if (e.key === "ArrowDown") setActive((i) => (i >= last ? 0 : i + 1));
    else if (e.key === "ArrowUp") setActive((i) => (i <= 0 ? last : i - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") {
      const o = options[active];
      if (o) pick(o);
    } else if (e.key === "Tab") setOpen(false);
    else return;
    e.preventDefault();
  };

  return (
    <div ref={root} className={cx("relative", className)}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        className={triggerClassName}
      >
        {children(options[selectedIndex], open)}
      </button>

      <AnimatePresence>
        {open && (
          <m.ul
            id={listId}
            role="listbox"
            aria-label={label}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className={cx(
              "absolute top-full z-50 mt-2 grid min-w-full w-max max-w-[min(320px,calc(100vw-32px))] gap-0.5 rounded-2xl border border-line bg-surface p-1.5 shadow-[var(--elev-float)]",
              align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
              menuClassName,
            )}
          >
            {options.map((o, i) => {
              const on = o.value === value;
              return (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={on}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => pick(o)}
                  className={cx("flex min-h-10 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm font-medium", i === active ? "bg-surface-2 text-ink" : "text-ink-2")}
                >
                  {o.icon && <span className="shrink-0 text-ink-3">{o.icon}</span>}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  <IconCheck size={16} className={cx("shrink-0 text-accent", on ? "opacity-100" : "opacity-0")} />
                </li>
              );
            })}
          </m.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Small chevron for triggers; turns over while the menu is open. */
export function DropdownChevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg className={cx("shrink-0 transition-transform duration-200", open && "rotate-180", className)} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
