"use client";
// TEMPORARY screenshot harness. Delete after review.
import { useEffect, useState } from "react";
import CirclesPage from "../(app)/circles/page";
import HomePage from "../(app)/home/page";
import { CircleDetail } from "@/components/circles/circle-detail";
import { ReceiptPage } from "@/components/round/receipt-page";
import { RoundJourney } from "@/components/round/round-journey";
import { AppShell } from "@/components/shell/app-shell";
import { SessionContext, demoSigner } from "@/components/wallet/session";

export default function Preview() {
  const [p, setP] = useState<string | null>(null);
  const [arg, setArg] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    setP(q.get("p") ?? "home");
    setArg(q.get("id") ?? "");
  }, []);
  const value = { session: { address: "0x71D6a5c3b2e1f0a9d8c7b6a5f4e3d2c1b0a99498" as const, demo: true }, ready: true, signIn: () => {}, signOut: () => {}, signer: demoSigner, wrongNetwork: false, switchNetwork: async () => {}, error: null };
  if (!p) return null;
  const page =
    p === "circles" ? <CirclesPage /> :
    p === "circle" ? <CircleDetail id={arg} /> :
    p === "round" ? <RoundJourney roundId={arg} /> :
    p === "receipt" ? <ReceiptPage roundId={arg} /> :
    <HomePage />;
  return (
    <SessionContext.Provider value={value}>
      <AppShell>{page}</AppShell>
    </SessionContext.Provider>
  );
}
