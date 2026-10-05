import { DocIcon } from "@/components/docs/icon";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocBlocks } from "@/components/docs/blocks";
import { CopyPage } from "@/components/docs/copy-page";
import { DocsTocInline, DocsTocList, DocsTocRail } from "@/components/docs/toc";
import { Inline } from "@/components/docs/inline";
import { docHref, findDoc, tocOf, toMarkdown } from "@/lib/docs";
import { getDict } from "@/lib/i18n/server";

type Props = { params: Promise<{ slug?: string[] }> };

const slugOf = async (params: Props["params"]) => ((await params).slug ?? []).join("/");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ locale }, slug] = await Promise.all([getDict(), slugOf(params)]);
  const found = findDoc(slug);
  if (!found) return {};
  return { title: `${found.page.title[locale]} · Docs`, description: found.page.description[locale] };
}

export default async function DocPageRoute({ params }: Props) {
  const [{ d, locale }, slug] = await Promise.all([getDict(), slugOf(params)]);
  const found = findDoc(slug);
  if (!found) notFound();
  const { page, group, prev, next } = found;
  const toc = tocOf(page, locale);
  const title = page.title[locale];

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_224px] xl:gap-12">
      <article className="mx-auto min-w-0 max-w-[760px] pb-20 pt-8 lg:pt-10 xl:mx-0">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-ink-3">
          <Link href="/docs" className="hover:text-ink">{d.docs.label}</Link>
          <DocIcon name="caretRight" size={14} />
          <span>{group.title[locale]}</span>
          {page.slug && (
            <>
              <DocIcon name="caretRight" size={14} />
              <span className="text-ink-2">{title}</span>
            </>
          )}
        </nav>

        <header className="mt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[2.4rem]">{title}</h1>
            <div className="shrink-0 sm:pt-1.5">
              <CopyPage markdown={toMarkdown(page, locale)} title={title} />
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-3"><Inline text={page.description[locale]} /></p>
        </header>

        <DocsTocInline key={`inline-${page.slug}`} items={toc} />

        <div className="mt-10">
          <DocBlocks blocks={page.blocks} locale={locale} />
        </div>

        <nav aria-label="Pagination" className="mt-16 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
          {prev ? (
            <Link href={docHref(prev.slug)} className="glass-panel group rounded-[20px] p-4 transition-transform hover:-translate-y-0.5">
              <span className="flex items-center gap-1.5 text-xs text-ink-3"><DocIcon name="arrowLeft" size={14} className="transition-transform group-hover:-translate-x-0.5" />{d.docs.previous}</span>
              <span className="mt-1 block font-semibold text-ink">{prev.title[locale]}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link href={docHref(next.slug)} className="glass-panel group rounded-[20px] p-4 text-right transition-transform hover:-translate-y-0.5">
              <span className="flex items-center justify-end gap-1.5 text-xs text-ink-3">{d.docs.next}<DocIcon name="arrowRight" size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
              <span className="mt-1 block font-semibold text-ink">{next.title[locale]}</span>
            </Link>
          )}
        </nav>
      </article>

      {/* The aside stretches the full article height, so the outline inside it can stay sticky. */}
      <aside className="hidden pt-10 xl:block">
        <DocsTocList key={page.slug} items={toc} />
      </aside>
      <DocsTocRail key={`rail-${page.slug}`} items={toc} />
    </div>
  );
}
