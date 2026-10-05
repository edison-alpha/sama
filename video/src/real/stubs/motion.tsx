import { createContext, createElement, forwardRef, useContext, type ComponentPropsWithoutRef, type CSSProperties, type JSX, type ReactNode } from "react";
import { spring } from "remotion";
import { useT, DESIGN_FPS } from "../../anim";

/**
 * motion/react for the video. Real-time animations can't be rendered frame by frame, so `m.*` become plain elements,
 * and anything using the app's `rise` variant (components/motion.tsx) gets the same lift-in driven by the frame:
 * each one starts a few frames after the previous, in render order, from the start frame RevealContext gives.
 */
export const RevealContext = createContext<{ start: number; next: () => number } | null>(null);

const MOTION_PROPS = new Set([
  "initial", "animate", "exit", "variants", "transition", "custom", "inherit",
  "whileHover", "whileTap", "whileFocus", "whileInView", "whileDrag", "viewport",
  "layout", "layoutId", "layoutDependency", "layoutScroll", "layoutRoot",
  "drag", "dragConstraints", "dragElastic", "dragMomentum", "dragListener", "dragControls",
  "onDrag", "onDragStart", "onDragEnd", "onAnimationStart", "onAnimationComplete", "onUpdate",
  "onHoverStart", "onHoverEnd", "onTap", "onTapStart", "onTapCancel", "onPan", "onPanStart", "onPanEnd",
]);

type AnyProps = Record<string, unknown>;

const cache = new Map<string, unknown>();

function make(tag: string) {
  const C = forwardRef<unknown, AnyProps>((props, ref) => {
    const reveal = useContext(RevealContext);
    const frame = useT();
    const fps = DESIGN_FPS;
    const rest: AnyProps = {};
    for (const k of Object.keys(props)) if (!MOTION_PROPS.has(k)) rest[k] = props[k];
    let style = props.style as CSSProperties | undefined;
    const hidden = (props.variants as { hidden?: { y?: number } } | undefined)?.hidden;
    if (reveal && hidden?.y !== undefined) {
      const p = spring({ frame: frame - reveal.start - reveal.next() * 3, fps, config: { damping: 200 } });
      style = { ...style, opacity: p, translate: `0px ${(1 - p) * 18}px` };
    }
    return createElement(tag, { ...rest, style, ref });
  });
  C.displayName = `m.${tag}`;
  return C;
}

export const m = new Proxy({} as Record<string, ReturnType<typeof make>>, {
  get: (_, tag: string) => {
    if (!cache.has(tag)) cache.set(tag, make(tag));
    return cache.get(tag);
  },
});
export const motion = m;

const Pass = ({ children }: { children?: ReactNode } & Record<string, unknown>) => <>{children}</>;
export const AnimatePresence = Pass;
export const LazyMotion = Pass;
export const MotionConfig = Pass;
export const domMax = {};
export const domAnimation = {};
export const useReducedMotion = () => true;
export const useIsPresent = () => true;
export const animate = (_from: number, to: number, opts: { onUpdate?: (v: number) => void } & Record<string, unknown> = {}) => {
  opts.onUpdate?.(to);
  return { stop() {} };
};

export type Variants = Record<string, unknown>;
export type Transition = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HTMLMotionProps<T extends keyof JSX.IntrinsicElements = "div"> = ComponentPropsWithoutRef<T> & Record<string, any>;
