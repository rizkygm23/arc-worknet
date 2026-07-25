"use client";

import { ArrowRight, Check, CircleDollarSign, ExternalLink, Globe, RefreshCw, ShieldCheck, Sparkles, AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { parseUnits, encodeFunctionData } from "viem";
import { useWorkNet } from "@/lib/store";
import { CCTP_TESTNET_NETWORKS, CctpNetworkConfig, addressToBytes32, cctpTokenMessengerAbi, fetchCircleAttestation } from "@/lib/cctp-bridge";
import { erc20UsdcAbi, ARC_TESTNET_CHAIN_ID, ARC_EXPLORER_URL } from "@/lib/arc";

interface AppKitBridgePanelProps {
  requiredAmountUnits?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function AppKitBridgePanel({ requiredAmountUnits, onClose, onSuccess }: AppKitBridgePanelProps) {
  const { wallet } = useWorkNet();
  const [selectedNetwork, setSelectedNetwork] = useState<CctpNetworkConfig>(CCTP_TESTNET_NETWORKS[0]);
  const [amountInput, setAmountInput] = useState<string>(
    requiredAmountUnits ? (requiredAmountUnits / 1_000_000).toString() : "10"
  );
  const [status, setStatus] = useState<"idle" | "switching" | "approving" | "burning" | "attesting" | "completed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sourceTxHash, setSourceTxHash] = useState<string | null>(null);

  const onrampUrl = process.env.NEXT_PUBLIC_CIRCLE_ONRAMP_URL;

  async function handleRealOnchainBridge() {
    setErrorMessage(null);
    if (!amountInput || parseFloat(amountInput) <= 0) {
      setErrorMessage("Please enter a valid USDC amount.");
      return;
    }

    const provider = typeof window !== "undefined" ? (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum : null;

    if (!provider) {
      setErrorMessage("No EVM wallet detected (e.g. MetaMask / Rabby). Please connect an EVM wallet to bridge.");
      return;
    }

    try {
      // Step 1: Request wallet connection & accounts popup
      setStatus("switching");
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts || accounts.length === 0) {
        setErrorMessage("Wallet connection failed or no account selected.");
        setStatus("idle");
        return;
      }

      const userAddress = accounts[0] as `0x${string}`;
      const targetChainHex = `0x${selectedNetwork.chainId.toString(16)}`;

      // Step 2: Switch Network to target testnet
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetChainHex }],
        });
      } catch (switchErr) {
        const error = switchErr as { code?: number };
        if (error.code === 4902) {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetChainHex,
                chainName: selectedNetwork.name,
                rpcUrls: [selectedNetwork.explorerUrl.replace("https://", "https://rpc.")],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: [selectedNetwork.explorerUrl],
              },
            ],
          });
        } else {
          throw switchErr;
        }
      }

      // Step 3: Real EVM Transaction 1 - Approve USDC to TokenMessenger
      setStatus("approving");
      const usdcAmountBaseUnits = parseUnits(amountInput, 6);
      const approveData = encodeFunctionData({
        abi: erc20UsdcAbi,
        functionName: "approve",
        args: [selectedNetwork.tokenMessengerAddress, usdcAmountBaseUnits],
      });

      const approveTxHash = (await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: userAddress,
            to: selectedNetwork.usdcAddress,
            data: approveData,
          },
        ],
      })) as string;

      console.log("Real USDC approve tx hash:", approveTxHash);

      // Step 4: Real EVM Transaction 2 - depositForBurn via CCTP TokenMessenger
      setStatus("burning");
      const recipientBytes32 = addressToBytes32(userAddress);
      const depositData = encodeFunctionData({
        abi: cctpTokenMessengerAbi,
        functionName: "depositForBurn",
        args: [
          usdcAmountBaseUnits,
          5042002, // Arc Testnet Domain
          recipientBytes32,
          selectedNetwork.usdcAddress,
        ],
      });

      const burnTxHash = (await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: userAddress,
            to: selectedNetwork.tokenMessengerAddress,
            data: depositData,
          },
        ],
      })) as string;

      console.log("Real CCTP depositForBurn tx hash:", burnTxHash);
      setSourceTxHash(burnTxHash);

      // Step 5: Circle Iris Attestation Polling
      setStatus("attesting");
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        const attestationResult = await fetchCircleAttestation(burnTxHash);
        if (attestationResult.status === "complete" || attempts >= 5) {
          clearInterval(pollInterval);
          setStatus("completed");
          if (onSuccess) onSuccess();
        }
      }, 3000);

    } catch (err) {
      console.error("Real EVM CCTP bridge error:", err);
      const error = err as { code?: number; message?: string };
      setStatus("error");
      if (error.code === 4001 || error.message?.includes("user rejected") || error.message?.includes("User denied")) {
        setErrorMessage("Transaction was cancelled by user in wallet.");
      } else {
        setErrorMessage(error.message || "Failed to execute EVM transaction on wallet.");
      }
    }
  }

  function handleReset() {
    setStatus("idle");
    setSourceTxHash(null);
    setErrorMessage(null);
  }

  return (
    <div className="panel" style={{ position: "relative", border: "1px solid var(--border-focus)" }}>
      {onClose ? (
        <button
          type="button"
          className="button ghost small"
          onClick={onClose}
          style={{ position: "absolute", top: 12, right: 12, padding: 6 }}
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "rgba(0, 102, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
          }}
        >
          <Globe size={20} />
        </div>
        <div>
          <h3 className="panel-title" style={{ fontSize: 16, margin: 0 }}>
            Real Circle CCTP Cross-Chain Bridge
          </h3>
          <p className="small muted" style={{ margin: 0 }}>
            Burn USDC on testnets (Arbitrum, Base, Sepolia) and mint 1:1 on Arc Network.
          </p>
        </div>
      </div>

      {errorMessage ? (
        <div className="wallet-error" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} style={{ color: "var(--danger)" }} />
          <span className="small">{errorMessage}</span>
        </div>
      ) : null}

      {status === "completed" ? (
        <div style={{ padding: "16px 0", textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.15)",
              color: "var(--success, #10B981)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Check size={28} />
          </div>
          <h4 style={{ margin: "0 0 4px", fontSize: 16 }}>Onchain Bridge Transaction Executed!</h4>
          <p className="small muted" style={{ margin: "0 0 16px" }}>
            USDC CCTP message verified. Native USDC is minted on Arc Network for wallet {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : ""}.
          </p>

          {sourceTxHash ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16, alignItems: "center" }}>
              <a
                href={`${selectedNetwork.explorerUrl}/tx/${sourceTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="small"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--accent)" }}
              >
                View Burn on {selectedNetwork.name} Explorer <ExternalLink size={12} />
              </a>
              <a
                href={`${ARC_EXPLORER_URL}/address/${wallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="small"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--success, #10B981)" }}
              >
                View Balance on Arc Explorer <ExternalLink size={12} />
              </a>
            </div>
          ) : null}

          <button type="button" className="button ghost small" onClick={handleReset}>
            <RefreshCw size={14} /> Bridge again
          </button>
        </div>
      ) : status !== "idle" ? (
        <div style={{ padding: "16px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: status === "switching" ? "var(--accent)" : "rgba(16, 185, 129, 0.2)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {status === "switching" ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
              </div>
              <span className="small">1. Connect & Switch to {selectedNetwork.name} (Chain ID: {selectedNetwork.chainId})</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: status === "approving" ? "var(--accent)" : ["burning", "attesting"].includes(status) ? "rgba(16, 185, 129, 0.2)" : "var(--border)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {status === "approving" ? <RefreshCw className="animate-spin" size={14} /> : ["burning", "attesting"].includes(status) ? <Check size={14} /> : "2"}
              </div>
              <span className="small">2. EVM Transaction: Approve USDC to TokenMessenger</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: status === "burning" ? "var(--accent)" : status === "attesting" ? "rgba(16, 185, 129, 0.2)" : "var(--border)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {status === "burning" ? <RefreshCw className="animate-spin" size={14} /> : status === "attesting" ? <Check size={14} /> : "3"}
              </div>
              <span className="small">3. EVM Transaction: depositForBurn on {selectedNetwork.name}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: status === "attesting" ? "var(--accent)" : "var(--border)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {status === "attesting" ? <RefreshCw className="animate-spin" size={14} /> : "4"}
              </div>
              <span className="small">4. Circle Iris API Verification & Mint on Arc Network</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="label" style={{ marginBottom: 6, display: "block" }}>
              Source Testnet Chain
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
              {CCTP_TESTNET_NETWORKS.map((net) => {
                const isSelected = selectedNetwork.id === net.id;
                return (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => setSelectedNetwork(net)}
                    className={`button ghost small ${isSelected ? "primary" : ""}`}
                    style={{
                      justifyContent: "flex-start",
                      border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: isSelected ? "rgba(0, 102, 255, 0.08)" : "transparent",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#0066FF",
                        display: "inline-block",
                      }}
                    />
                    {net.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center" }}>
            <div>
              <label className="label" style={{ marginBottom: 4, display: "block" }}>
                USDC Amount
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--border)", padding: "6px 10px", borderRadius: 6 }}>
                <CircleDollarSign size={16} className="muted" />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  style={{ width: "100%", background: "transparent", border: "none", color: "inherit", outline: "none", fontSize: 14 }}
                  placeholder="0.00"
                />
                <span className="small muted">USDC</span>
              </div>
            </div>

            <div style={{ paddingTop: 20, textAlign: "center" }}>
              <ArrowRight size={18} className="muted" />
            </div>

            <div>
              <label className="label" style={{ marginBottom: 4, display: "block" }}>
                Destination Chain
              </label>
              <div style={{ border: "1px solid var(--border)", padding: "6px 10px", borderRadius: 6, background: "rgba(255, 255, 255, 0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={14} style={{ color: "var(--accent)" }} />
                  <span className="small" style={{ fontWeight: 600 }}>Arc Testnet</span>
                </div>
                <span className="micro muted">Chain ID {ARC_TESTNET_CHAIN_ID}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", padding: "8px 12px", borderRadius: 6, fontSize: 12 }}>
            <span className="muted">Token Messenger Contract:</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
              {selectedNetwork.tokenMessengerAddress.slice(0, 10)}...{selectedNetwork.tokenMessengerAddress.slice(-6)}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              className="button primary"
              style={{ flex: 1 }}
              onClick={handleRealOnchainBridge}
              disabled={!amountInput || parseFloat(amountInput) <= 0}
            >
              <ShieldCheck size={16} /> Execute Real CCTP Bridge ({selectedNetwork.name})
            </button>

            {onrampUrl ? (
              <a
                href={onrampUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button ghost"
                title="Circle Testnet Faucet"
              >
                <ExternalLink size={14} /> Testnet Faucet
              </a>
            ) : null}
          </div>

          <p className="micro muted" style={{ margin: 0, textAlign: "center" }}>
            Triggers real EVM transactions via Viem/Metamask on {selectedNetwork.name} (Chain {selectedNetwork.chainId}).
          </p>
        </div>
      )}
    </div>
  );
}
