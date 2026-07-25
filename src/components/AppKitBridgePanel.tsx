"use client";

import { ArrowDownUp, Check, ExternalLink, RefreshCw, X, ArrowUpRight, ShieldCheck, AlertCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { getAddress, parseUnits, encodeFunctionData } from "viem";
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
  const [mode, setMode] = useState<"transfer" | "swap">("transfer");
  const [selectedNetwork, setSelectedNetwork] = useState<CctpNetworkConfig>(CCTP_TESTNET_NETWORKS[0]);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const [amountInput, setAmountInput] = useState<string>(
    requiredAmountUnits ? (requiredAmountUnits / 1_000_000).toString() : "10"
  );
  const [customAddress, setCustomAddress] = useState<string>("");
  const [useCustomAddress, setUseCustomAddress] = useState(false);

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
      // Step 1: Request wallet connection
      setStatus("switching");
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts || accounts.length === 0) {
        setErrorMessage("Wallet connection failed or no account selected.");
        setStatus("idle");
        return;
      }

      const connectedUserAddress = getAddress(accounts[0]);
      const destinationAddress = useCustomAddress && customAddress ? getAddress(customAddress) : connectedUserAddress;
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

      // Step 3: EVM Approve USDC to TokenMessenger
      setStatus("approving");
      const usdcAmountBaseUnits = parseUnits(amountInput, 6);
      const approveData = encodeFunctionData({
        abi: erc20UsdcAbi,
        functionName: "approve",
        args: [selectedNetwork.tokenMessengerAddress, usdcAmountBaseUnits],
      });

      await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: connectedUserAddress,
            to: selectedNetwork.usdcAddress,
            data: approveData,
          },
        ],
      });

      // Step 4: EVM depositForBurn via CCTP TokenMessenger
      setStatus("burning");
      const recipientBytes32 = addressToBytes32(destinationAddress);
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
            from: connectedUserAddress,
            to: selectedNetwork.tokenMessengerAddress,
            data: depositData,
          },
        ],
      })) as string;

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
        setErrorMessage("Transaction was cancelled in wallet.");
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
    <div
      style={{
        width: "100%",
        maxWidth: 480,
        background: "#121316",
        color: "#ffffff",
        borderRadius: 24,
        padding: 20,
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        fontFamily: "var(--font-body, sans-serif)",
        position: "relative",
      }}
    >
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/img/worknet_logo.png" alt="WorkNet" style={{ width: 22, height: 22, objectFit: "contain" }} />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>WorkNet Bridge</span>
          <span style={{ fontSize: 10, background: "rgba(15, 122, 62, 0.2)", color: "#10B981", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>
            Arc CCTP
          </span>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "none",
              color: "#a0a5b5",
              borderRadius: "50%",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {/* Mode Switcher */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "rgba(255, 255, 255, 0.04)",
          borderRadius: 14,
          padding: 4,
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={() => setMode("transfer")}
          style={{
            border: "none",
            borderRadius: 10,
            padding: "8px 0",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            background: mode === "transfer" ? "rgba(16, 185, 129, 0.15)" : "transparent",
            color: mode === "transfer" ? "#10B981" : "#808595",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <ShieldCheck size={15} /> Transfer
        </button>
        <button
          type="button"
          onClick={() => setMode("swap")}
          style={{
            border: "none",
            borderRadius: 10,
            padding: "8px 0",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            background: mode === "swap" ? "rgba(255, 255, 255, 0.08)" : "transparent",
            color: mode === "swap" ? "#ffffff" : "#808595",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <ArrowDownUp size={15} /> Swap
        </button>
      </div>

      {errorMessage ? (
        <div style={{ background: "rgba(220, 38, 38, 0.15)", border: "1px solid rgba(220, 38, 38, 0.3)", borderRadius: 12, padding: 10, marginBottom: 14, display: "flex", alignItems: "center", gap: 8, color: "#ef4444", fontSize: 12 }}>
          <AlertCircle size={16} /> {errorMessage}
        </div>
      ) : null}

      {status === "completed" ? (
        <div style={{ padding: "20px 0", textAlign: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Check size={28} />
          </div>
          <h4 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700 }}>Cross-Chain Mint Complete!</h4>
          <p style={{ fontSize: 13, color: "#808595", margin: "0 0 16px" }}>
            USDC has been burned on {selectedNetwork.name} and minted 1:1 on Arc Network.
          </p>

          {sourceTxHash ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              <a
                href={`${selectedNetwork.explorerUrl}/tx/${sourceTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: "#3B82F6", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}
              >
                Burn on {selectedNetwork.name} <ArrowUpRight size={12} />
              </a>
              <a
                href={`${ARC_EXPLORER_URL}/address/${wallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: "#10B981", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}
              >
                Mint Balance on Arc Explorer <ExternalLink size={12} />
              </a>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleReset}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 30,
              border: "none",
              background: "#ffffff",
              color: "#121316",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      ) : status !== "idle" ? (
        <div style={{ padding: "20px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: status === "switching" ? "#10B981" : "#262830", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                {status === "switching" ? <RefreshCw className="animate-spin" size={13} /> : <Check size={13} />}
              </div>
              <span style={{ fontSize: 13, color: "#d1d5db" }}>Connecting to {selectedNetwork.name}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: status === "approving" ? "#10B981" : ["burning", "attesting"].includes(status) ? "#10B981" : "#262830", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                {status === "approving" ? <RefreshCw className="animate-spin" size={13} /> : ["burning", "attesting"].includes(status) ? <Check size={13} /> : "2"}
              </div>
              <span style={{ fontSize: 13, color: "#d1d5db" }}>Approving USDC TokenMessenger</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: status === "burning" ? "#10B981" : status === "attesting" ? "#10B981" : "#262830", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                {status === "burning" ? <RefreshCw className="animate-spin" size={13} /> : status === "attesting" ? <Check size={13} /> : "3"}
              </div>
              <span style={{ fontSize: 13, color: "#d1d5db" }}>Executing depositForBurn</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: status === "attesting" ? "#10B981" : "#262830", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                {status === "attesting" ? <RefreshCw className="animate-spin" size={13} /> : "4"}
              </div>
              <span style={{ fontSize: 13, color: "#d1d5db" }}>Circle Iris Attestation & Minting on Arc</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* FROM CARD */}
          <div style={{ background: "#1c1e24", borderRadius: 16, padding: 14, border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              {/* Token & Chain Selector */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "none",
                    borderRadius: 20,
                    padding: "4px 10px 4px 6px",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#2775CA", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff" }}>
                    $
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: 1.1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>USDC</span>
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{selectedNetwork.name}</span>
                  </div>
                  <ChevronDown size={14} style={{ color: "#9ca3af" }} />
                </button>

                {/* Chain Dropdown Menu */}
                {isChainDropdownOpen ? (
                  <div
                    style={{
                      position: "absolute",
                      top: "110%",
                      left: 0,
                      zIndex: 100,
                      background: "#22252e",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 14,
                      padding: 6,
                      width: 200,
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    <div style={{ fontSize: 10, color: "#6b7280", padding: "4px 8px", fontWeight: 600, textTransform: "uppercase" }}>Select Source Chain</div>
                    {CCTP_TESTNET_NETWORKS.map((net) => (
                      <button
                        key={net.id}
                        type="button"
                        onClick={() => {
                          setSelectedNetwork(net);
                          setIsChainDropdownOpen(false);
                        }}
                        style={{
                          width: "100%",
                          background: selectedNetwork.id === net.id ? "rgba(16, 185, 129, 0.15)" : "transparent",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 10px",
                          color: selectedNetwork.id === net.id ? "#10B981" : "#ffffff",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {net.name}
                        {selectedNetwork.id === net.id ? <Check size={12} /> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <span style={{ fontSize: 12, color: "#6b7280" }}>
                Source Chain
              </span>
            </div>

            {/* Input Amount Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }}>
              <input
                type="number"
                min="1"
                step="1"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#ffffff",
                  width: "60%",
                  letterSpacing: "-0.02em",
                }}
                placeholder="0.00"
              />

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setAmountInput("100")}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "none",
                    borderRadius: 12,
                    padding: "3px 8px",
                    color: "#d1d5db",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Max
                </button>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              ~${parseFloat(amountInput || "0").toFixed(2)} USD
            </div>
          </div>

          {/* DIRECTION SWAP ARROW BUTTON */}
          <div style={{ display: "flex", justifyContent: "center", margin: "-6px 0", zIndex: 2 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#252830",
                border: "3px solid #121316",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
              }}
            >
              <ArrowDownUp size={14} />
            </div>
          </div>

          {/* TO CARD (Arc Network Target) */}
          <div style={{ background: "#1c1e24", borderRadius: 16, padding: 14, border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              {/* Destination Badge */}
              <div
                style={{
                  background: "rgba(15, 122, 62, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: 20,
                  padding: "4px 10px 4px 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <img src="/img/worknet_logo.png" alt="Arc" style={{ width: 18, height: 18, objectFit: "contain" }} />
                <div style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: 1.1 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>USDC</span>
                  <span style={{ fontSize: 10, color: "#a7f3d0" }}>Arc Network</span>
                </div>
              </div>

              {/* Custom Address Toggle */}
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11, color: "#9ca3af" }}>
                Custom Address
                <input
                  type="checkbox"
                  checked={useCustomAddress}
                  onChange={(e) => setUseCustomAddress(e.target.checked)}
                  style={{ accentColor: "#10B981", cursor: "pointer" }}
                />
              </label>
            </div>

            {/* Output Amount Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
                {amountInput && !isNaN(parseFloat(amountInput)) ? parseFloat(amountInput).toFixed(2) : "0.00"}
              </div>
              <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>1:1 Instant Mint</span>
            </div>

            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              Target Domain: {ARC_TESTNET_CHAIN_ID}
            </div>

            {useCustomAddress ? (
              <div style={{ marginTop: 10 }}>
                <input
                  type="text"
                  placeholder="0x... Recipient address on Arc"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    color: "#fff",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    outline: "none",
                  }}
                />
              </div>
            ) : null}
          </div>

          {/* PRIMARY ACTION BUTTON */}
          <button
            type="button"
            onClick={handleRealOnchainBridge}
            disabled={!amountInput || parseFloat(amountInput) <= 0}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 30,
              border: "none",
              background: "#ffffff",
              color: "#121316",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              marginTop: 4,
              boxShadow: "0 4px 14px rgba(255, 255, 255, 0.15)",
              transition: "transform 0.1s ease",
            }}
          >
            Execute CCTP Bridge
          </button>

          {onrampUrl ? (
            <div style={{ textAlign: "center", marginTop: 2 }}>
              <a
                href={onrampUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11, color: "#6b7280", textDecoration: "none" }}
              >
                Need testnet USDC? Get from <span style={{ color: "#3B82F6" }}>Circle Faucet ↗</span>
              </a>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
