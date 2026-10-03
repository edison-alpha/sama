import { Suspense } from "react";
import { Onboarding } from "@/components/onboarding";
import { SessionProvider } from "@/components/wallet/session";

export default function StartPage() {
  return (
    <SessionProvider>
      <Suspense>
        <Onboarding />
      </Suspense>
    </SessionProvider>
  );
}
