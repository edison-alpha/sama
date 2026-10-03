"use client";

import dynamic from "next/dynamic";
import { createContext, useContext } from "react";
import type { Session } from "@/lib/api/types";
import type { Signer as ApiSigner } from "@/lib/api/contract";

export type SignInMethod = "email" | "wallet";

export type SessionState = {
  session: Session | null;
  ready: boolean;
  /** Opens the Privy login modal, narrowed to one method when given. */
  signIn: (method?: SignInMethod) => void;
  signOut: () => void;
  signer: ApiSigner;
  wrongNetwork: boolean;
  switchNetwork: () => Promise<void>;
  error: string | null;
};

export const SessionContext = createContext<SessionState | null>(null);

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}

/** Wallet SDKs load only on pages that need a session, never on the landing page (PRD §19.9). */
const PrivySession = dynamic(() => import("./privy-session").then((m) => m.PrivySession), { ssr: false });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <PrivySession>{children}</PrivySession>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const demoHash = () => `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}` as `0x${string}`;

/** Signer used while screens run on demo data: pretends to open the wallet, then returns a random hash. Nothing leaves the browser. */
export const demoSigner: ApiSigner = {
  signTypedData: async () => {
    await wait(600);
    return demoHash();
  },
  send: async () => {
    await wait(900);
    return demoHash();
  },
};
