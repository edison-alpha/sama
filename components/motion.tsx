"use client";

import { LazyMotion, MotionConfig, animate, domMax, m, useReducedMotion, type Transition, type Variants } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Motion for the whole app: `m` components stay light (features load once here), and `reducedMotion="user"` turns
 * movement into plain fades for anyone who asked their system for less motion.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

export const spring: Transition = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 };

/** Page wrapper: fades in, then lets every `rise` child below it enter one after another. */
export const page: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, staggerChildren: 0.05 } },
};

/** Cards, tiles and headers: a short lift into place. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
};

/** Animates a number to its new value (on first show and whenever it changes, e.g. on a data refresh). */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const reduce = useReducedMotion();
  const from = useRef(0);
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    // Starts from whatever is on screen, so a refresh mid-animation continues smoothly instead of jumping.
    const controls = animate(from.current, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        from.current = v;
        setShown(v);
      },
    });
    return () => controls.stop();
  }, [value, reduce]);
  return <>{format(shown)}</>;
}

/** Wraps a screen's loaded content so its cards cascade in when the data arrives (after the skeleton). */
export function Stagger({ children }: { children: ReactNode }) {
  return (
    <m.div initial="hidden" animate="show" variants={page}>
      {children}
    </m.div>
  );
}
