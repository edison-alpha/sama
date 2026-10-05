"use client";

import { AnimatePresence, m } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AssetIcon } from "@/components/asset-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconArrowLeft, IconCheck, IconX } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/states";
import { sama } from "@/lib/api";
import type { Asset, NewCircle, ResidualStyle, Visibility } from "@/lib/api/types";
import { useAction, useApi } from "@/lib/api/use-api";
import { cadence, CADENCES, duration, DURATIONS } from "@/lib/circle-words";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

const DEFAULTS: NewCircle = { name: "", description: "", visibility: "PUBLIC", assetSymbols: [], cadenceSec: 604_800, durationSec: 3_600, minParticipants: 2, residualBehavior: "ECONOMIC" };

/**
 * Create a Circle without leaving the page (PRD §19.4.5): a centred dialog on desktop, a bottom sheet on phones.
 * Four short steps with sensible defaults; assets are picked by logo and symbol like a DEX token selector.
 */
export function CreateCircleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <Sheet onClose={onClose} />}</AnimatePresence>;
}

function Sheet({ onClose }: { onClose: () => void }) {
  const { d, fmt, locale } = useI18n();
  const router = useRouter();
  const { data: assets } = useApi(() => sama.assets(), []);
  const act = useAction();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<NewCircle>(DEFAULTS);
  const set = <K extends keyof NewCircle>(k: K, v: NewCircle[K]) => setForm((f) => ({ ...f, [k]: v }));
  const n = d.circles.new;
  const last = n.steps.length - 1;
  const canNext = [form.name.trim().length >= 3, form.assetSymbols.length >= 2, form.minParticipants >= 2, true][step];

  // Escape closes; the page underneath doesn't scroll while the sheet is up.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const create = () =>
    act.run(async () => {
      const { id } = await sama.createCircle(form);
      router.push(`/circles/${id}`);
    });

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
      <m.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden="true" />
      <m.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-circle-title"
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 36 }}
        className="relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] border border-line bg-[var(--app-bg)] pb-[env(safe-area-inset-bottom)] shadow-[var(--elev-float)] md:max-h-[86dvh] md:max-w-lg md:rounded-[28px] md:pb-0"
      >
        {/* Grab handle on phones, as in native sheets. */}
        <span className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-surface-3 md:hidden" aria-hidden="true" />

        <header className="grid shrink-0 grid-cols-[40px_1fr_40px] items-center px-4 pt-3 md:px-5 md:pt-5">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} aria-label={d.common.back} className="grid size-10 place-items-center rounded-full text-ink hover:bg-surface-2"><IconArrowLeft size={20} /></button>
          ) : <span />}
          <h2 id="create-circle-title" className="text-center text-lg font-semibold tracking-tight text-ink">{n.title}</h2>
          <button type="button" onClick={onClose} aria-label={n.close} className="grid size-10 place-items-center justify-self-end rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink"><IconX size={20} /></button>
        </header>

        <div className="shrink-0 px-5 pt-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {n.steps.map((s, i) => <span key={s} className={cx("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-accent" : "bg-surface-3")} />)}
          </div>
          <p className="mt-2 text-xs font-medium text-ink-3">{fmt(d.start.stepOf, { n: step + 1, total: n.steps.length })} · <span className="text-ink-2">{n.steps[step]}</span></p>
        </div>

        <ScrollArea className="min-h-0 flex-1 px-5 pb-4 pt-5">
          {step === 0 && (
            <div className="grid gap-5">
              <Field label={n.name}>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={n.namePlaceholder} autoFocus className={input} />
              </Field>
              <Field label={n.description}>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={n.descriptionPlaceholder} rows={3} className={cx(input, "h-auto resize-none py-3")} />
              </Field>
              <Group label={n.who}>
                {(["PUBLIC", "INVITE_ONLY", "PRIVATE"] as Visibility[]).map((v) => (
                  <RadioRow key={v} on={form.visibility === v} onPick={() => set("visibility", v)} title={d.circles.visibility[v]} sub={d.circles.visibilityHelp[v]} />
                ))}
              </Group>
            </div>
          )}

          {step === 1 && <AssetPicker assets={assets ?? []} selected={form.assetSymbols} onChange={(s) => set("assetSymbols", s)} />}

          {step === 2 && (
            <div className="grid gap-6">
              <Chips label={n.cadence} options={CADENCES.map((v) => ({ key: String(v), label: cadence(v, d, locale), on: form.cadenceSec === v, pick: () => set("cadenceSec", v) }))} />
              <Chips label={n.duration} options={DURATIONS.map((v) => ({ key: String(v), label: duration(v, locale), on: form.durationSec === v, pick: () => set("durationSec", v) }))} />
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-ink">{n.minPeople}</span>
                <span className="flex items-center gap-1 rounded-full border border-line p-1">
                  <button type="button" onClick={() => set("minParticipants", Math.max(2, form.minParticipants - 1))} disabled={form.minParticipants <= 2} aria-label="−" className="grid size-9 place-items-center rounded-full text-lg text-ink hover:bg-surface-2 disabled:opacity-30">−</button>
                  <span className="num w-8 text-center font-semibold text-ink">{form.minParticipants}</span>
                  <button type="button" onClick={() => set("minParticipants", Math.min(50, form.minParticipants + 1))} disabled={form.minParticipants >= 50} aria-label="+" className="grid size-9 place-items-center rounded-full text-lg text-ink hover:bg-surface-2 disabled:opacity-30">+</button>
                </span>
              </div>
              <Group label={n.leftovers}>
                {(["ECONOMIC", "CARRY_FORWARD", "CANCEL"] as ResidualStyle[]).map((v) => (
                  <RadioRow key={v} on={form.residualBehavior === v} onPick={() => set("residualBehavior", v)} title={d.portfolio.residualStyles[v]} />
                ))}
              </Group>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <p className="text-sm text-ink-2">{n.review}</p>
              <div className="rounded-[20px] border border-line p-4">
                <p className="text-lg font-semibold text-ink">{form.name}</p>
                {form.description && <p className="mt-0.5 text-sm text-ink-3">{form.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.assetSymbols.map((s) => <span key={s} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-2 pl-1 pr-3 text-sm font-medium text-ink"><AssetIcon symbol={s} size={24} />{s}</span>)}
                </div>
              </div>
              <dl className="grid grid-cols-1 divide-y divide-line">
                {[
                  [n.who, d.circles.visibility[form.visibility]],
                  [n.cadence, cadence(form.cadenceSec, d, locale)],
                  [n.duration, duration(form.durationSec, locale)],
                  [n.minPeople, String(form.minParticipants)],
                  [n.leftovers, d.portfolio.residualStyles[form.residualBehavior]],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 py-3 text-[15px]">
                    <dt className="text-ink-3">{k}</dt>
                    <dd className="text-right font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </ScrollArea>

        <footer className="shrink-0 border-t border-line px-5 py-4">
          {act.error && <div className="mb-3"><ErrorNote>{act.error}</ErrorNote></div>}
          {step < last ? (
            <Button size="lg" block onClick={() => setStep(step + 1)} disabled={!canNext}>{d.common.continue}</Button>
          ) : (
            <Button size="lg" block onClick={create} busy={act.pending}>{n.create}</Button>
          )}
        </footer>
      </m.div>
    </div>
  );
}

const input = "h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-accent";

/** Token-selector style: search, the picks as logo chips, then one row per asset with a check when picked. */
function AssetPicker({ assets, selected, onChange }: { assets: Asset[]; selected: string[]; onChange: (s: string[]) => void }) {
  const { d, fmt } = useI18n();
  const n = d.circles.new;
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const list = assets.filter((a) => !q || `${a.symbol} ${a.name}`.toLowerCase().includes(q));
  const toggle = (s: string) => onChange(selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s]);

  return (
    <div className="grid gap-4">
      <div>
        <p className="font-semibold text-ink">{n.pickAssets}</p>
        <p className="mt-0.5 text-sm text-ink-3">{n.pickHelp}</p>
      </div>
      <label className="flex h-12 items-center gap-3 rounded-2xl bg-surface-2 px-4 text-ink-3 focus-within:ring-1 focus-within:ring-line-strong">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={n.search} aria-label={n.search} className="h-full w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3" />
      </label>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selected.map((s) => (
            <button key={s} type="button" onClick={() => toggle(s)} aria-label={`${s} ✕`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line pl-1 pr-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2">
              <AssetIcon symbol={s} size={26} />
              {s}
              <IconX size={14} className="text-ink-3" />
            </button>
          ))}
          <span className="text-xs text-ink-3">{fmt(n.selected, { n: selected.length })}</span>
        </div>
      )}

      <ul className="grid grid-cols-1">
        {list.map((a) => {
          const on = selected.includes(a.symbol);
          return (
            <li key={a.uid}>
              <button type="button" aria-pressed={on} onClick={() => toggle(a.symbol)} className={cx("flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors", on ? "bg-accent-soft/50" : "hover:bg-surface-2")}>
                <AssetIcon symbol={a.symbol} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{a.symbol}</span>
                    <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-ink-3">{d.portfolio.classes[a.class]}</span>                  </span>
                  <span className="block truncate text-sm text-ink-3">{a.name}</span>
                  {(a.leveraged || a.tier === "C") && <span className="block truncate text-xs text-warn">{a.leveraged ? d.portfolio.editor.leveraged : d.portfolio.editor.fewHolders}</span>}
                </span>
                <span className={cx("grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors", on ? "border-accent bg-accent text-on-accent" : "border-line-strong text-transparent")} aria-hidden="true">
                  <IconCheck size={14} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-medium text-ink">{label}</legend>
      <div className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-2xl border border-line">{children}</div>
    </fieldset>
  );
}

function RadioRow({ on, onPick, title, sub }: { on: boolean; onPick: () => void; title: string; sub?: string }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onPick} className={cx("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors", on ? "bg-accent-soft/50" : "hover:bg-surface-2")}>
      <span className={cx("grid size-5 shrink-0 place-items-center rounded-full border-2", on ? "border-accent" : "border-line-strong")} aria-hidden="true">
        <span className={cx("size-2.5 rounded-full bg-accent transition-transform", on ? "scale-100" : "scale-0")} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink">{title}</span>
        {sub && <span className="block text-sm leading-snug text-ink-3">{sub}</span>}
      </span>
    </button>
  );
}

function Chips({ label, options }: { label: string; options: Array<{ key: string; label: string; on: boolean; pick: () => void }> }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.key} type="button" aria-pressed={o.on} onClick={o.pick} className={cx("h-10 rounded-full border px-4 text-sm font-semibold transition-colors", o.on ? "border-accent bg-accent-soft text-accent" : "border-line text-ink hover:bg-surface-2")}>{o.label}</button>
        ))}
      </div>
    </fieldset>
  );
}
