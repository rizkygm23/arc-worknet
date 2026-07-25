"use client";

import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { useWorkNet } from "@/lib/store";
import { AppKitBridgePanel } from "@/components/AppKitBridgePanel";

const APP_KIT_KEY = process.env.NEXT_PUBLIC_CIRCLE_APP_KIT_KEY;
const ONRAMP_URL = process.env.NEXT_PUBLIC_CIRCLE_ONRAMP_URL;

export function AddFundsButton({ compact = false }: { compact?: boolean }) {
  const { wallet } = useWorkNet();
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const configured = Boolean(APP_KIT_KEY || ONRAMP_URL);
  const className = compact ? "button ghost small" : "button";

  useEffect(() => {
    if (!showModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showModal]);

  function launch() {
    if (APP_KIT_KEY) {
      setShowModal(true);
      return;
    }
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

      {showModal ? (
        <div
          className="bridge-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bridge-dialog-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowModal(false);
          }}
        >
          <div className="bridge-modal-shell">
            <AppKitBridgePanel onClose={() => setShowModal(false)} />
          </div>
        </div>
      ) : null}

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
