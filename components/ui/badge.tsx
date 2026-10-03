import type { ReactNode } from "react";
import type { RoundState } from "@/lib/api/types";
import { cx } from "@/utils/cx";

export type Tone = "neutral" | "accent" | "match" | "ok" | "warn" | "danger" | "rest";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2",
  accent: "bg-accent-soft text-ink",
  match: "bg-match-soft text-match",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  rest: "bg-rest-soft text-rest",
};

export function Badge({ tone = "neutral", dot = false, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current animate-sama-pulse" />}
      {children}
    </span>
  );
}

export function stateTone(state: RoundState): Tone {
  if (state === "COMPLETE") return "ok";
  if (["OPEN", "COLLECTING", "READY_TO_SETTLE", "PROPOSED", "APPROVING"].includes(state)) return "accent";
  if (["FROZEN", "SOLVING", "SETTLING", "SETTLED", "VERIFYING", "RESIDUAL_EXECUTION"].includes(state)) return "match";
  if (["SETTLEMENT_REVERTED", "VERIFICATION_FAILED", "RESIDUAL_FAILED"].includes(state)) return "danger";
  return "neutral";
}
