"use client";

import { useState } from "react";
import { encodeFunctionData, erc20Abi, isAddress, parseUnits } from "viem";
import { useSession } from "@/components/wallet/session";
import { AssetIcon } from "@/components/asset-icon";
import { Dropdown, DropdownChevron } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/wallet/user-avatar";
import { ErrorNote } from "@/components/ui/states";
import { sama } from "@/lib/api";
import type { Asset, Position } from "@/lib/api/types";
import { txUrl } from "@/lib/chain";
import { short, tokens, usd as usdText } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

type Step = "recipient" | "amount";

/**
 * Send a token from the connected wallet to any address. Two steps, like a wallet app: pick the recipient, then type
 * the amount on the keypad. A bottom sheet on phones, a centred dialog on desktop. The wallet signs a plain ERC-20
 * transfer, so Sama never holds the funds; afterwards the server scans the chain so it shows in Activity straight away.
 */
export function SendTokenModal({ assets, positions, onClose, onSent }: { assets: Asset[]; positions: Position[]; onClose: () => void; onSent: () => void }) {
  const { d, fmt, locale } = useI18n();
  const s = d.send;
  const { signer } = useSession();
  // Only tokens the wallet actually holds can be sent, so the list is built from balances.
  const held = positions
    .filter((p) => p.amountTokens > 0)
    .map((p) => ({ position: p, asset: assets.find((a) => a.symbol === p.symbol) }))
    .filter((x): x is { position: Position; asset: Asset } => !!x.asset);

  const [step, setStep] = useState<Step>("recipient");
  const [query, setQuery] = useState("");
  const [to, setTo] = useState("");
  const [symbol, setSymbol] = useState(held[0]?.asset.symbol ?? "");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentHash, setSentHash] = useState<string | null>(null);

  const asset = held.find((x) => x.asset.symbol === symbol)?.asset;
  const balance = held.find((x) => x.asset.symbol === symbol)?.position.amountTokens ?? 0;
  const typed = Number(amount) || 0;
  const candidate = isAddress(query.trim(), { strict: false }) ? query.trim() : "";

  const pickRecipient = (address: string) => {
    setTo(address);
    setError(null);
    setStep("amount");
  };

  // Keypad: digits and one decimal point, never more decimals than the token has, no stray leading zeros.
  const press = (key: string) => {
    setError(null);
    const decimals = asset?.decimals ?? 18;
    setAmount((a) => {
      if (key === "back") return a.slice(0, -1);
      if (key === ".") return a.includes(".") ? a : `${a || "0"}.`;
      if (a.includes(".")) return a.split(".")[1]!.length >= decimals ? a : a + key;
      if (a === "0") return key;
      return a.length >= 18 ? a : a + key;
    });
  };

  // Max fills the whole balance, cut to the token's decimals and without trailing zeros.
  const fillMax = () => {
    const decimals = asset?.decimals ?? 18;
    setAmount(balance.toFixed(Math.min(decimals, 18)).replace(/\.?0+$/, "") || "0");
  };

  const canSend = !!asset && typed > 0 && typed <= balance && !!to;

  const submit = async () => {
    setError(null);
    if (!asset) return setError(s.pickAsset);
    if (!isAddress(to, { strict: false })) return setError(s.badAddress);
    let raw: bigint;
    try {
      raw = parseUnits(amount.trim(), asset.decimals);
    } catch {
      return setError(s.badAmount);
    }
    if (raw <= 0n) return setError(s.badAmount);
    if (typed > balance) return setError(s.notEnough);
    setBusy(true);
    try {
      const data = encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [to as `0x${string}`, raw] });
      const hash = await signer.send({ to: asset.address, data });
      setSentHash(hash);
      await sama.syncTransfers();
      onSent();
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(false);
    }
  };

  const ctaLabel = !asset || typed <= 0 ? s.enterAmount : typed > balance ? fmt(s.notEnoughSymbol, { symbol }) : fmt(s.sendSymbol, { symbol });
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center md:p-4" role="dialog" aria-modal="true" aria-label={s.title}>
      <div className="flex h-[100dvh] w-full flex-col bg-[var(--app-bg)] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] md:h-auto md:max-h-[86dvh] md:max-w-md md:rounded-[28px] md:border md:border-line md:pb-0 md:pt-0 md:shadow-[var(--elev-float)]">
        {/* Grab handle on phones, as in native sheets. */}
        <span className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-surface-3 md:hidden" aria-hidden="true" />

        <header className="grid shrink-0 grid-cols-[40px_1fr_40px] items-center px-4 pt-3 md:px-5 md:pt-5">
          {step === "amount" && !sentHash ? (
            <button type="button" onClick={() => setStep("recipient")} aria-label={s.back} className="grid size-10 place-items-center rounded-full text-ink hover:bg-surface-2">
              <BackIcon />
            </button>
          ) : (
            <span />
          )}
          <h2 className="text-center text-lg font-semibold tracking-tight text-ink">{sentHash ? "" : step === "recipient" ? s.selectRecipient : s.open}</h2>
          <button type="button" onClick={onClose} aria-label={s.dismiss} className="grid size-10 place-items-center justify-self-end rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink">
            <CloseIcon />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4">
          {sentHash ? (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Success view, like a wallet app: a big check, the amount and recipient, and Done pinned at the bottom. */}
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <span className="grid size-24 place-items-center rounded-full bg-ok/15 text-ok" aria-hidden="true">
                  <CheckBadgeIcon />
                </span>
                <h3 className="text-2xl font-semibold tracking-tight text-ink">{s.sentTitle}</h3>
                <p className="num text-[32px] font-semibold tracking-tight text-ink">{amount} {symbol}</p>
                <div className="flex items-center gap-2 text-sm text-ink-3">
                  <UserAvatar name={to} size={20} />
                  <span className="num">{short(to)}</span>
                </div>
                <p className="max-w-xs text-sm text-ink-3">{s.sentBody}</p>
                <a className="num break-all text-sm text-ink-3 no-underline transition-colors hover:text-ink hover:underline" href={txUrl(sentHash)} target="_blank" rel="noreferrer">{short(sentHash)}</a>
              </div>
              <Button size="lg" block onClick={onClose}>{s.close}</Button>
            </div>
          ) : step === "recipient" ? (
            <div className="grid gap-4">
              <label className="flex h-12 items-center gap-3 rounded-2xl bg-surface-2 px-4 text-ink-3 focus-within:ring-1 focus-within:ring-line-strong">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={s.searchPlaceholder} aria-label={s.searchPlaceholder} autoComplete="off" autoFocus className="h-full w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3" />
              </label>

              {candidate ? (
                <button type="button" onClick={() => pickRecipient(candidate)} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-surface-2">
                  <UserAvatar name={candidate} size={40} />
                  <span className="num font-semibold text-ink">{short(candidate)}</span>
                </button>
              ) : query.trim() ? (
                <p className="mt-6 text-center text-sm text-ink-3">{s.badAddress}</p>
              ) : (
                <div className="grid justify-items-center gap-1 pt-16 text-center">
                  <p className="text-[15px] text-ink-2">{s.recipientEmpty}</p>
                  <p className="max-w-xs text-sm text-ink-3">{s.recipientEmptyHint}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              {/* Amount card: token picker, the typed amount, its value and the balance with Max. */}
              <div className="rounded-[20px] border border-line p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-ink-3">{s.asset}</span>
                  <Dropdown
                    value={symbol}
                    onChange={(v) => {
                      setSymbol(v);
                      setAmount("");
                    }}
                    label={s.asset}
                    menuClassName="max-h-72 w-72 max-w-[calc(100vw-40px)]"
                    align="end"
                    triggerClassName="inline-flex h-10 items-center gap-2 rounded-full border border-line pl-1 pr-3 text-base font-semibold text-ink transition-colors hover:bg-surface-2 aria-expanded:bg-surface-2"
                    options={held.map((x) => ({ value: x.asset.symbol, label: x.asset.symbol, sub: x.asset.name, trailing: tokens(x.position.amountTokens, locale), icon: <AssetIcon symbol={x.asset.symbol} size={28} /> }))}
                  >
                    {(selected, open) => (
                      <>
                        {selected && <AssetIcon symbol={selected.value} size={28} />}
                        <span>{selected?.label ?? "—"}</span>
                        <DropdownChevron open={open} className="text-ink-2" />
                      </>
                    )}
                  </Dropdown>
                </div>
                {/* Phones type on the keypad below; desktop types straight into the amount. */}
                <p className="num mt-4 truncate text-[40px] font-semibold leading-tight tracking-tight text-ink md:hidden">{amount || "0"}</p>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    setError(null);
                    const v = e.target.value.replace(",", ".");
                    const decimals = asset?.decimals ?? 18;
                    if (/^\d*\.?\d*$/.test(v) && (v.split(".")[1]?.length ?? 0) <= decimals) setAmount(v);
                  }}
                  placeholder="0"
                  aria-label={s.amount}
                  className="num mt-4 hidden w-full bg-transparent text-[40px] font-semibold leading-tight tracking-tight text-ink outline-none placeholder:text-ink-3 md:block"
                />
                <div className="mt-1 flex items-center justify-between gap-3 text-sm text-ink-3">
                  <span className="num">{asset ? usdText(typed * asset.priceUsd, locale) : "$0"}</span>
                  <span className="flex items-center gap-2">
                    <span className="num">{tokens(balance, locale)} {symbol}</span>
                    <button type="button" onClick={fillMax} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-ink-2 hover:bg-surface-3">{s.max}</button>
                  </span>
                </div>
              </div>

              <div className="relative z-10 -my-5 mx-auto grid size-10 place-items-center rounded-2xl border border-line bg-surface-2 text-ink-2" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-6-6 6 6 6-6" /></svg>
              </div>

              {/* Recipient card: tap to change it. */}
              <button type="button" onClick={() => setStep("recipient")} className="flex items-center gap-3 rounded-[20px] border border-line p-4 text-left transition-colors hover:bg-surface-2">
                <UserAvatar name={to} size={36} />
                <span className="num font-semibold text-ink">{short(to)}</span>
              </button>

              {error && <ErrorNote>{error}</ErrorNote>}

              {/* Keypad fills the rest of the sheet, as in wallet apps. */}
              <div className="mt-auto grid grid-cols-3 gap-y-1 pt-3 md:hidden">
                {keys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => press(k)}
                    aria-label={k === "back" ? s.back : k}
                    className="grid h-14 place-items-center rounded-2xl text-[28px] font-medium text-ink transition-colors hover:bg-surface-2 active:bg-surface-3"
                  >
                    {k === "back" ? <BackspaceIcon /> : k}
                  </button>
                ))}
              </div>

              <Button size="lg" block busy={busy} disabled={!canSend} onClick={() => void submit()} className="mt-2">
                {ctaLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Solar "verified-check-bold": the check-in-badge shown when a transfer is sent. */
function CheckBadgeIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M9.5924 3.20027C9.34888 3.4078 9.22711 3.51158 9.09706 3.59874C8.79896 3.79854 8.46417 3.93721 8.1121 4.00672C7.95851 4.03705 7.79903 4.04977 7.48008 4.07522C6.6787 4.13918 6.278 4.17115 5.94371 4.28923C5.17051 4.56233 4.56233 5.17051 4.28923 5.94371C4.17115 6.278 4.13918 6.6787 4.07522 7.48008C4.04977 7.79903 4.03705 7.95851 4.00672 8.1121C3.93721 8.46417 3.79854 8.79896 3.59874 9.09706C3.51158 9.22711 3.40781 9.34887 3.20027 9.5924C2.67883 10.2043 2.4181 10.5102 2.26522 10.8301C1.91159 11.57 1.91159 12.43 2.26522 13.1699C2.41811 13.4898 2.67883 13.7957 3.20027 14.4076C3.40778 14.6511 3.51158 14.7729 3.59874 14.9029C3.79854 15.201 3.93721 15.5358 4.00672 15.8879C4.03705 16.0415 4.04977 16.201 4.07522 16.5199C4.13918 17.3213 4.17115 17.722 4.28923 18.0563C4.56233 18.8295 5.17051 19.4377 5.94371 19.7108C6.278 19.8288 6.6787 19.8608 7.48008 19.9248C7.79903 19.9502 7.95851 19.963 8.1121 19.9933C8.46417 20.0628 8.79896 20.2015 9.09706 20.4013C9.22711 20.4884 9.34887 20.5922 9.5924 20.7997C10.2043 21.3212 10.5102 21.5819 10.8301 21.7348C11.57 22.0884 12.43 22.0884 13.1699 21.7348C13.4898 21.5819 13.7957 21.3212 14.4076 20.7997C14.6511 20.5922 14.7729 20.4884 14.9029 20.4013C15.201 20.2015 15.5358 20.0628 15.8879 19.9933C16.0415 19.963 16.201 19.9502 16.5199 19.9248C17.3213 19.8608 17.722 19.8288 18.0563 19.7108C18.8295 19.4377 19.4377 18.8295 19.7108 18.0563C19.8288 17.722 19.8608 17.3213 19.9248 16.5199C19.9502 16.201 19.963 16.0415 19.9933 15.8879C20.0628 15.5358 20.2015 15.201 20.4013 14.9029C20.4884 14.7729 20.5922 14.6511 20.7997 14.4076C21.3212 13.7957 21.5819 13.4898 21.7348 13.1699C22.0884 12.43 22.0884 11.57 21.7348 10.8301C21.5819 10.5102 21.3212 10.2043 20.7997 9.5924C20.5922 9.34887 20.4884 9.22711 20.4013 9.09706C20.2015 8.79896 20.0628 8.46417 19.9933 8.1121C19.963 7.95851 19.9502 7.79903 19.9248 7.48008C19.8608 6.6787 19.8288 6.278 19.7108 5.94371C19.4377 5.17051 18.8295 4.56233 18.0563 4.28923C17.722 4.17115 17.3213 4.13918 16.5199 4.07522C16.201 4.04977 16.0415 4.03705 15.8879 4.00672C15.5358 3.93721 15.201 3.79854 14.9029 3.59874C14.7729 3.51158 14.6511 3.40781 14.4076 3.20027C13.7957 2.67883 13.4898 2.41811 13.1699 2.26522C12.43 1.91159 11.57 1.91159 10.8301 2.26522C10.5102 2.4181 10.2043 2.67883 9.5924 3.20027ZM16.3735 9.86314C16.6913 9.5453 16.6913 9.03 16.3735 8.71216C16.0557 8.39433 15.5403 8.39433 15.2225 8.71216L10.3723 13.5624L8.77746 11.9676C8.45963 11.6498 7.94432 11.6498 7.62649 11.9676C7.30866 12.2854 7.30866 12.8007 7.62649 13.1186L9.79678 15.2889C10.1146 15.6067 10.6299 15.6067 10.9478 15.2889L16.3735 9.86314Z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
  );
}

function BackspaceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM18 9l-6 6M12 9l6 6" /></svg>
  );
}
