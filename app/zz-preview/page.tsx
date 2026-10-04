"use client";
// TEMPORARY screenshot harness. Delete after review.
import { useEffect, useState } from "react";
import CirclesPage from "../(app)/circles/page";
import HomePage from "../(app)/home/page";
import PortfolioPage from "../(app)/portfolio/page";
import { AppShell } from "@/components/shell/app-shell";
import { SessionContext, demoSigner } from "@/components/wallet/session";

export default function Preview() {
  const [p, setP] = useState<string | null>(null);
  useEffect(() => setP(new URLSearchParams(location.search).get("p") ?? "home"), []);
  const value = { session: { address: "0x71D6a5c3b2e1f0a9d8c7b6a5f4e3d2c1b0a99498" as const, demo: true }, ready: true, signIn: () => {}, signOut: () => {}, signer: demoSigner, wrongNetwork: false, switchNetwork: async () => {}, error: null };
  if (!p) return null;
  const page = p === "portfolio" ? <PortfolioPage /> : p === "circles" ? <CirclesPage /> : <HomePage />;
  return (
    <SessionContext.Provider value={value}>
      <AppShell>{page}</AppShell>
    </SessionContext.Provider>
  );
}
