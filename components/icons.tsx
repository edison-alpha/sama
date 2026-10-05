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

/** Filled Remix icons for the Home action tiles. */
export function IconTargetFill({ size = 20, className }: P) {
  return <Icon icon="ri:focus-3-fill" width={size} height={size} className={className} aria-hidden="true" />;
}

export function IconGroupFill({ size = 20, className }: P) {
  return <Icon icon="ri:group-fill" width={size} height={size} className={className} aria-hidden="true" />;
}

export function IconAddFill({ size = 20, className }: P) {
  return <Icon icon="ri:add-circle-fill" width={size} height={size} className={className} aria-hidden="true" />;
}

export function IconPlayFill({ size = 20, className }: P) {
  return <Icon icon="ri:play-circle-fill" width={size} height={size} className={className} aria-hidden="true" />;
}

/** Send action icon: Remix "send-ins-fill", the filled paper plane. */
export function IconSend({ size = 20, className }: P) {
  return <Icon icon="ri:send-ins-fill" width={size} height={size} className={className} aria-hidden="true" />;
}
/** Transfer icon for activity rows: the filled paper plane (Reicon "send-filled") in both directions. Sent flies up-right, received is the same plane turned 180°. */
function transferIcon(direction: "out" | "in") {
  function TransferIcon({ size = 20, className }: P) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path fill="currentColor" transform={direction === "in" ? "rotate(180 12 12)" : undefined} d="M18.38 1.44c2.606-.918 5.084 1.605 4.182 4.201l-5.178 14.9c-1.01 2.904-5.076 2.959-6.162.083l-1.924-4.86l4.732-4.734a.75.75 0 1 0-1.06-1.06l-4.74 4.739l-4.89-1.818l-.016-.006C.5 11.762.578 7.716 3.444 6.705z" />
      </svg>
    );
  }
  return TransferIcon;
}
/** Signed icon for activity rows: Bitcoin Icons "sign-filled", a document with a signature. */
export function IconSigned({ size = 20, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M6 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zm3.49 11.598l.001-.005l.004-.02a12 12 0 0 1 .078-.35c.053-.228.129-.53.219-.83c.07-.234.146-.455.222-.633c.094.189.193.424.3.681l.03.074c.117.283.243.587.366.825c.067.128.147.265.24.375c.074.087.26.285.55.285c.326 0 .54-.196.658-.337c.106-.128.193-.287.253-.397l.014-.024l.074-.131q.031.052.073.13l.013.023c.06.11.148.27.255.4c.12.142.334.336.66.336c.256 0 .507-.13.67-.224c.189-.11.383-.25.551-.382a10 10 0 0 0 .57-.482l.047-.044l.004-.003a.5.5 0 0 0-.684-.73l-.002.002l-.008.008l-.032.029a9 9 0 0 1-.51.432a4 4 0 0 1-.44.306q-.06.034-.099.053a4 4 0 0 1-.118-.206l-.006-.01a2.4 2.4 0 0 0-.275-.42A.88.88 0 0 0 12.5 16c-.32 0-.539.18-.668.327c-.12.138-.214.307-.278.422l-.01.02c-.087-.18-.18-.403-.281-.649l-.025-.061a9 9 0 0 0-.417-.911a2 2 0 0 0-.266-.383c-.094-.1-.282-.265-.555-.265c-.276 0-.464.168-.558.273c-.105.117-.189.26-.256.394a6 6 0 0 0-.352.94a15 15 0 0 0-.323 1.286v.006l-.001.002a.5.5 0 0 0 .98.197M9 6.54a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm-.5 2.71a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1H9a.5.5 0 0 1-.5-.5M9 11a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1z" />
    </svg>
  );
}
/** Leftovers icon for activity rows: Iconmind "leftovers-duotone-bold", a tray with a light fill and a line across it. */
export function IconLeftovers({ size = 20, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5">
        <path fill="currentColor" d="M5 13v7h14v-7Z" opacity=".2" stroke="none" />
        <path d="M5 13v7h14v-7Z" />
        <path d="M3 10h18" />
        <path d="M12 7v3" />
      </g>
    </svg>
  );
}
/** Round icon for activity rows: Glyphs "arrows-round-bold", two arrows chasing each other around a circle. */
export function IconRoundArrows({ size = 20, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className={className} aria-hidden="true">
      <g fill="currentColor">
        <path d="m49.484 63.898l-1.148-2.771zm-7.3-1.179a3 3 0 1 0 .682 5.961zm.663 5.964a3 3 0 1 0-.678-5.962zm-.758-5.953a3 3 0 1 0 .657 5.964zm21.395-12.832l-2.772-1.148zm0-19.799l2.771-1.148zm-4.322-11.316a3 3 0 1 0-4.07 4.41zM48.336 61.127a23 23 0 0 1-6.152 1.592l.682 5.961a29 29 0 0 0 7.766-2.01zm-6.167 1.594l-.08.009l.657 5.964l.101-.011zm18.543-13.97a22.87 22.87 0 0 1-12.376 12.376l2.296 5.543a28.87 28.87 0 0 0 15.623-15.623zm0-17.503a22.87 22.87 0 0 1 0 17.502l5.543 2.297a28.87 28.87 0 0 0 0-22.096zm-5.62-8.055a22.9 22.9 0 0 1 5.62 8.054l5.543-2.296a28.9 28.9 0 0 0-7.093-10.168z" />
        <path d="m29.493 16.102l1.148 2.771zm7.3 1.179a3 3 0 1 0-.683-5.961zm-.664-5.964a3 3 0 1 0 .678 5.962zm.758 5.953a3 3 0 1 0-.657-5.964zM15.493 30.102l2.772 1.148zm0 19.799l-2.772 1.148zm4.322 11.316a3 3 0 1 0 4.069-4.41zM30.64 18.873a23 23 0 0 1 6.151-1.592l-.682-5.961c-2.646.302-5.26.973-7.765 2.01zm6.166-1.594l.08-.009l-.657-5.964l-.1.011zm-18.542 13.97A22.87 22.87 0 0 1 30.64 18.874l-2.296-5.543A28.87 28.87 0 0 0 12.72 28.954zm0 17.504a22.87 22.87 0 0 1 0-17.503l-5.544-2.297a28.87 28.87 0 0 0 0 22.096zm5.619 8.054a22.9 22.9 0 0 1-5.62-8.055l-5.543 2.297a28.9 28.9 0 0 0 7.094 10.168z" />
      </g>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M42.418 56.596v16.808c0 1.696-2.05 2.545-3.25 1.346l-7.629-7.629a3 3 0 0 1 0-4.242l7.629-7.629c1.2-1.2 3.25-.35 3.25 1.346" />
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M36.559 23.404V6.596c0-1.696 2.05-2.545 3.25-1.346l7.628 7.629a3 3 0 0 1 0 4.242L39.81 24.75c-1.2 1.2-3.25.35-3.25-1.346" />
    </svg>
  );
}
export const IconSent = transferIcon("out");
export const IconReceive = transferIcon("in");
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
