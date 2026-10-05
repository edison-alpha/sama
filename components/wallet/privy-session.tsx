"use client";

import { PrivyProvider, getAccessToken, usePrivy, useWallets, type ConnectedWallet } from "@privy-io/react-auth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPublicClient, createWalletClient, custom, http, type Hex, type TypedDataDefinition } from "viem";
import { API_MODE } from "@/lib/api";
import type { Signer } from "@/lib/api/contract";
import { SAMA_CHAIN_ID, samaChain } from "@/lib/chain";
import { clearOnboardingCache, onboardingDone as localOnboardingDone } from "@/lib/onboarding";
import { SessionContext, demoSigner, type SessionState, type SignInMethod } from "./session";

const BASE = process.env.NEXT_PUBLIC_SAMA_API_URL ?? "";
const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
const CLIENT_ID = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || undefined;
const LIVE = API_MODE === "live";

/**
 * Sign-in through Privy (email or an external wallet; email users get an embedded wallet), limited to BNB Smart Chain.
 * With demo data the session is the Privy wallet itself and nothing is signed for real. In live mode the Privy access
 * token is exchanged at POST /api/session, which must verify it server-side before binding the Sama session.
 */
export function PrivySession({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setDark(t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  if (!APP_ID) {
    const value: SessionState = { session: null, ready: true, signIn: () => {}, signOut: () => {}, signer: unavailableSigner, wrongNetwork: false, switchNetwork: async () => {}, error: "Sign-in is not configured (NEXT_PUBLIC_PRIVY_APP_ID)." };
    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
  }
  return (
    <PrivyProvider
      appId={APP_ID}
      clientId={CLIENT_ID}
      config={{
        appearance: { theme: dark ? "dark" : "light", accentColor: "#e97863", logo: dark ? "/sama-brand-logo-ORI.svg" : "/sama-brand-logo-ORI-light.svg", walletChainType: "ethereum-only" },
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
        defaultChain: samaChain,
        supportedChains: [samaChain],
      }}
    >
      <Bridge>{children}</Bridge>
    </PrivyProvider>
  );
}

const unavailableSigner: Signer = {
  signTypedData: () => Promise.reject(new Error("Sign-in is not configured.")),
  send: () => Promise.reject(new Error("Sign-in is not configured.")),
};

/** Privy reports chains as CAIP-2 ("eip155:97"). */
const chainOf = (w: ConnectedWallet) => Number(w.chainId.split(":")[1]);

function Bridge({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const address = (user?.wallet?.address ?? null) as `0x${string}` | null;
  const wallet = useMemo(() => wallets.find((w) => w.address.toLowerCase() === address?.toLowerCase()) ?? null, [wallets, address]);

  // Live mode only: the address the Sama API has bound to this browser's session cookie.
  const [bound, setBound] = useState<`0x${string}` | null>(null);
  const [boundOnboardingDone, setBoundOnboardingDone] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef<string | null>(null);

  useEffect(() => {
    if (!LIVE || !ready || !authenticated || !address) return;
    if (bound?.toLowerCase() === address.toLowerCase() || inflight.current === address) return;
    inflight.current = address;
    void (async () => {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error("Sign-in expired. Please sign in again.");
        const r = await fetch(`${BASE}/api/session`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, address }) });
        const data = (await r.json()) as { user?: { address: `0x${string}`; onboardingDone?: boolean }; error?: string };
        if (!r.ok || !data.user) throw new Error(data.error ?? "Sign-in failed");
        setBound(data.user.address);
        setBoundOnboardingDone(data.user.onboardingDone === true);
        setError(null);
      } catch (e) {
        inflight.current = null;
        setError((e as Error).message);
      }
    })();
  }, [ready, authenticated, address, bound]);

  const ensureWallet = useCallback(async () => {
    if (!wallet) throw new Error("Connect your wallet first.");
    if (chainOf(wallet) !== SAMA_CHAIN_ID) await wallet.switchChain(SAMA_CHAIN_ID);
    const provider = await wallet.getEthereumProvider();
    return createWalletClient({ account: wallet.address as Hex, chain: samaChain, transport: custom(provider) });
  }, [wallet]);

  const signer = useMemo<Signer>(() => {
    if (!LIVE) return demoSigner;
    return {
      async signTypedData(typedData: TypedDataDefinition): Promise<Hex> {
        const client = await ensureWallet();
        return client.signTypedData({ ...typedData, account: client.account } as Parameters<typeof client.signTypedData>[0]);
      },
      async send(tx): Promise<Hex> {
        const client = await ensureWallet();
        // Gas sponsorship (PRD §6.3) plugs in here: route eligible txs to the paymaster instead of the wallet's RPC.
        const hash = await client.sendTransaction({ account: client.account, chain: samaChain, to: tx.to, data: tx.data, value: BigInt(tx.value ?? 0), ...(tx.gas ? { gas: BigInt(tx.gas) } : {}) });
        const receipt = await createPublicClient({ chain: samaChain, transport: http() }).waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") throw new Error(`Transaction ${hash} reverted.`);
        return hash;
      },
    };
  }, [ensureWallet]);

  const signedIn = ready && authenticated && address !== null;
  const session = !signedIn ? null : LIVE
    ? (bound?.toLowerCase() === address.toLowerCase() && boundOnboardingDone !== null ? { address: bound, demo: false, onboardingDone: boundOnboardingDone } : null)
    : { address, demo: true, onboardingDone: localOnboardingDone(address) };

  const value = useMemo<SessionState>(
    () => ({
      session,
      // Live mode waits for the token exchange so a reload doesn't bounce a signed-in user back to /start.
      ready: ready && !(LIVE && signedIn && !session && !error),
      signIn: (method?: SignInMethod) => login(method ? { loginMethods: [method] } : undefined),
      signOut: () => {
        if (LIVE) void fetch(`${BASE}/api/session`, { method: "DELETE", credentials: "include" });
        clearOnboardingCache(address);
        setBound(null);
        setBoundOnboardingDone(null);
        inflight.current = null;
        void logout();
      },
      signer,
      wrongNetwork: LIVE && wallet !== null && chainOf(wallet) !== SAMA_CHAIN_ID,
      switchNetwork: async () => {
        await ensureWallet();
      },
      error,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.address, session?.demo, session?.onboardingDone, ready, signedIn, login, logout, signer, wallet, ensureWallet, error, address],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
