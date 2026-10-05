"use client";

import { useState } from "react";
import { CodeBlock } from "@/components/docs/code-block";
import { Demo } from "@/components/docs/demos";
import { DocIcon } from "@/components/docs/icon";
import { TONES, type Tone } from "@/components/landing/scene-tones";
import type { DemoKey } from "@/lib/docs/types";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

/** Each demo gets its own scene colour, from the landing palette. */
const DEMO_TONE: Record<DemoKey, Tone> = {
  pair: TONES.navy,
  ring: TONES.ocean,
  round: TONES.slate,
  target: TONES.amber,
  approval: TONES.plum,
  checks: TONES.forest,
  leftover: TONES.navy,
  tiers: TONES.slate,
};

/**
 * The landing's scene background (drifting light, grain, vignette) behind content that keeps its own height, so a tall
 * demo grows the card instead of being clipped (the landing Scene sizes from its class, not its children).
 */
function SceneBox({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const [base, a, b, c] = tone;
  return (
    <div className="ps-scene relative isolate flex min-h-[340px] items-center justify-center overflow-hidden rounded-[28px] px-5 py-10 text-white sm:px-10" style={{ background: base }}>
      <span className="ps-blob" style={{ background: a, left: "-20%", top: "-15%" }} aria-hidden="true" />
      <span className="ps-blob" style={{ background: b, right: "-25%", bottom: "-20%", animationDelay: "-6s" }} aria-hidden="true" />
      <span className="ps-blob ps-blob-sm" style={{ background: c, left: "30%", top: "40%", animationDelay: "-11s" }} aria-hidden="true" />
      <span className="ps-grain" aria-hidden="true" />
      <span className="ps-vignette" aria-hidden="true" />
      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </div>
  );
}

/** A live demo on a cinematic scene with glass UI, as on the landing page; a Code tab when the block has a snippet. */
export function PreviewCard({ demo, caption, code }: { demo: DemoKey; caption?: string; code?: { lang: string; code: string } }) {
  const { d } = useI18n();
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const tabCls = (on: boolean) => cx("relative inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors", on ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink");
  return (
    <figure className="my-9">
      {code && (
        <div className="glass-panel mb-3 inline-flex rounded-full p-1" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "preview"} onClick={() => setTab("preview")} className={tabCls(tab === "preview")}>
            <DocIcon name="eye" size={16} />
            {d.docs.preview}
          </button>
          <button type="button" role="tab" aria-selected={tab === "code"} onClick={() => setTab("code")} className={tabCls(tab === "code")}>
            <DocIcon name="code" size={16} />
            {d.docs.code}
          </button>
        </div>
      )}
      {tab === "preview" || !code ? (
        <SceneBox tone={DEMO_TONE[demo]}>
          <Demo demo={demo} />
        </SceneBox>
      ) : (
        <CodeBlock code={code.code} lang={code.lang} />
      )}
      {caption && <figcaption className="mt-3 text-sm text-ink-3">{caption}</figcaption>}
    </figure>
  );
}
