"use client";

import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand";
import { IconUsers } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorNote, PageSkeleton } from "@/components/ui/states";
import { sama } from "@/lib/api";
import { useApi } from "@/lib/api/use-api";
import { useI18n } from "@/lib/i18n/provider";

const INVITE_KEY = (circleId: string) => `sama_invite_${circleId}`;

/** Remembers an invite code for its circle, so it survives the sign-in detour. */
export function rememberInvite(circleId: string, code: string) {
  try {
    window.sessionStorage.setItem(INVITE_KEY(circleId), code);
  } catch {
    // Storage blocked: the code still travels in the URL.
  }
}

/** The invite code for a circle: from the URL first, then from the invite page that sent the visitor here. */
export function pendingInvite(circleId: string, fromUrl: string | null): string | undefined {
  if (fromUrl) return fromUrl;
  try {
    return window.sessionStorage.getItem(INVITE_KEY(circleId)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function forgetInvite(circleId: string) {
  try {
    window.sessionStorage.removeItem(INVITE_KEY(circleId));
  } catch {
    // Nothing to forget.
  }
}

/**
 * What an invite link shows before sign-in: the circle it opens and one button. The code is checked here (unknown or
 * already used codes say so) and carried to the circle page, where Join redeems it.
 */
export function InviteLanding({ code }: { code: string }) {
  const { d, fmt } = useI18n();
  const router = useRouter();
  const { data, error } = useApi(() => sama.inviteInfo(code), [code]);
  const t = d.invite;

  const open = () => {
    if (!data) return;
    rememberInvite(data.circleId, code);
    router.push(`/circles/${data.circleId}?invite=${encodeURIComponent(code)}`);
  };

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="py-5">
          <BrandLogo href="/" className="h-8" />
        </header>
        <main className="flex flex-1 flex-col justify-center gap-6 pb-16">
          {!data && !error && <PageSkeleton />}
          {error && (
            <>
              <h1 className="text-3xl font-semibold tracking-tight">{t.invalidTitle}</h1>
              <ErrorNote>{error}</ErrorNote>
              <ButtonLink href="/circles" variant="secondary" size="lg" block>{t.browse}</ButtonLink>
            </>
          )}
          {data && (
            <>
              <span className="grid size-16 place-items-center rounded-3xl bg-accent-soft text-accent"><IconUsers size={30} /></span>
              <div>
                <p className="text-sm font-medium text-ink-3">{t.title}</p>
                <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-tight">{data.circleName}</h1>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{fmt(t.body, { name: data.circleName })}</p>
              </div>
              {data.used ? (
                <>
                  <ErrorNote>{t.used}</ErrorNote>
                  <ButtonLink href={`/circles/${data.circleId}`} variant="secondary" size="lg" block>{t.viewCircle}</ButtonLink>
                </>
              ) : (
                <Button size="lg" block onClick={open} className="h-14 text-base">{t.cta}</Button>
              )}
              <p className="text-xs leading-relaxed text-ink-3">{t.note}</p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
