"use client";

import { useEffect, useState } from "react";
import { AssetIcon } from "@/components/asset-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/states";
import { Term } from "@/components/ui/term";
import { sama } from "@/lib/api";
import { PRESETS } from "@/lib/api/demo-data";
import type { Asset, Portfolio, ResidualStyle, Target, TargetPreview } from "@/lib/api/types";
import { useAction } from "@/lib/api/use-api";
import { percent, tokens, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

type PresetKey = keyof typeof PRESETS;

/**
 * Target editor (PRD §19.4.4) laid out like a DEX page: one table of tokens with where you are now, the target you
 * type, and the server-checked trade it implies; a summary box beside it holds the totals and the save button.
 * Presets only fill the numbers. Only a target the server preview accepts can be saved.
 */
export function TargetEditor({ assets, portfolio, target, onSaved }: { assets: Asset[]; portfolio: Portfolio; target: Target | null; onSaved?: () => void }) {
  const { d, fmt, locale } = useI18n();
  const e = d.portfolio.editor;
  const t = d.portfolio.table;
  const [weights, setWeights] = useState<Record<string, number>>(target?.weights ?? PRESETS.balanced);
  const [costCapBps, setCostCapBps] = useState(target?.costCapBps ?? 100);
  const [residualStyle, setResidualStyle] = useState<ResidualStyle>(target?.residualStyle ?? "ECONOMIC");
  const [preview, setPreview] = useState<TargetPreview | null>(null);
  const [saved, setSaved] = useState(false);
  const act = useAction();

  const total = Object.values(weights).reduce((s, w) => s + w, 0);
  const ok = Math.abs(total - 100) < 0.05;
  const current: Record<string, number> = portfolio.ok ? Object.fromEntries(portfolio.positions.map((p) => [p.symbol, p.pct])) : {};
  const trades = new Map((preview?.trades ?? []).map((x) => [x.symbol, x]));
  const sellUsd = (preview?.trades ?? []).filter((x) => x.side === "SELL").reduce((s, x) => s + x.valueUsd, 0);
  const buyUsd = (preview?.trades ?? []).filter((x) => x.side === "BUY").reduce((s, x) => s + x.valueUsd, 0);
  // Held tokens first (largest first), then the rest in catalogue order. Fixed while editing, so rows never jump.
  const [rows] = useState(() => [...assets].sort((a, b) => (current[b.symbol] ?? 0) - (current[a.symbol] ?? 0)));

  // Debounced server check: never one request per keystroke.
  useEffect(() => {
    setSaved(false);
    const id = window.setTimeout(() => void sama.previewTarget({ weights, costCapBps, residualStyle }).then(setPreview, () => setPreview(null)), 400);
    return () => window.clearTimeout(id);
  }, [weights, costCapBps, residualStyle]);

  const setWeight = (symbol: string, value: number) => setWeights((w) => ({ ...w, [symbol]: Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0))) }));

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

  const th = "bg-surface-2 px-4 py-3.5 text-right text-sm font-medium text-ink-3 first:rounded-l-2xl first:text-left last:rounded-r-2xl";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="min-w-0">
        <p className="text-sm text-ink-2">{e.lead}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-ink-3">{e.startFrom}</span>
          {(Object.keys(PRESETS) as PresetKey[]).map((k) => {
            const [name, body] = d.portfolio.presets[k];
            const selected = JSON.stringify(PRESETS[k]) === JSON.stringify(weights);
            return (
              <button
                key={k}
                type="button"
                title={body}
                aria-pressed={selected}
                onClick={() => setWeights(PRESETS[k])}
                className={cx("h-10 rounded-full border px-4 text-sm font-semibold transition-colors", selected ? "border-accent bg-accent-soft text-accent" : "border-line text-ink hover:bg-surface-2")}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* Phones: one row per token (now on the left, the target stepper on the right, the trade underneath). */}
        <ul className="mt-5 divide-y divide-line overflow-hidden rounded-[24px] bg-surface-2/60 sm:hidden">
          {rows.map((a) => {
            const now = current[a.symbol] ?? 0;
            const want = weights[a.symbol] ?? 0;
            const trade = trades.get(a.symbol);
            return (
              <li key={a.symbol} className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <AssetIcon symbol={a.symbol} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{a.symbol}</span>
                    <span className="tabular-nums block text-xs text-ink-3">{d.portfolio.now} {percent(now, locale)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <StepButton label={`${a.symbol} −`} onClick={() => setWeight(a.symbol, want - 1)} disabled={want <= 0}>−</StepButton>
                    <span className="relative">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={100}
                        value={want}
                        onChange={(ev) => setWeight(a.symbol, Number(ev.target.value))}
                        aria-label={`${a.symbol} ${t.target} %`}
                        className="tabular-nums h-10 w-[64px] rounded-xl border border-line bg-surface pl-2 pr-6 text-right font-semibold text-ink outline-none [appearance:textfield] focus:border-accent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-ink-3">%</span>
                    </span>
                    <StepButton label={`${a.symbol} +`} onClick={() => setWeight(a.symbol, want + 1)} disabled={want >= 100}>+</StepButton>
                  </span>
                </div>
                {trade && (
                  <p className="tabular-nums mt-1.5 pl-12 text-xs">
                    <span className={cx("font-semibold", trade.side === "SELL" ? "text-danger" : "text-ok")}>{fmt(trade.side === "SELL" ? t.sell : t.buy, { amount: usd(trade.valueUsd, locale, 0) })}</span>
                    <span className="text-ink-3"> · {tokens(trade.amountTokens, locale)} {a.symbol}</span>
                  </p>
                )}
              </li>
            );
          })}
          <li className="flex items-center justify-between gap-3 px-4 py-3.5">
            <span className="font-semibold text-ink">{d.portfolio.total}</span>
            <span className="flex items-center gap-3">
              {!ok && <Button size="sm" variant="secondary" onClick={autoBalance}>{d.portfolio.autoBalance}</Button>}
              <span className={cx("tabular-nums font-semibold", ok ? "text-ok" : "text-warn")}>{percent(total, locale, 0)}</span>
            </span>
          </li>
        </ul>

        <div className="mt-6 hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[520px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th scope="col" className={th}>{t.token}</th>
                <th scope="col" className={th}>{d.portfolio.now}</th>
                <th scope="col" className={th}>{t.target}</th>
                <th scope="col" className={th}>{e.change}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const now = current[a.symbol] ?? 0;
                const want = weights[a.symbol] ?? 0;
                const trade = trades.get(a.symbol);
                const quiet = now === 0 && want === 0;
                return (
                  <tr key={a.symbol} className="[&>td]:border-b [&>td]:border-line">
                    <td className={cx("px-4 py-3.5", quiet && "opacity-60")}>
                      <span className="flex min-w-0 items-center gap-3">
                        <AssetIcon symbol={a.symbol} size={32} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink">{a.symbol}</span>
                          <span className="block truncate text-xs text-ink-3">{d.portfolio.classes[a.class]}</span>
                        </span>
                      </span>
                    </td>
                    <td className={cx("tabular-nums px-4 py-3.5 text-right text-ink-2", quiet && "opacity-60")}>{percent(now, locale)}</td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center justify-end gap-1.5">
                        <StepButton label={`${a.symbol} −`} onClick={() => setWeight(a.symbol, want - 1)} disabled={want <= 0}>−</StepButton>
                        <span className="relative">
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={100}
                            value={want}
                            onChange={(ev) => setWeight(a.symbol, Number(ev.target.value))}
                            aria-label={`${a.symbol} ${t.target} %`}
                            className="tabular-nums h-10 w-[72px] rounded-xl border border-line bg-surface pl-3 pr-7 text-right font-semibold text-ink outline-none [appearance:textfield] focus:border-accent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-3">%</span>
                        </span>
                        <StepButton label={`${a.symbol} +`} onClick={() => setWeight(a.symbol, want + 1)} disabled={want >= 100}>+</StepButton>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm">
                      {trade ? (
                        <>
                          <span className={cx("block font-semibold", trade.side === "SELL" ? "text-danger" : "text-ok")}>{fmt(trade.side === "SELL" ? t.sell : t.buy, { amount: usd(trade.valueUsd, locale, 0) })}</span>
                          <span className="tabular-nums block text-xs text-ink-3">{tokens(trade.amountTokens, locale)} {a.symbol}</span>
                        </>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="px-4 py-4 font-semibold text-ink">{d.portfolio.total}</td>
                <td className="tabular-nums px-4 py-4 text-right text-ink-2">{percent(Object.values(current).reduce((s, v) => s + v, 0), locale, 0)}</td>
                <td className={cx("tabular-nums px-4 py-4 text-right font-semibold", ok ? "text-ok" : "text-warn")}>{percent(total, locale, 0)}</td>
                <td className="px-4 py-4 text-right">{!ok && <Button size="sm" variant="secondary" onClick={autoBalance}>{d.portfolio.autoBalance}</Button>}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {!ok && <p className="mt-2 text-sm text-warn">{fmt(d.portfolio.totalOff, { pct: percent(total, locale, 0) })}</p>}
      </div>

      <aside className="grid gap-4 rounded-[24px] border border-line bg-surface p-5 lg:sticky lg:top-6">
        <h3 className="text-lg font-semibold tracking-tight text-ink">{e.summary}</h3>
        <dl className="grid gap-3 text-sm">
          <SummaryRow label={e.toSell} value={<span className="text-danger">{usd(sellUsd, locale)}</span>} />
          <SummaryRow label={e.toBuy} value={<span className="text-ok">{usd(buyUsd, locale)}</span>} />
          <SummaryRow label={d.portfolio.total} value={<span className={ok ? "text-ok" : "text-warn"}>{percent(total, locale, 0)}</span>} />
        </dl>
        {preview && preview.trades.length === 0 && ok && <p className="rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok">{d.portfolio.noTrades}</p>}
        {preview && !preview.ok && preview.problems.length > 0 && <ErrorNote>{preview.problems.join(" ")}</ErrorNote>}

        <details className="group border-t border-line pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink">
            {d.portfolio.advanced}
            <span className="text-ink-3 transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
          </summary>
          <div className="mt-4 grid gap-5">
            <label className="grid gap-2">
              <span className="flex items-center justify-between gap-3 text-sm text-ink-2">
                {d.portfolio.costCap}
                <span className="tabular-nums font-semibold text-ink">{percent(costCapBps / 100, locale)}</span>
              </span>
              <input type="range" min={10} max={300} step={10} value={costCapBps} onChange={(ev) => setCostCapBps(Number(ev.target.value))} className="accent-[var(--accent)]" />
              <span className="text-xs text-ink-3">{d.portfolio.costCapHelp}</span>
            </label>
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm text-ink-2">{d.portfolio.residualStyle} (<Term k="leftover" />)</legend>
              {(["ECONOMIC", "CARRY_FORWARD", "CANCEL"] as const).map((s) => (
                <label key={s} className={cx("flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors", residualStyle === s ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-2 hover:bg-surface-2")}>
                  <input type="radio" name="residual" checked={residualStyle === s} onChange={() => setResidualStyle(s)} className="accent-[var(--accent)]" />
                  {d.portfolio.residualStyles[s]}
                </label>
              ))}
            </fieldset>
          </div>
        </details>

        {act.error && <ErrorNote>{act.error}</ErrorNote>}
        <Button size="lg" block onClick={save} busy={act.pending} disabled={!ok || (preview !== null && !preview.ok)}>{act.pending ? d.common.saving : d.portfolio.saveTarget}</Button>
        {saved && <Badge tone="ok" className="justify-self-center">{d.portfolio.saved}</Badge>}
      </aside>
    </div>
  );
}

function StepButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className="grid size-8 place-items-center rounded-full text-lg leading-none text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30">
      {children}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-2">{label}</dt>
      <dd className="tabular-nums font-semibold">{value}</dd>
    </div>
  );
}
