import { createContext, type ReactNode } from "react";
import type { Signer as ApiSigner } from "@/lib/api/contract";
import { DEMO_ADDRESS } from "@/lib/api/demo-data";

/** components/wallet/session.tsx for the video: always signed in with the demo wallet, no Privy. */
export type SignInMethod = "email" | "wallet";

const hash = () => `0x${"5a3a".repeat(16)}` as `0x${string}`;
export const demoSigner: ApiSigner = {
  signTypedData: async () => hash(),
  send: async () => hash(),
};

const state = {
  session: { address: DEMO_ADDRESS, demo: true, onboardingDone: true },
  ready: true,
  signIn: () => {},
  signOut: () => {},
  signer: demoSigner,
  wrongNetwork: false,
  switchNetwork: async () => {},
  error: null,
};

export type SessionState = typeof state;
export const SessionContext = createContext<SessionState | null>(state);
export const useSession = () => state;
export const SessionProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
