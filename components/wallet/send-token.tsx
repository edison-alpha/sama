"use client";

import { useState } from "react";
import { encodeFunctionData, erc20Abi, isAddress, parseUnits } from "viem";
import { useSession } from "@/components/wallet/session";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/states";
import { sama } from "@/lib/api";
import type { Asset, Position } from "@/lib/api/types";
import { txUrl } from "@/lib/chain";
import { useI18n } from "@/lib/i18n/provider";

/**
 * Send a token from the connected wallet to any address. The wallet signs a plain ERC-20 transfer, so Sama never holds
 * the funds; afterwards the server scans the chain so the transfer appears in Activity straight away.
 */
export function SendTokenModal({ assets, positions, onClose, onSent }: { assets: Asset[]; positions: Position[]; onClose: () => void; onSent: () => void }) {
  const { d } = useI18n();
  const s = d.send;
  const { signer } = useSession();
  const [symbol, setSymbol] = useState(positions[0]?.symbol ?? assets[0]?.symbol ?? "");
  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentHash, setSentHash] = useState<string | null>(null);

  const asset = assets.find((a) => a.symbol === symbol);
  const held = positions.find((p) => p.symbol === symbol)?.amountTokens ?? 0;

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
    if (Number(amount) > held) return setError(s.notEnough);
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

  const field = "h-12 w-full rounded-2xl bg-surface-2 px-4 text-ink outline-none placeholder:text-ink-3";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={s.title}>
      <div className="w-full max-w-md rounded-[24px] border border-line bg-surface p-6">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{s.title}</h2>

        {sentHash ? (
          <div className="mt-4 grid gap-3">
            <p className="text-sm text-ink-2">{s.sentBody}</p>
            <a className="num break-all text-sm text-accent hover:underline" href={txUrl(sentHash)} target="_blank" rel="noreferrer">{sentHash}</a>
            <Button size="lg" block onClick={onClose}>{s.close}</Button>
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm text-ink-3">{s.asset}</span>
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={field}>
                {assets.map((a) => <option key={a.uid} value={a.symbol}>{a.symbol}</option>)}
              </select>
              <span className="text-xs text-ink-3">{s.available}: {held}</span>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm text-ink-3">{s.amount}</span>
              <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className={field} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm text-ink-3">{s.to}</span>
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x…" autoComplete="off" className={field} />
            </label>
            {error && <ErrorNote>{error}</ErrorNote>}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" size="lg" block onClick={onClose}>{s.cancel}</Button>
              <Button size="lg" block busy={busy} onClick={() => void submit()}>{s.send}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
