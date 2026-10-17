"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/utils/cx";

let locks = 0;
let previousOverflow = "";

/** The top layer makes the background inert; the trigger is restored after React unmounts the dialog. */
export function Modal({ open = true, suspended = false, onClose, label, labelledBy, className, children }: {
  open?: boolean;
  suspended?: boolean;
  onClose: () => void;
  label?: string;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const suspension = useRef(suspended);
  suspension.current = suspended;
  const pressedBackdrop = useRef(false);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || suspended || !dialog) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    if (locks++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      dialog.close();
      queueMicrotask(() => {
        if (!suspension.current && trigger?.isConnected && !document.querySelector("dialog[open]")) trigger.focus({ preventScroll: true });
      });
      if (--locks === 0) document.body.style.overflow = previousOverflow;
    };
  }, [open, suspended]);

  return (
    <dialog ref={ref} tabIndex={-1} aria-modal="true" aria-label={label} aria-labelledby={labelledBy} className={cx("app-modal", className)}
      onKeyDown={(event) => {
        if (event.key !== "Tab" || event.defaultPrevented) return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'))
          .filter(el => el.tabIndex >= 0 && !el.matches(":disabled") && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden");
        const first = controls[0];
        const last = controls[controls.length - 1];
        const active = document.activeElement;
        if (!first) { event.preventDefault(); event.currentTarget.focus(); }
        else if (event.shiftKey && (active === first || !controls.includes(active as HTMLElement))) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault(); first.focus();
        }
      }}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onPointerDown={(event) => { pressedBackdrop.current = event.target === event.currentTarget; }}
      onClick={(event) => {
        if (pressedBackdrop.current && event.target === event.currentTarget) onClose();
        pressedBackdrop.current = false;
      }}>
      {open && children}
    </dialog>
  );
}
