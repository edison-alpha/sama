"use client";

import { useRouter } from "next/navigation";
import { LocaleSegmented, ThemeSegmented } from "@/components/shell/preferences";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/states";
import { useSession } from "@/components/wallet/session";
import { API_MODE, sama } from "@/lib/api";
import { resetDemo } from "@/lib/api/mock";
import type { Settings } from "@/lib/api/types";
import { useApi } from "@/lib/api/use-api";
import { addressUrl, isTestnet, SAMA_CHAIN_ID } from "@/lib/chain";
import { useI18n } from "@/lib/i18n/provider";
import { Stagger } from "@/components/motion";

export default function SettingsPage() {
  const { d } = useI18n();
  const router = useRouter();
  const { session, signOut } = useSession();
  const { data: s, refresh } = useApi(() => sama.settings(), []);
  if (!s || !session) return <PageSkeleton />;

  const update = async (patch: Partial<Settings>) => {
    await sama.saveSettings({ ...s, ...patch });
    await refresh();
  };

  return (
    <Stagger>
      <PageHeader title={d.settings.title} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={d.settings.wallet} />
          <dl className="grid gap-3 text-sm">
            <Row k={d.settings.address} v={<a className="num break-all text-accent hover:underline" href={addressUrl(session.address)} target="_blank" rel="noreferrer">{session.address}</a>} />
            <Row k={d.settings.network} v={`${isTestnet ? d.network.testnet : d.network.label} (${SAMA_CHAIN_ID})`} />
          </dl>
          <Button variant="secondary" className="mt-5" onClick={() => { signOut(); router.push("/"); }}>{d.common.signOut}</Button>
        </Card>

        <Card>
          <CardHeader title={d.settings.appearance} />
          <div className="grid gap-4">
            <div className="grid gap-2"><span className="text-sm font-medium">{d.language.label}</span><LocaleSegmented /></div>
            <div className="grid gap-2"><span className="text-sm font-medium">{d.theme.label}</span><ThemeSegmented /></div>
          </div>
        </Card>

        <Card>
          <CardHeader title={d.settings.notifications} sub={d.settings.notifyHelp} />
          <div className="grid gap-3">
            {(["inApp", "email", "telegram"] as const).map((k) => (
              <label key={k} className="flex items-center justify-between gap-3 text-sm">
                {d.settings.notify[k]}
                <input type="checkbox" checked={s.notify[k]} onChange={(e) => void update({ notify: { ...s.notify, [k]: e.target.checked } })} className="size-5 accent-[var(--accent)]" />
              </label>
            ))}
          </div>
          {s.notify.telegram && <Button variant="secondary" size="sm" className="mt-4">{d.settings.connectTelegram}</Button>}
        </Card>

        <Card>
          <CardHeader title={d.settings.gas} />
          <p className="text-sm text-ink-2">{s.gasSponsorship ? d.settings.gasOn : d.settings.gasOff}</p>
          <CardHeader title={d.settings.defaults} />
          <p className="text-sm text-ink-2">{d.portfolio.residualStyles[s.residualStyle]} · {(s.costCapBps / 100).toFixed(1)}%</p>
          {API_MODE === "mock" && <Button variant="ghost" size="sm" className="mt-4" onClick={() => { resetDemo(); window.location.href = "/home"; }}>{d.settings.resetDemo}</Button>}
        </Card>
      </div>
    </Stagger>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-ink-3">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
