"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";
import { useWorkNet } from "@/lib/store";

/**
 * Add-funds entry point for buying USDC.
 *
 * Circle App Kit / Programmable Wallet (`@circle-fin/w3s-pw-web-sdk`) executes
 * wallet challenges but a fiat on-ramp needs a Circle-issued session. To stay
 * honest (the repo never fakes custody), this component:
 *   - opens a configured hosted on-ramp URL when present, OR
 *   - shows a clear "not configured" state otherwise.
 *
 * Configure NEXT_PUBLIC_CIRCLE_APP_KIT_KEY + NEXT_PUBLIC_CIRCLE_ONRAMP_URL to
 * enable. The connected wallet address is appended so the provider can target it.
 */
const APP_KIT_KEY = process.env.NEXT_PUBLIC_CIRCLE_APP_KIT_KEY;
const ONRAMP_URL = process.env.NEXT_PUBLIC_CIRCLE_ONRAMP_URL;

export function AddFundsButton({ compact = false }: { compact?: boolean }) {
  const { wallet } = useWorkNet();
  const [open, setOpen] = useState(false);

  const configured = Boolean(APP_KIT_KEY && ONRAMP_URL);
  const className = compact ? "button ghost small" : "button";

  function launch() {
    if (!configured || !ONRAMP_URL) {
      setOpen(true);
      return;
    }
    const url = new URL(ONRAMP_URL);
    if (wallet.address) url.searchParams.set("address", wallet.address);
    url.searchParams.set("currency", "USDC");
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <button type="button" className={className} onClick={launch}>
        <CreditCard size={compact ? 12 : 16} />
        Add funds
      </button>

      {open ? (
        <div className="wallet-error" role="note" style={{ marginTop: 8 }}>
          <p className="small muted" style={{ margin: 0 }}>
            Circle on-ramp not configured. Set <code>NEXT_PUBLIC_CIRCLE_APP_KIT_KEY</code> and{" "}
            <code>NEXT_PUBLIC_CIRCLE_ONRAMP_URL</code> to buy USDC with card, or use the{" "}
            <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer">
              Circle testnet faucet
            </a>
            .
          </p>
          <button
            type="button"
            className="button ghost small"
            style={{ marginTop: 8 }}
            onClick={() => setOpen(false)}
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </>
  );
}
