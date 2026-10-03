"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { ErrorNote } from "@/components/ui/states";
import { Term } from "@/components/ui/term";
import { sama } from "@/lib/api";
import { PRESETS } from "@/lib/api/demo-data";
import type { Asset, Portfolio, ResidualStyle, Target, TargetPreview } from "@/lib/api/types";
import { useAction } from "@/lib/api/use-api";
import { percent, tokens, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";
import { AllocationDonut, colorFor } from "./allocation-donut";

type Mode = "preset" | "custom" | "describe";
type PresetKey = keyof typeof PRESETS;

/**
 * Target editor (PRD §19.4.4): presets, sliders that must total 100%, before/after donuts, and a server-checked
 * summary of what would trade. Only a target the server preview accepts can be saved.
 */
export function TargetEditor({ assets, portfolio, target, onSaved }: { assets: Asset[]; portfolio: Portfolio; target: Target | null; onSaved?: () => void }) {
  const { d, fmt, locale } = useI18n();
  const [mode, setMode] = useState<Mode>(target ? "custom" : "preset");
  const [weights, setWeights] = useState<Record<string, number>>(target?.weights ?? PRESETS.balanced);
  const [costCapBps, setCostCapBps] = useState(target?.costCapBps ?? 100);
  const [residualStyle, setResidualStyle] = useState<ResidualStyle>(target?.residualStyle ?? "ECONOMIC");
  const [preview, setPreview] = useState<TargetPreview | null>(null);
  const [saved, setSaved] = useState(false);
  const act = useAction();

  const order = useMemo(() => assets.map((a) => a.symbol), [assets]);
  const total = Object.values(weights).reduce((s, w) => s + w, 0);
  const current = portfolio.ok ? Object.fromEntries(portfolio.positions.map((p) => [p.symbol, p.pct])) : {};

  // Debounced server check: never one request per slider pixel.
  useEffect(() => {
    setSaved(false);
    const t = window.setTimeout(() => void sama.previewTarget({ weights, costCapBps, residualStyle }).then(setPreview, () => setPreview(null)), 400);
    return () => window.clearTimeout(t);
  }, [weights, costCapBps, residualStyle]);

  const setWeight = (symbol: string, value: number) => setWeights((w) => ({ ...w, [symbol]: Math.max(0, Math.min(100, Math.round(value))) }));

  /** Scales every non-zero weight so the total is exactly 100; rounding drift goes to the largest weight. */
  const autoBalance = () => {
    const keys = Object.keys(weights).filter((k) => (weights[k] ?? 0) > 0);
    if (keys.length === 0 || total === 0) return;
    const scaled = Object.fromEntries(keys.map((k) => [k, Math.round(((weights[k] ?? 0) / total) * 100)]));
    const drift = 100 - Object.values(scaled).reduce((s, v) => s + v, 0);
    const largest = keys.reduce((a, b) => ((scaled[a] ?? 0) >= (scaled[b] ?? 0) ? a : b));
    scaled[largest] = (scaled[largest] ?? 0) + drift;
    setWeights(scaled);
  };

  const save = () =>
    act.run(async () => {
      await sama.saveTarget({ weights, costCapBps, residualStyle });
      setSaved(true);
      onSaved?.();
    });

  const ok = Math.abs(total - 100) < 0.05;

  return (
    <div className="grid gap-6">
      <Segmented label={d.portfolio.target} value={mode} onChange={setMode} options={(["preset", "custom", "describe"] as const).map((v) => ({ value: v, label: d.portfolio.modes[v] }))} />

      {mode === "preset" && (
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(PRESETS) as PresetKey[]).map((k) => {
            const [name, body] = d.portfolio.presets[k];
            const selected = JSON.stringify(PRESETS[k]) === JSON.stringify(weights);
            return (
              <button key={k} type="button" onClick={() => setWeights(PRESETS[k])} aria-pressed={selected} className={cx("rounded-2xl border p-4 text-left transition-colors", selected ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-line-strong")}>
                <span className="font-semibold">{name}</span>
                <span className="mt-1 block text-sm text-ink-2">{body}</span>
              </button>
            );
          })}
        </div>
      )}

      {mode === "custom" && (
        <div className="grid gap-4">
          {assets.map((a) => (
            <label key={a.symbol} className="grid grid-cols-[14px_72px_1fr_64px] items-center gap-3">
              <span className="size-3 rounded-full" style={{ background: colorFor(a.symbol, order) }} aria-hidden="true" />
              <span className="text-sm font-medium">
                {a.symbol}
                {a.class === "RWA" && <span className="block text-[10px] font-normal text-ink-3">{d.portfolio.classes.RWA}</span>}
              </span>
              <input type="range" min={0} max={100} step={1} value={weights[a.symbol] ?? 0} onChange={(e) => setWeight(a.symbol, Number(e.target.value))} className="accent-[var(--accent)]" aria-label={a.symbol} />
              <span className="flex items-center gap-1">
                <input type="number" min={0} max={100} value={weights[a.symbol] ?? 0} onChange={(e) => setWeight(a.symbol, Number(e.target.value))} className="num h-9 w-14 rounded-lg border border-line bg-surface px-2 text-right text-sm" aria-label={`${a.symbol} %`} />
                <span className="text-sm text-ink-3">%</span>
              </span>
            </label>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3">
            <span className={cx("text-sm font-medium", ok ? "text-ok" : "text-warn")}>{d.portfolio.total}: <span className="num">{percent(total, locale, 0)}</span></span>
            {!ok && <Button size="sm" variant="secondary" onClick={autoBalance}>{d.portfolio.autoBalance}</Button>}
          </div>
          {!ok && <p className="text-sm text-warn">{fmt(d.portfolio.totalOff, { pct: percent(total, locale, 0) })}</p>}
        </div>
      )}

      {mode === "describe" && (
        <div className="grid gap-2">
          <textarea disabled placeholder={d.portfolio.describePlaceholder} className="min-h-24 rounded-2xl border border-line bg-surface-2 p-4 text-sm" />
          <p className="text-sm text-ink-3">{d.portfolio.describeOff}</p>
        </div>
      )}

      <div className="grid items-center gap-6 rounded-[var(--radius-card)] bg-surface-2 p-5 sm:grid-cols-[auto_auto_1fr]">
        <AllocationDonut weights={current} order={order} label={d.portfolio.now} />
        <AllocationDonut weights={weights} order={order} label={d.portfolio.goal} />
        <div>
          <p className="mb-2 text-sm font-semibold">{d.portfolio.willTrade}</p>
          {preview && preview.trades.length === 0 && <p className="text-sm text-ink-2">{d.portfolio.noTrades}</p>}
          <ul className="grid gap-1.5 text-sm">
            {preview?.trades.slice(0, 6).map((t) => (
              <li key={t.symbol} className="flex items-center justify-between gap-3">
                <span>
                  <Badge tone={t.side === "SELL" ? "rest" : "match"}>{t.side === "SELL" ? d.portfolio.sellAbout : d.portfolio.buyAbout}</Badge>{" "}
                  <span className="num">{tokens(t.amountTokens, locale)}</span> {t.symbol}
                </span>
                <span className="num text-ink-3">{usd(t.valueUsd, locale, 0)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <details className="rounded-2xl border border-line p-4">
        <summary className="cursor-pointer text-sm font-semibold">{d.portfolio.advanced}</summary>
        <div className="mt-4 grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-medium">{d.portfolio.costCap}: <span className="num text-accent">{percent(costCapBps / 100, locale)}</span></span>
            <input type="range" min={10} max={300} step={10} value={costCapBps} onChange={(e) => setCostCapBps(Number(e.target.value))} className="accent-[var(--accent)]" />
            <span className="text-xs text-ink-3">{d.portfolio.costCapHelp}</span>
          </label>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">{d.portfolio.residualStyle} (<Term k="leftover" />)</legend>
            {(["ECONOMIC", "CARRY_FORWARD", "CANCEL"] as const).map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <input type="radio" name="residual" checked={residualStyle === s} onChange={() => setResidualStyle(s)} className="accent-[var(--accent)]" />
                {d.portfolio.residualStyles[s]}
              </label>
            ))}
          </fieldset>
        </div>
      </details>

      {act.error && <ErrorNote>{act.error}</ErrorNote>}
      <div className="flex items-center gap-3">
        <Button size="lg" onClick={save} busy={act.pending} disabled={!ok || (preview !== null && !preview.ok)}>{act.pending ? d.common.saving : d.portfolio.saveTarget}</Button>
        {saved && <Badge tone="ok">{d.portfolio.saved}</Badge>}
      </div>
    </div>
  );
}
