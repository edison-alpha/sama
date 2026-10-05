"use client";

import { useState } from "react";
import { useSession } from "@/components/wallet/session";
import { UserAvatar } from "@/components/wallet/user-avatar";
import { IconCheck, IconCopy } from "@/components/icons";
import { short } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

/** Receive sheet: the wallet's own address to copy, so someone can send tokens to it. Same sheet as Send. */
export function ReceiveModal({ onClose }: { onClose: () => void }) {
  const { d } = useI18n();
  const r = d.send.receive;
  const { session } = useSession();
  const address = session?.address ?? "";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked (insecure page or permissions); the full address stays on screen to copy by hand.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center md:p-4" role="dialog" aria-modal="true" aria-label={r.title}>
      <div className="flex w-full flex-col rounded-t-[28px] border border-line bg-[var(--app-bg)] pb-[env(safe-area-inset-bottom)] shadow-[var(--elev-float)] md:max-w-md md:rounded-[28px] md:pb-0">
        <span className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-surface-3 md:hidden" aria-hidden="true" />

        <header className="grid shrink-0 grid-cols-[40px_1fr_40px] items-center px-4 pt-3 md:px-5 md:pt-5">
          <span />
          <h2 className="text-center text-lg font-semibold tracking-tight text-ink">{r.title}</h2>
          <button type="button" onClick={onClose} aria-label={d.send.dismiss} className="grid size-10 place-items-center justify-self-end rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="grid gap-5 px-5 pb-5 pt-4">
          <p className="text-center text-sm text-ink-2">{r.body}</p>

          <div className="flex items-center gap-3 rounded-[20px] border border-line p-4">
            <UserAvatar name={address} size={44} />
            <div className="min-w-0 flex-1">
              <p className="num truncate font-semibold text-ink">{short(address)}</p>
              <p className="num truncate text-xs text-ink-3">{address}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void copy()}
            disabled={!address}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[15px] font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
            {copied ? r.copied : r.copy}
          </button>
        </div>
      </div>
    </div>
  );
}
