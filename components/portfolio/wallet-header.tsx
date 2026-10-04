"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "@/components/icons";
import { useSession } from "@/components/wallet/session";
import { UserAvatar } from "@/components/wallet/user-avatar";
import { short } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

/** Top of the wallet pages: who is connected, with a one-tap address copy. The network chip lives in the shell's top bar. */
export function WalletHeader() {
  const { d } = useI18n();
  const { session } = useSession();
  const [copied, setCopied] = useState(false);
  const address = session?.address;

  async function copy() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  }

  return (
    <header className="mb-6 flex items-center gap-4 pt-2 md:mb-8 md:pt-0">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar name={address ?? "sama"} size={48} />
        <span className="num truncate text-xl font-semibold tracking-tight text-ink">{address ? short(address) : "—"}</span>
        {address && (
          <button type="button" onClick={() => void copy()} className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink" aria-label={copied ? d.common.copied : d.common.copy} title={copied ? d.common.copied : d.common.copy}>
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          </button>
        )}
      </div>
    </header>
  );
}
