"use client";

import { addCollection, Icon } from "@iconify/react";
import { CARBON, RI, SOLAR } from "./icon-data";

/**
 * UI icons: the Solar set from Iconify — rounded strokes that sit well with SF Pro Rounded. Linear by default; `bold`
 * gives the filled form (used for the active tab). Icon data is bundled in icon-data.ts, so nothing is fetched at runtime.
 */
addCollection(SOLAR);
addCollection(CARBON);
addCollection(RI);

type P = { size?: number; className?: string; bold?: boolean };

function solar(name: string) {
  function SolarIcon({ size = 20, className, bold = false }: P) {
    return <Icon icon={`solar:${name}-${bold ? "bold" : "linear"}`} width={size} height={size} className={className} aria-hidden="true" />;
  }
  return SolarIcon;
}

export const IconHome = solar("home-2");
export const IconPie = solar("pie-chart-2");
export const IconCircles = solar("users-group-two-rounded");
export const IconClock = solar("clock-circle");
export const IconSettings = solar("settings");
export const IconArrowRight = solar("arrow-right");
export const IconArrowLeft = solar("arrow-left");
export const IconChevronRight = solar("alt-arrow-right");
export const IconSidebar = ({ size = 20, className }: P) => <Icon icon="carbon:open-panel-filled-right" width={size} height={size} className={className} aria-hidden="true" />;
export const IconCheck =solar("check");
export const IconX = solar("close-circle");
export const IconAlert = solar("danger-triangle");
export const IconExternal = solar("square-arrow-right-up");
export const IconCopy = solar("copy");
export const IconSun = solar("sun-2");
export const IconMoon = solar("moon");
export const IconGlobe = solar("global");
export const IconWallet = solar("wallet");
export const IconGas = solar("gas-station");
export const IconPen = solar("pen");
export const IconShield = solar("shield-check");
export const IconPlus = solar("add-circle");
export const IconShare = solar("share");
export const IconUsers = solar("users-group-rounded");
export const IconTarget = solar("target");
export const IconPulse = solar("pulse");
export const IconCalendar = solar("calendar");
export const IconLayers = solar("layers-minimalistic");
export const IconSwap = solar("transfer-horizontal");

/** Send action icon: Remix "send-ins-fill", the filled paper plane. */
export function IconSend({ size = 20, className }: P) {
  return <Icon icon="ri:send-ins-fill" width={size} height={size} className={className} aria-hidden="true" />;
}
export const IconRound = solar("refresh-circle");
export const IconMail = solar("letter");
export const IconPlay = solar("play-circle");
export const IconCheckCircle = solar("check-circle");

export const IconSpinner = ({ size = 18, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={`animate-spin ${className ?? ""}`} aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
