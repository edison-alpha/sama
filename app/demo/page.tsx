import { PublicPage } from "@/components/landing/public-page";
import { ButtonLink } from "@/components/ui/button";
import { getDict } from "@/lib/i18n/server";

export default async function DemoPage() {
  const { d } = await getDict();
  return (
    <PublicPage d={d}>
      <div className="rounded-[var(--radius-panel)] bg-sky p-8 text-on-sky sm:p-12">
        <h1 className="text-4xl font-semibold tracking-[-0.04em]">{d.nav.demo}</h1>
        <p className="mt-3 max-w-lg text-white/80">{d.common.demoBanner}</p>
        <ButtonLink href="/start" size="lg" className="mt-8">{d.landing.secondary}</ButtonLink>
      </div>
    </PublicPage>
  );
}
