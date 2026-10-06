"use client";

import { useState } from "react";
import { encodeFunctionData, parseAbi, parseUnits } from "viem";
import { AssetIcon } from "@/components/asset-icon";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/states";
import { useSession } from "@/components/wallet/session";
import { sama } from "@/lib/api";
import type { Asset, Position } from "@/lib/api/types";
import { txUrl } from "@/lib/chain";
import { short, tokens } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";

const wbnbAbi = parseAbi(["function deposit() payable", "function withdraw(uint256 wad)"]);
/** Native BNB kept back on Max, so the wallet can still pay for this and the next transaction. */
const GAS_RESERVE = 0.003;

/**
 * Turns BNB into WBNB and back, one transaction each way. Sama settles ERC-20 tokens only, so the BNB in a target is
 * WBNB; this keeps that out of the way: pick a direction, type an amount, sign. 1 BNB is always 1 WBNB.
 */
export function WrapBnbModal({ assets, positions, onClose, onDone }: { assets: Asset[]; positions: Position[]; onClose: () => void; onDone: () => void }) {
  const { d, fmt, locale } = useI18n();
  const w = d.wrap;
  const { signer } = useSession();
  const wbnb = assets.find((a) => a.symbol === "WBNB");
  const [wrap, setWrap] = useState(true);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const have = (symbol: string) => positions.find((p) => p.symbol === symbol)?.amountTokens ?? 0;
  const balance = wrap ? have("BNB") : have("WBNB");
  const max = wrap ? Math.max(0, balance - GAS_RESERVE) : balance;
  const typed = Number(amount) || 0;
  const from = wrap ? "BNB" : "WBNB";
  const to = wrap ? "WBNB" : "BNB";

  const submit = async () => {
    if (!wbnb) return;
    setError(null);
    let raw: bigint;
    try {
      raw = parseUnits(amount.trim(), 18);
    } catch {
      return setError(w.badAmount);
    }
    if (raw <= 0n || typed > max) return setError(w.badAmount);
    setBusy(true);
    try {
      const tx = wrap
        ? { to: wbnb.address, data: encodeFunctionData({ abi: wbnbAbi, functionName: "deposit" }), value: raw }
        : { to: wbnb.address, data: encodeFunctionData({ abi: wbnbAbi, functionName: "withdraw", args: [raw] }) };
      setHash(await signer.send(tx));
      await sama.syncTransfers();
      onDone();
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(false);
    }
  };

  const label = typed <= 0 ? w.enterAmount : typed > max ? fmt(w.notEnough, { symbol: from }) : fmt(w.cta, { from, to });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center md:p-4" role="dialog" aria-modal="true" aria-label={w.title}>
      <div className="w-full rounded-t-[28px] border border-line bg-[var(--app-bg)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[var(--elev-float)] md:max-w-md md:rounded-[28px]">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-ink">{w.title}</h2>
          <button type="button" onClick={onClose} aria-label={d.send.dismiss} className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </header>

        {hash ? (
          <div className="grid justify-items-center gap-3 py-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-ok/15 text-ok" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
            </span>
            <p className="num text-2xl font-semibold text-ink">{amount} {from} → {to}</p>
            <a href={txUrl(hash)} target="_blank" rel="noreferrer" className="num text-sm text-ink-3 hover:text-ink hover:underline">{short(hash)}</a>
            <Button size="lg" block onClick={onClose} className="mt-3">{d.send.close}</Button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <p className="text-sm text-ink-3">{w.lead}</p>

            <div role="radiogroup" aria-label={w.title} className="grid grid-cols-2 rounded-full border border-line p-1">
              {[true, false].map((isWrap) => (
                <button
                  key={String(isWrap)}
                  type="button"
                  role="radio"
                  aria-checked={wrap === isWrap}
                  onClick={() => { setWrap(isWrap); setAmount(""); setError(null); }}
                  className={cx("h-9 rounded-full text-sm font-semibold transition-colors", wrap === isWrap ? "bg-surface-3 text-ink" : "text-ink-3 hover:text-ink")}
                >
                  {isWrap ? "BNB → WBNB" : "WBNB → BNB"}
                </button>
              ))}
            </div>

            <div className="rounded-[20px] border border-line p-4">
              <div className="flex items-center justify-between gap-3 text-sm text-ink-3">
                <span className="inline-flex items-center gap-2 font-semibold text-ink"><AssetIcon symbol="BNB" size={24} />{from}</span>
                <span className="flex items-center gap-2">
                  <span className="num">{tokens(balance, locale)}</span>
                  <button type="button" onClick={() => setAmount(max.toFixed(8).replace(/\.?0+$/, "") || "0")} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-ink-2 hover:bg-surface-3">{d.send.max}</button>
                </span>
              </div>
              <input
                inputMode="decimal"
                value={amount}
                autoFocus
                onChange={(e) => {
                  setError(null);
                  const v = e.target.value.replace(",", ".");
                  if (/^\d*\.?\d{0,18}$/.test(v)) setAmount(v);
                }}
                placeholder="0"
                aria-label={d.send.amount}
                className="num mt-3 w-full bg-transparent text-[40px] font-semibold leading-tight tracking-tight text-ink outline-none placeholder:text-ink-3"
              />
            </div>

            {wrap && <p className="text-xs text-ink-3">{fmt(w.gasNote, { n: GAS_RESERVE })}</p>}
            {!wbnb && <ErrorNote>{w.noAsset}</ErrorNote>}
            {error && <ErrorNote>{error}</ErrorNote>}

            <Button size="lg" block busy={busy} disabled={!wbnb || typed <= 0 || typed > max} onClick={() => void submit()}>{label}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
