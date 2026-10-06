"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AssetIcon } from "@/components/asset-icon";
import { IconCheck, IconSettings } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/list";
import { Sheet } from "@/components/ui/sheet";
import { ErrorNote } from "@/components/ui/states";
import { Term } from "@/components/ui/term";
import { sama } from "@/lib/api";
import type { Asset, Portfolio, ResidualStyle, Target, TargetPreview } from "@/lib/api/types";
import { useAction } from "@/lib/api/use-api";
import { percent, tokens, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { useTokenVisibility } from "@/lib/token-visibility";
import { cx } from "@/utils/cx";

import { APPLY_TARGET_EVENT, PENDING_TARGET_KEY } from "@/components/ai/apply-target";

const PRESET_KEYS = ["balanced", "conservative", "growth"] as const;
type PresetKey = (typeof PRESET_KEYS)[number];

/** Share of the target kept in cash (the stable asset) for each preset; the rest is spread over the risk assets. */
const CASH_SHARE: Record<PresetKey, number> = { conservative: 60, balanced: 30, growth: 10 };
/** With no stock held yet, a preset spreads its risk share over this many catalogue assets (the API lists the best first). */
const STARTER_COUNT = 3;

/**
 * What the wallet holds among the assets Sama trades, as a share of that part only. Other wallet tokens (BNB, listed
 * tokens) are shown in the portfolio but cannot be in a target, so they must not count towards "now" or a preset.
 */
function tradableShares(assets: Asset[], portfolio: Portfolio): Array<{ symbol: string; pct: number }> {
  if (!portfolio.ok) return [];
  const known = new Set(assets.map((a) => a.symbol));
  const held = portfolio.positions.filter((p) => known.has(p.symbol) && p.valueUsd > 0);
  const total = held.reduce((s, p) => s + p.valueUsd, 0);
  return total > 0 ? held.map((p) => ({ symbol: p.symbol, pct: (p.valueUsd / total) * 100 })) : [];
}

/**
 * A preset built from real assets: the cash share goes to the stable asset, the rest is split over the stocks the user
 * holds in proportion to what they hold now. With no stock held, it is split equally over the first catalogue stocks.
 */
function presetFor(key: PresetKey, assets: Asset[], portfolio: Portfolio): Record<string, number> {
  const cash = assets.find((a) => a.class === "CASH")?.symbol;
  const cls = new Map(assets.map((a) => [a.symbol, a.class]));
  let risk = tradableShares(assets, portfolio).filter((p) => cls.get(p.symbol) !== "CASH");
  if (risk.length === 0) risk = assets.filter((a) => a.class !== "CASH").slice(0, STARTER_COUNT).map((a) => ({ symbol: a.symbol, pct: 1 }));
  if (risk.length === 0 || !cash) return {};
  const cashPct = CASH_SHARE[key];
  const riskTotal = risk.reduce((s, p) => s + p.pct, 0);
  const out: Record<string, number> = { [cash]: cashPct };
  for (const p of risk) out[p.symbol] = Math.round(((100 - cashPct) * p.pct) / riskTotal);
  const drift = 100 - Object.values(out).reduce((s, v) => s + v, 0);
  const largest = risk.reduce((a, b) => (out[a.symbol]! >= out[b.symbol]! ? a : b)).symbol;
  out[largest] = out[largest]! + drift;
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v > 0));
}

/**
 * Target editor (PRD §19.4.4) laid out like a DEX page: preset chips and a settings icon on top, one list of tokens
 * with where you are now, the target you type and the server-checked trade it implies. On larger screens a summary
 * box beside it holds the totals and the save button; on phones that becomes a bar pinned above the tab bar so Save
 * is always in reach. Advanced settings open in a sheet. Only a target the server preview accepts can be saved.
 */
export function TargetEditor({ assets, portfolio, target, onSaved }: { assets: Asset[]; portfolio: Portfolio; target: Target | null; onSaved?: () => void }) {
  const { d, fmt, locale } = useI18n();
  const e = d.portfolio.editor;
  const t = d.portfolio.table;
  const [weights, setWeights] = useState<Record<string, number>>(target?.weights ?? presetFor("balanced", assets, portfolio));
  const [costCapBps, setCostCapBps] = useState(target?.costCapBps ?? 100);
  const [residualStyle, setResidualStyle] = useState<ResidualStyle>(target?.residualStyle ?? "ECONOMIC");
  const [preview, setPreview] = useState<TargetPreview | null>(null);
  const [saved, setSaved] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const act = useAction();
  // The global AI assistant can hand over weights ("Apply to my target"). They arrive as an event when this page is open,
  // or through sessionStorage when the assistant first navigated here.

  const total = Object.values(weights).reduce((s, w) => s + w, 0);
  const ok = Math.abs(total - 100) < 0.05;
  const current: Record<string, number> = Object.fromEntries(tradableShares(assets, portfolio).map((p) => [p.symbol, p.pct]));
  const trades = new Map((preview?.trades ?? []).map((x) => [x.symbol, x]));
  const sellUsd = (preview?.trades ?? []).filter((x) => x.side === "SELL").reduce((s, x) => s + x.valueUsd, 0);
  const buyUsd = (preview?.trades ?? []).filter((x) => x.side === "BUY").reduce((s, x) => s + x.valueUsd, 0);
  // Held tokens first (largest first), then the rest in catalogue order. Fixed while editing, so rows never jump.
  const [rows] = useState(() => [...assets].sort((a, b) => (current[b.symbol] ?? 0) - (current[a.symbol] ?? 0)));
  // With ~90 bStocks the list starts with what the user holds (plus anything already weighted in the target). The
  // rest is added in Manage tokens, and stays listed once it gets a weight.
  const [query, setQuery] = useState("");
  const [pinned, setPinned] = useState(() => new Set(assets.filter((a) => (current[a.symbol] ?? 0) > 0 || (weights[a.symbol] ?? 0) > 0).map((a) => a.symbol)));
  const pin = (symbols: string[]) => setPinned((p) => (symbols.every((s) => p.has(s)) ? p : new Set([...p, ...symbols])));
  useEffect(() => {
    const apply = (w: Record<string, number>) => { pin(Object.keys(w)); setWeights(w); };
    try {
      const raw = window.sessionStorage.getItem(PENDING_TARGET_KEY);
      if (raw) { window.sessionStorage.removeItem(PENDING_TARGET_KEY); apply(JSON.parse(raw) as Record<string, number>); }
    } catch {}
    const onApply = (ev: Event) => { try { window.sessionStorage.removeItem(PENDING_TARGET_KEY); } catch {} apply((ev as CustomEvent<Record<string, number>>).detail); };
    window.addEventListener(APPLY_TARGET_EVENT, onApply);
    return () => window.removeEventListener(APPLY_TARGET_EVENT, onApply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // The user's own show/hide choices sit over the default list. A held or weighted token is always listed: hiding it
  // would count as a 0% target and the next round would sell it.
  const { visibility, setShown, reset: resetVisibility } = useTokenVisibility();
  const locked = (a: Asset) => (current[a.symbol] ?? 0) > 0 || (weights[a.symbol] ?? 0) > 0;
  const hiddenByUser = (a: Asset) => visibility[a.symbol] === false && !locked(a);
  const listedByDefault = (a: Asset) => locked(a) || visibility[a.symbol] === true || pinned.has(a.symbol);
  const q = query.trim().toLowerCase();
  // The page search covers only the tokens listed here; adding others is done in Manage tokens.
  const visible = rows.filter((a) => !hiddenByUser(a) && listedByDefault(a) && (!q || `${a.symbol} ${a.name}`.toLowerCase().includes(q)));
  // Typing in the page search also finds tokens that are not listed yet, each one tap from being added.
  const addable = q ? rows.filter((a) => !visible.includes(a) && `${a.symbol} ${a.name}`.toLowerCase().includes(q)).slice(0, 6) : [];
  const addToken = (a: Asset) => { pin([a.symbol]); setShown(a.symbol, true); };
  const caution = (a: Asset) => (a.leveraged ? e.leveraged : a.tier === "C" ? e.fewHolders : null);

  // Debounced server check: never one request per keystroke.
  useEffect(() => {
    setSaved(false);
    const id = window.setTimeout(() => void sama.previewTarget({ weights, costCapBps, residualStyle }).then(setPreview, () => setPreview(null)), 400);
    return () => window.clearTimeout(id);
  }, [weights, costCapBps, residualStyle]);

  const setWeight = (symbol: string, value: number) => {
    pin([symbol]);
    setWeights((w) => ({ ...w, [symbol]: Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0))) }));
  };

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

  const canSave = ok && !(preview !== null && !preview.ok);
  const saveLabel = act.pending ? d.common.saving : saved ? d.portfolio.saved : d.portfolio.saveTarget;

  // Messages that matter next to the save action: shown in the summary box on larger screens, under the list on phones.
  const notes = (
    <>
      {preview && preview.ok && preview.problems.length > 0 && <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-ink-2">{preview.problems.join(" ")}</p>}
      {preview && preview.trades.length === 0 && preview.problems.length === 0 && ok && <p className="rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok">{d.portfolio.noTrades}</p>}
      {preview && !preview.ok && preview.problems.length > 0 && <ErrorNote>{preview.problems.join(" ")}</ErrorNote>}
      {act.error && <ErrorNote>{act.error}</ErrorNote>}
    </>
  );

  const th = "bg-surface-2 px-4 py-3.5 text-right text-sm font-medium text-ink-3 first:rounded-l-2xl first:text-left last:rounded-r-2xl";

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="min-w-0">
          {/* Presets fill the numbers in one tap; the gear opens the rarely-touched settings in a sheet. */}
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {PRESET_KEYS.map((k) => {
                const [name, body] = d.portfolio.presets[k];
                const preset = presetFor(k, assets, portfolio);
                const selected = JSON.stringify(preset) === JSON.stringify(weights);
                return (
                  <button
                    key={k}
                    type="button"
                    title={body}
                    aria-pressed={selected}
                    onClick={() => {
                      pin(Object.keys(preset));
                      setWeights(preset);
                    }}
                    className={cx("h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold transition-colors sm:h-10 sm:px-4", selected ? "border-accent bg-accent-soft text-accent" : "border-line text-ink hover:bg-surface-2")}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setAdvancedOpen(true)}
              aria-label={d.portfolio.advanced}
              title={d.portfolio.advanced}
              className="glass-panel grid size-10 shrink-0 place-items-center rounded-full text-ink-2 transition-[filter,color] hover:text-ink hover:brightness-95"
            >
              <IconSettings size={20} />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-2xl bg-surface-2 px-4 text-ink-3 focus-within:ring-1 focus-within:ring-line-strong">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input value={query} onChange={(ev) => setQuery(ev.target.value)} placeholder={e.searchShown} aria-label={e.searchShown} className="h-full w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3" />
            </label>
            <button
              type="button"
              onClick={() => setManageOpen(true)}
              aria-label={e.manage}
              title={e.manage}
              className="inline-flex h-11 shrink-0 items-center rounded-2xl bg-surface-2 px-3.5 text-sm font-semibold text-ink-2 transition-colors hover:text-ink"
            >
              {e.manage}
            </button>
          </div>
          {q && visible.length === 0 && addable.length === 0 && <p className="mt-3 text-sm text-ink-3">{fmt(e.noMatch, { q: query.trim() })}</p>}
          {addable.length > 0 && (
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {addable.map((a) => (
                <li key={a.symbol} className="flex items-center gap-3 px-4 py-2.5">
                  <AssetIcon symbol={a.symbol} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{a.symbol}</span>
                    <span className="block truncate text-xs text-ink-3">{a.name}</span>
                  </span>
                  <button type="button" onClick={() => addToken(a)} aria-label={`${e.addFromSearch}: ${a.symbol}`} className="h-9 shrink-0 rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2">{e.add}</button>
                </li>
              ))}
            </ul>
          )}

          {/* Phones: one row per token (now on the left, the target stepper on the right, the trade underneath). */}
          <ul className={cx("mt-4 divide-y divide-line overflow-hidden rounded-[24px] bg-surface-2/60 sm:hidden", visible.length === 0 && "hidden")}>
            {visible.map((a) => {
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
                      {caution(a) && <span className="block truncate text-xs text-warn">{caution(a)}</span>}
                    </span>
                    <Stepper symbol={a.symbol} value={want} onChange={(v) => setWeight(a.symbol, v)} label={t.target} />
                  </div>
                  {trade && (
                    <p className="tabular-nums mt-1.5 pl-12 text-xs">
                      <span className={cx("font-semibold", trade.side === "SELL" ? "text-danger" : "text-ok")}>{fmt(trade.side === "SELL" ? t.sell : t.buy, { amount: usd(trade.valueUsd, locale, trade.valueUsd < 10 ? 2 : 0) })}</span>
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
                {visible.map((a) => {
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
                            {caution(a) && <span className="block truncate text-xs text-warn">{caution(a)}</span>}
                          </span>
                        </span>
                      </td>
                      <td className={cx("tabular-nums px-4 py-3.5 text-right text-ink-2", quiet && "opacity-60")}>{percent(now, locale)}</td>
                      <td className="px-4 py-3.5">
                        <span className="flex justify-end"><Stepper symbol={a.symbol} value={want} onChange={(v) => setWeight(a.symbol, v)} label={t.target} wide /></span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm">
                        {trade ? (
                          <>
                            <span className={cx("block font-semibold", trade.side === "SELL" ? "text-danger" : "text-ok")}>{fmt(trade.side === "SELL" ? t.sell : t.buy, { amount: usd(trade.valueUsd, locale, trade.valueUsd < 10 ? 2 : 0) })}</span>
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

          {/* Phones: the same messages the summary box shows, plus room so the pinned save bar never covers a row. */}
          <div className="mt-4 grid gap-3 sm:hidden">{notes}</div>
          <div className="h-28 sm:h-24" aria-hidden="true" />
        </div>

        <aside className="hidden gap-4 rounded-[24px] border border-line bg-surface p-5 sm:grid lg:sticky lg:top-6">
          <h3 className="text-lg font-semibold tracking-tight text-ink">{e.summary}</h3>
          <dl className="grid gap-3 text-sm">
            <SummaryRow label={e.toSell} value={<span className="text-danger">{usd(sellUsd, locale)}</span>} />
            <SummaryRow label={e.toBuy} value={<span className="text-ok">{usd(buyUsd, locale)}</span>} />
            <SummaryRow label={d.portfolio.total} value={<span className={ok ? "text-ok" : "text-warn"}>{percent(total, locale, 0)}</span>} />
          </dl>
          {notes}
          <Button size="lg" block onClick={save} busy={act.pending} disabled={!canSave}>{act.pending ? d.common.saving : d.portfolio.saveTarget}</Button>
          {saved && <Badge tone="ok" className="justify-self-center">{d.portfolio.saved}</Badge>}
        </aside>
      </div>

      {/* Phones: totals and Save pinned just above the tab bar. */}
      <div className="fixed inset-x-4 bottom-[calc(max(12px,env(safe-area-inset-bottom))+76px)] z-30 sm:hidden">
        <div className="glass-panel-strong flex items-center gap-3 rounded-[22px] py-2 pl-4 pr-2">
          <div className="min-w-0 flex-1">
            <p className="tabular-nums truncate text-sm font-semibold">
              <span className="text-danger">{fmt(t.sell, { amount: usd(sellUsd, locale, sellUsd < 10 ? 2 : 0) })}</span>
              <span className="text-ink-3"> · </span>
              <span className="text-ok">{fmt(t.buy, { amount: usd(buyUsd, locale, buyUsd < 10 ? 2 : 0) })}</span>
            </p>
            <p className={cx("tabular-nums text-xs", ok ? "text-ink-3" : "text-warn")}>{d.portfolio.total} {percent(total, locale, 0)}</p>
          </div>
          <Button onClick={save} busy={act.pending} disabled={!canSave} icon={saved && !act.pending ? <IconCheck size={16} /> : undefined} className="shrink-0">{saveLabel}</Button>
        </div>
      </div>

      <Sheet
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        title={e.manageTitle}
        wide
        footer={<Button size="lg" block onClick={() => setManageOpen(false)}>{d.common.done}</Button>}
        top={
          // Fixed above the scrolling list, so the search and the help line never scroll away.
          <div className="pb-3">
            <label className="flex h-11 items-center gap-3 rounded-2xl bg-surface-2 px-4 text-ink-3 focus-within:ring-1 focus-within:ring-line-strong">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input value={query} onChange={(ev) => setQuery(ev.target.value)} placeholder={fmt(e.search, { n: assets.filter((a) => a.class !== "CASH").length })} aria-label={fmt(e.search, { n: assets.filter((a) => a.class !== "CASH").length })} className="h-full w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3" />
            </label>
            <p className="mt-3 text-xs leading-relaxed text-ink-3">{e.manageHelp}</p>
          </div>
        }
      >
        <ul className="mt-3 grid w-full min-w-0 grid-cols-1 overflow-x-hidden">
          {rows.filter((a) => !q || `${a.symbol} ${a.name}`.toLowerCase().includes(q)).map((a) => {
            const isLocked = locked(a);
            const on = !hiddenByUser(a) && (isLocked || listedByDefault(a));
            return (
              <li key={a.symbol} className="flex min-w-0 items-center gap-3 py-3">
                <AssetIcon symbol={a.symbol} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold text-ink">{a.name ?? a.symbol}</span>
                  <span className="tabular-nums block truncate text-sm text-ink-3">
                    {a.symbol} · {d.portfolio.now} {percent(current[a.symbol] ?? 0, locale)}
                    {isLocked && <span> · {e.locked}</span>}
                  </span>
                </span>
                <span className={cx("shrink-0", isLocked && "pointer-events-none opacity-50")}>
                  <Toggle checked={on} label={`${a.symbol} ${e.manageTitle}`} onChange={(next) => setShown(a.symbol, next === pinned.has(a.symbol) ? null : next)} />
                </span>
              </li>
            );
          })}
        </ul>
        <button type="button" onClick={resetVisibility} className="mt-4 h-11 w-full rounded-2xl bg-surface-2 text-sm font-semibold text-ink-2 hover:text-ink">{e.resetVisible}</button>
      </Sheet>

      <Sheet open={advancedOpen} onClose={() => setAdvancedOpen(false)} title={d.portfolio.advanced} footer={<Button size="lg" block onClick={() => setAdvancedOpen(false)}>{d.common.done}</Button>}>
        <div className="grid gap-7">
          <label className="grid gap-2">
            <span className="flex items-center justify-between gap-3 text-sm font-medium text-ink">
              {d.portfolio.costCap}
              <span className="tabular-nums font-semibold text-accent">{percent(costCapBps / 100, locale)}</span>
            </span>
            <input type="range" min={10} max={300} step={10} value={costCapBps} onChange={(ev) => setCostCapBps(Number(ev.target.value))} className="accent-[var(--accent)]" />
            <span className="text-xs leading-relaxed text-ink-3">{d.portfolio.costCapHelp}</span>
          </label>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium text-ink">{d.portfolio.residualStyle} (<Term k="leftover" />)</legend>
            <div className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {(["ECONOMIC", "CARRY_FORWARD", "CANCEL"] as const).map((s) => (
                <RadioRow key={s} on={residualStyle === s} onPick={() => setResidualStyle(s)}>{d.portfolio.residualStyles[s]}</RadioRow>
              ))}
            </div>
          </fieldset>
        </div>
      </Sheet>
    </>
  );
}

/** − [value %] + : the target for one token. */
function Stepper({ symbol, value, onChange, label, wide = false }: { symbol: string; value: number; onChange: (v: number) => void; label: string; wide?: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      <StepButton label={`${symbol} −`} onClick={() => onChange(value - 1)} disabled={value <= 0}>−</StepButton>
      <span className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          value={value}
          onChange={(ev) => onChange(Number(ev.target.value))}
          aria-label={`${symbol} ${label} %`}
          className={cx(
            "tabular-nums h-10 rounded-xl border border-line bg-surface text-right font-semibold text-ink outline-none [appearance:textfield] focus:border-accent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            wide ? "w-[72px] pl-3 pr-7" : "w-[64px] pl-2 pr-6",
          )}
        />
        <span className={cx("pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-ink-3", wide ? "right-3" : "right-2.5")}>%</span>
      </span>
      <StepButton label={`${symbol} +`} onClick={() => onChange(value + 1)} disabled={value >= 100}>+</StepButton>
    </span>
  );
}

function StepButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className="grid size-8 place-items-center rounded-full text-lg leading-none text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30">
      {children}
    </button>
  );
}

function RadioRow({ on, onPick, children }: { on: boolean; onPick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onPick} className={cx("flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors", on ? "bg-accent-soft/50" : "hover:bg-surface-2")}>
      <span className={cx("grid size-5 shrink-0 place-items-center rounded-full border-2", on ? "border-accent" : "border-line-strong")} aria-hidden="true">
        <span className={cx("size-2.5 rounded-full bg-accent transition-transform", on ? "scale-100" : "scale-0")} />
      </span>
      <span className="text-[15px] font-medium text-ink">{children}</span>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-2">{label}</dt>
      <dd className="tabular-nums font-semibold">{value}</dd>
    </div>
  );
}
