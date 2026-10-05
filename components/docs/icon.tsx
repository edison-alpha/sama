"use client";

import { Icon } from "@iconify/react";

/**
 * Docs icons: Phosphor through Iconify, the same set the landing page uses. Duotone for illustrations and cards,
 * bold for small UI glyphs.
 */
export const DOC_ICONS = {
  quickstart: "ph:rocket-launch-duotone",
  idea: "ph:lightbulb-filament-duotone",
  round: "ph:arrows-clockwise-duotone",
  shield: "ph:shield-check-duotone",
  stack: "ph:stack-duotone",
  api: "ph:brackets-curly-duotone",
  target: "ph:target-duotone",
  circles: "ph:users-three-duotone",
  swap: "ph:arrows-left-right-duotone",
  wallet: "ph:wallet-duotone",
  book: "ph:book-open-text-duotone",
  pulse: "ph:pulse-duotone",
  note: "ph:info-duotone",
  tip: "ph:lightbulb-duotone",
  warn: "ph:warning-duotone",
  eye: "ph:eye-duotone",
  code: "ph:code-duotone",
  copy: "ph:copy-duotone",
  file: "ph:file-text-duotone",
  link: "ph:link-duotone",
  sparkle: "ph:sparkle-duotone",
  terminal: "ph:terminal-window-duotone",
  check: "ph:check-bold",
  checkFill: "ph:check-circle-fill",
  seal: "ph:seal-check-fill",
  caretDown: "ph:caret-down-bold",
  caretRight: "ph:caret-right-bold",
  search: "ph:magnifying-glass-bold",
  menu: "ph:list-bold",
  outline: "ph:text-align-left-bold",
  hash: "ph:hash-bold",
  arrowLeft: "ph:arrow-left-bold",
  arrowRight: "ph:arrow-right-bold",
  arrowUpRight: "ph:arrow-up-right-bold",
  enter: "ph:arrow-elbow-down-left-bold",
  lock: "ph:lock-simple-duotone",
  repeat: "ph:repeat-duotone",
  cart: "ph:shopping-cart-duotone",
  skip: "ph:skip-forward-duotone",
  updown: "ph:arrows-down-up-bold",
} as const;

export type DocIconName = keyof typeof DOC_ICONS;

export function DocIcon({ name, size = 18, className }: { name: DocIconName; size?: number; className?: string }) {
  return <Icon icon={DOC_ICONS[name]} width={size} height={size} className={className} aria-hidden="true" />;
}
