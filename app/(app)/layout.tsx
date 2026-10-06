import { AiAssistant } from "@/components/ai/assistant";
import { AppShell } from "@/components/shell/app-shell";
import { SessionProvider } from "@/components/wallet/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
      <AiAssistant />
    </SessionProvider>
  );
}
