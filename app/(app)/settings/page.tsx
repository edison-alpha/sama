"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconAlert, IconArrowLeft, IconCheck, IconCheckCircle, IconCopy, IconGas, IconGlobe, IconLayers, IconMail, IconMoon, IconPlay, IconPulse, IconShare, IconSun, IconTarget, IconWallet } from "@/components/icons";
import { Stagger, rise } from "@/components/motion";
import { useTheme } from "@/components/shell/preferences";
import { ListRow, ListSection, ScreenHeader, SelectRow, Toggle } from "@/components/ui/list";
import { PageSkeleton } from "@/components/ui/states";
import { useSession } from "@/components/wallet/session";
import { UserAvatar } from "@/components/wallet/user-avatar";
import { API_MODE, sama } from "@/lib/api";
import { resetDemo } from "@/lib/api/mock";
import type { Settings } from "@/lib/api/types";
import { useApi } from "@/lib/api/use-api";
import { addressUrl, isTestnet, SAMA_CHAIN_ID } from "@/lib/chain";
import { short } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { m } from "motion/react";

/** Settings as one list, the way wallet apps lay it out: profile on top, then preferences, notifications, trading, wallet, support. */
export default function SettingsPage() {
  const { d, locale, setLocale } = useI18n();
  const router = useRouter();
  const { session, signOut } = useSession();
  const [theme, setTheme] = useTheme();
  const [copied, setCopied] = useState(false);
  const { data: s, refresh } = useApi(() => sama.settings(), []);
  if (!s || !session) return <PageSkeleton />;

  const st = d.settings;
  const update = async (patch: Partial<Settings>) => {
    await sama.saveSettings({ ...s, ...patch });
    await refresh();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(session.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <Stagger>
      <m.div variants={rise} className="mx-auto max-w-2xl">
        <ScreenHeader title={st.title} />

        <div className="flex items-center gap-4 rounded-[24px] px-1 py-2">
          <UserAvatar name={session.address} size={56} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-lg font-semibold text-ink">{short(session.address)}</span>
            <span className="tabular-nums block truncate text-sm text-ink-3">{short(session.address, 10, 8)}</span>
          </span>
          <button type="button" onClick={() => void copy()} aria-label={copied ? d.common.copied : d.common.copy} title={copied ? d.common.copied : d.common.copy} className="grid size-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2">
            {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
          </button>
        </div>

        <ListSection title={st.sections.preferences} className="mt-6">
          <SelectRow
            icon={theme === "light" ? <IconSun size={22} /> : <IconMoon size={22} />}
            label={d.theme.label}
            value={theme}
            onChange={setTheme}
            options={(["system", "light", "dark"] as const).map((v) => ({ value: v, label: d.theme[v] }))}
          />
          <SelectRow icon={<IconGlobe size={22} />} label={d.language.label} value={locale} onChange={setLocale} options={(["id", "en"] as const).map((v) => ({ value: v, label: d.language[v] }))} />
          <ListRow icon={<IconWallet size={22} />} label={st.currency} value="USD" />
        </ListSection>

        <ListSection title={st.sections.notifications}>
          {(["inApp", "email", "telegram"] as const).map((k) => (
            <ListRow
              key={k}
              icon={k === "inApp" ? <IconPulse size={22} /> : k === "email" ? <IconMail size={22} /> : <IconShare size={22} />}
              label={st.notify[k]}
              trailing={<Toggle label={st.notify[k]} checked={s.notify[k]} onChange={(v) => void update({ notify: { ...s.notify, [k]: v } })} />}
            />
          ))}
          <li className="px-1 pb-1 pt-1 text-sm text-ink-3">{st.notifyHelp}</li>
        </ListSection>

        <ListSection title={st.sections.trading}>
          <ListRow icon={<IconGas size={22} />} label={st.gas} sub={s.gasSponsorship ? st.gasOn : st.gasOff} value={s.gasSponsorship ? st.on : st.off} />
          <ListRow icon={<IconTarget size={22} />} label={st.defaults} value={`${(s.costCapBps / 100).toFixed(1)}%`} sub={d.portfolio.residualStyles[s.residualStyle]} href="/portfolio?tab=target" />
        </ListSection>

        <ListSection title={st.sections.wallet}>
          <ListRow icon={<IconWallet size={22} />} label={st.address} sub={st.explorer} value={short(session.address)} href={addressUrl(session.address)} external />
          <ListRow icon={<IconLayers size={22} />} label={st.network} value={isTestnet ? d.network.testnet : d.network.label} />
          <ListRow icon={<IconLayers size={22} />} label={st.chainId} value={String(SAMA_CHAIN_ID)} />
        </ListSection>

        <ListSection title={st.sections.support}>
          <ListRow icon={<IconPlay size={22} />} label={d.nav.learn} href="/learn" />
          <ListRow icon={<IconCheckCircle size={22} />} label={d.nav.proof} href="/proof" />
          {API_MODE === "mock" && <ListRow icon={<IconAlert size={22} />} label={st.resetDemo} onClick={() => { resetDemo(); window.location.href = "/home"; }} />}
          <ListRow icon={<IconArrowLeft size={22} />} label={d.common.signOut} tone="danger" onClick={() => { signOut(); router.push("/"); }} trailing={<span />} />
        </ListSection>
      </m.div>
    </Stagger>
  );
}
