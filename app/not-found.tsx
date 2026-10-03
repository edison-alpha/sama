import { Mark } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";
import { getDict } from "@/lib/i18n/server";

export default async function NotFound() {
  const { d } = await getDict();
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 text-center">
      <div className="grid justify-items-center gap-4">
        <Mark size={48} />
        <h1 className="text-2xl font-semibold">{d.errors.notFound}</h1>
        <ButtonLink href="/">{d.errors.home}</ButtonLink>
      </div>
    </main>
  );
}
