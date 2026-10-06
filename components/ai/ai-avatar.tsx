"use client";

import { BotAvatar } from "bot-avatars";
import { cx } from "@/utils/cx";

/** The assistant's face: an orange (Sama brand) glossy clover bot that idles, and hops with a wide smile while the model is working. */
export function AiAvatar({ thinking = false, size = 40, className }: { thinking?: boolean; size?: number; className?: string }) {
  return (
    <span className={cx("grid shrink-0 place-items-center rounded-full", thinking && "ai-orb-glow", className)} style={{ width: size, height: size }} aria-hidden="true">
      <BotAvatar type="clover" color="#ff4d1f" shading="plastic" saturation={1.2} face="mouth" state={thinking ? "working" : "default"} size={size} />
    </span>
  );
}
