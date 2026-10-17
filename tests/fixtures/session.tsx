"use client";

import { useEffect, useState } from "react";
import PortfolioPage from "@/app/(app)/portfolio/page";
import MarketPage from "@/app/(app)/markets/[symbol]/page";
import CirclesPage from "@/app/(app)/circles/page";
import SettingsPage from "@/app/(app)/settings/page";
import HomePage from "@/app/(app)/home/page";
import ActivityPage from "@/app/(app)/activity/page";
import { AppShell } from "@/components/shell/app-shell";
import { SessionContext, demoSigner, type SessionState } from "@/components/wallet/session";
import { Sheet } from "@/components/ui/sheet";
import { sama } from "@/lib/api";
import { useApi } from "@/lib/api/use-api";

function PollingProbe() {
  const { data } = useApi(async () => (await fetch("/qa-poll")).text(), [], { pollMs: 50 });
  return <p role="status">{data ?? "Waiting"}</p>;
}

const session: SessionState = {
  session: { address: "0x1111111111111111111111111111111111111111", demo: true, onboardingDone: true },
  ready: true, signIn: () => {}, signOut: () => {}, signer: demoSigner,
  wrongNetwork: false, switchNetwork: async () => {}, error: null,
};

/** Only reachable through the development-only, opt-in server route. App authentication is unchanged. */
export function QaFixture({ screen, symbol }: { screen: string; symbol: string }) {
  const [ready, setReady] = useState(false);
  const [walletPromptOpen, setWalletPromptOpen] = useState(false);
  useEffect(() => {
    const open = () => setWalletPromptOpen(true);
    window.addEventListener("qa:walletprompt", open);
    return () => window.removeEventListener("qa:walletprompt", open);
  }, []);
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    const original = sama.settings;
    const originalSave = sama.saveSettings;
    if (symbol === "load-error") sama.settings = async () => { throw new Error("QA settings unavailable"); };
    if (symbol === "save-error") sama.saveSettings = async () => { throw new Error("QA save failed"); };
    setReady(true);
    return () => { sama.settings = original; sama.saveSettings = originalSave; };
  }, [symbol]);
  if (!ready) return null;
  const content = screen === "market" ? <MarketPage />
    : screen === "poll" ? <PollingProbe />
    : screen === "circles" ? <CirclesPage />
    : screen === "settings" ? <SettingsPage />
    : screen === "home" ? <HomePage />
    : screen === "activity" ? <ActivityPage />
    : screen === "sheet" ? <><button type="button" onClick={() => setSheet(true)}>Open test sheet</button><Sheet open={sheet} onClose={() => setSheet(false)} title="Test sheet"><input aria-label="Sheet field" /><button type="button" onClick={() => setSheet(false)}>Done</button></Sheet></>
    : <PortfolioPage />;
  return <SessionContext.Provider value={{ ...session, walletPromptOpen }}><AppShell>{content}</AppShell>{walletPromptOpen && <button type="button" onClick={() => setWalletPromptOpen(false)}>Close wallet prompt</button>}</SessionContext.Provider>;
}
