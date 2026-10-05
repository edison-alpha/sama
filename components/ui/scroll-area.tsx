import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";

/**
 * Slim scrollbar for any panel or list that scrolls inside a card or modal. The look lives in `.compact-scroll`
 * (globals.css); this component just applies it, so every scroll area in the app matches.
 */
export const scrollAreaClass = "compact-scroll overflow-y-auto";

export function ScrollArea({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(scrollAreaClass, className)} {...rest} />;
}
