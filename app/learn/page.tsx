import { PublicPage } from "@/components/landing/public-page";
import { getDict } from "@/lib/i18n/server";

export default async function LearnPage() {
  const { d } = await getDict();
  return (
    <PublicPage d={d}>
      <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{d.learn.title}</h1>
      <p className="mt-3 text-lg text-ink-2">{d.learn.lead}</p>

      <ol className="mt-10 grid gap-3 sm:grid-cols-2">
        {Object.values(d.round.steps).map((s, i) => (
          <li key={s.title} className="rounded-[var(--radius-card)] bg-surface-2 p-5">
            <span className="num text-sm font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
            <p className="mt-2 font-semibold">{s.title}</p>
            <p className="text-sm text-ink-2">{s.upcoming}</p>
          </li>
        ))}
      </ol>

      <h2 id="glossary" className="mt-16 text-2xl font-semibold tracking-tight">{d.learn.glossaryTitle}</h2>
      <dl className="mt-4 divide-y divide-line">
        {Object.values(d.glossary).map(([word, def]) => (
          <div key={word} className="grid gap-1 py-4 sm:grid-cols-[200px_1fr]">
            <dt className="font-semibold">{word}</dt>
            <dd className="text-ink-2">{def}</dd>
          </div>
        ))}
      </dl>

      <h2 id="faq" className="mt-16 text-2xl font-semibold tracking-tight">{d.learn.faqTitle}</h2>
      <div className="mt-4 grid gap-2">
        {d.faq.map(([q, a]) => (
          <details key={q} className="rounded-2xl bg-surface-2 p-5">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-2 text-ink-2">{a}</p>
          </details>
        ))}
      </div>
      <p id="security" className="mt-10 text-sm text-ink-3">{d.common.notInvestmentAdvice}</p>
    </PublicPage>
  );
}
