"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { arcTestnet } from "@/lib/arc";
import { WorkNetProvider } from "@/lib/store";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "clpisxxxx00000000xxxxxxxx";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet],
        appearance: {
          theme: "dark",
          accentColor: "#ffffff",
          logo: undefined,
          showWalletLoginFirst: false,
        },
        loginMethods: ["email", "wallet", "google"],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      <WorkNetProvider>{children}</WorkNetProvider>
    </PrivyProvider>
  );
}
