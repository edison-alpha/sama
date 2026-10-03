"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { ErrorNote, PageSkeleton } from "@/components/ui/states";
import { sama } from "@/lib/api";
import type { NewCircle, ResidualStyle, Visibility } from "@/lib/api/types";
import { useAction, useApi } from "@/lib/api/use-api";
import { cadence, CADENCES, duration, DURATIONS } from "@/lib/circle-words";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

/** Four-step wizard with sensible defaults; a Circle can be created in a handful of taps (PRD §19.4.5). */
export default function NewCirclePage() {
  const { d, locale } = useI18n();
  const router = useRouter();
  const { data: assets } = useApi(() => sama.assets(), []);
  const act = useAction();
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<NewCircle>({ name: "", description: "", visibility: "PUBLIC", assetSymbols: [], cadenceSec: 604_800, durationSec: 3_600, minParticipants: 2, residualBehavior: "ECONOMIC" });
  const set = <K extends keyof NewCircle>(k: K, v: NewCircle[K]) => setForm((f) => ({ ...f, [k]: v }));

  if (!assets) return <PageSkeleton />;
  const n = d.circles.new;
  const canNext = [form.name.trim().length >= 3, form.assetSymbols.length >= 2, form.minParticipants >= 2, true][step];

  const create = () =>
    act.run(async () => {
      const { id } = await sama.createCircle(form);
      router.push(`/circles/${id}`);
    });

  const choice = (selected: boolean) => cx("rounded-2xl border p-4 text-left transition-colors", selected ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-line-strong");

  return (
    <>
      <PageHeader title={n.title} />
      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label={n.title}>
        {n.steps.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined} className="grid gap-2">
            <span className={cx("h-1.5 rounded-full", i <= step ? "bg-accent" : "bg-surface-3")} />
            <span className={cx("text-xs font-medium", i === step ? "text-ink" : "text-ink-3")}>{label}</span>
          </li>
        ))}
      </ol>

      <Card className="grid gap-6">
        {step === 0 && (
          <>
            <Field label={n.name}><input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={n.namePlaceholder} className="h-12 w-full rounded-xl border border-line bg-surface px-4" autoFocus /></Field>
            <Field label={n.description}><textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={n.descriptionPlaceholder} className="min-h-24 w-full rounded-xl border border-line bg-surface p-4" /></Field>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{n.who}</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["PUBLIC", "INVITE_ONLY", "PRIVATE"] as Visibility[]).map((v) => (
                  <button key={v} type="button" aria-pressed={form.visibility === v} onClick={() => set("visibility", v)} className={choice(form.visibility === v)}>
                    <span className="font-semibold">{d.circles.visibility[v]}</span>
                    <span className="mt-1 block text-sm text-ink-2">{d.circles.visibilityHelp[v]}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <p className="font-medium">{n.pickAssets}</p>
              <p className="text-sm text-ink-3">{n.pickHelp}</p>
            </div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={n.search} className="h-11 rounded-xl border border-line bg-surface px-4" aria-label={n.search} />
            <div className="grid gap-2 sm:grid-cols-2">
              {assets.filter((a) => `${a.symbol} ${a.name}`.toLowerCase().includes(query.toLowerCase())).map((a) => {
                const on = form.assetSymbols.includes(a.symbol);
                return (
                  <button key={a.uid} type="button" aria-pressed={on} onClick={() => set("assetSymbols", on ? form.assetSymbols.filter((s) => s !== a.symbol) : [...form.assetSymbols, a.symbol])} className={choice(on)}>
                    <span className="font-semibold">{a.symbol}</span> <span className="text-xs text-ink-3">{d.portfolio.classes[a.class]}</span>
                    <span className="block text-sm text-ink-2">{a.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Pick label={n.cadence} options={CADENCES.map((v) => ({ key: String(v), label: cadence(v, d, locale), on: form.cadenceSec === v, pick: () => set("cadenceSec", v) }))} choice={choice} />
            <Pick label={n.duration} options={DURATIONS.map((v) => ({ key: String(v), label: duration(v, locale), on: form.durationSec === v, pick: () => set("durationSec", v) }))} choice={choice} />
            <Field label={n.minPeople}>
              <input type="number" min={2} max={50} value={form.minParticipants} onChange={(e) => set("minParticipants", Math.max(2, Number(e.target.value)))} className="num h-12 w-28 rounded-xl border border-line bg-surface px-4" />
            </Field>
            <Pick label={n.leftovers} options={(["ECONOMIC", "CARRY_FORWARD", "CANCEL"] as ResidualStyle[]).map((v) => ({ key: v, label: d.portfolio.residualStyles[v], on: form.residualBehavior === v, pick: () => set("residualBehavior", v) }))} choice={choice} />
          </>
        )}

        {step === 3 && (
          <>
            <p className="font-medium">{n.review}</p>
            <dl className="grid gap-3 rounded-2xl bg-surface-2 p-5 text-sm">
              {[
                [n.name, form.name],
                [n.who, d.circles.visibility[form.visibility]],
                [d.circles.assets, form.assetSymbols.join(", ")],
                [n.cadence, cadence(form.cadenceSec, d, locale)],
                [n.duration, duration(form.durationSec, locale)],
                [n.minPeople, String(form.minParticipants)],
                [n.leftovers, d.portfolio.residualStyles[form.residualBehavior]],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><dt className="text-ink-3">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
              ))}
            </dl>
          </>
        )}

        {act.error && <ErrorNote>{act.error}</ErrorNote>}
        <div className="flex justify-between gap-3">
          <Button variant="ghost" onClick={() => (step === 0 ? router.back() : setStep(step - 1))}>{step === 0 ? d.common.cancel : d.common.back}</Button>
          {step < 3 ? <Button onClick={() => setStep(step + 1)} disabled={!canNext}>{d.common.continue}</Button> : <Button onClick={create} busy={act.pending}>{n.create}</Button>}
        </div>
      </Card>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Pick({ label, options, choice }: { label: string; options: Array<{ key: string; label: string; on: boolean; pick: () => void }>; choice: (on: boolean) => string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.key} type="button" aria-pressed={o.on} onClick={o.pick} className={cx(choice(o.on), "px-4 py-2.5 text-sm font-medium")}>{o.label}</button>
        ))}
      </div>
    </fieldset>
  );
}
