"use client";

import {
  AlertCircle,
  ArrowDown,
  Check,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { encodeFunctionData, getAddress, isAddress, parseUnits } from "viem";
import { ARC_EXPLORER_URL } from "@/lib/arc";
import { CCTP_TESTNET_NETWORKS, type CctpNetworkConfig } from "@/lib/cctp-bridge";
import { apiJson, useWorkNet } from "@/lib/store";

interface AppKitBridgePanelProps {
  requiredAmountUnits?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

type TransferStatus = "idle" | "switching" | "submitting" | "settling" | "completed" | "error";

const erc20TransferAbi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export function AppKitBridgePanel({ requiredAmountUnits, onClose, onSuccess }: AppKitBridgePanelProps) {
  const { wallet, refreshState } = useWorkNet();
  const [selectedNetwork, setSelectedNetwork] = useState<CctpNetworkConfig>(CCTP_TESTNET_NETWORKS[0]);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const [amountInput, setAmountInput] = useState(
    requiredAmountUnits ? (requiredAmountUnits / 1_000_000).toString() : "10",
  );
  const [customAddress, setCustomAddress] = useState("");
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [sourceBalanceUnits, setSourceBalanceUnits] = useState<bigint | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [status, setStatus] = useState<TransferStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sourceTxHash, setSourceTxHash] = useState<string | null>(null);
  const [destinationTxHash, setDestinationTxHash] = useState<string | null>(null);

  const onrampUrl = process.env.NEXT_PUBLIC_CIRCLE_ONRAMP_URL;
  const isBusy = ["switching", "submitting", "settling"].includes(status);

  const amountUnits = useMemo(() => {
    try {
      return parseUnits(amountInput || "0", 6);
    } catch {
      return null;
    }
  }, [amountInput]);

  const amountIsValid = amountUnits !== null && amountUnits > BigInt(0);
  const exceedsBalance = amountUnits !== null && sourceBalanceUnits !== null && amountUnits > sourceBalanceUnits;
  const recipientIsValid = !useCustomAddress || isAddress(customAddress);
  const canSubmit = amountIsValid && !exceedsBalance && recipientIsValid && !isBusy;

  const fetchSourceUsdcBalance = useCallback(async () => {
    const provider = typeof window !== "undefined"
      ? (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<unknown> } }).ethereum
      : undefined;
    let userAddress: `0x${string}` | null = null;

    if (provider) {
      try {
        const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
        if (accounts?.[0] && isAddress(accounts[0])) userAddress = getAddress(accounts[0]);
      } catch {
        // Wallet may be locked; fall back to authenticated wallet address.
      }
    }

    if (!userAddress && wallet.address && isAddress(wallet.address)) {
      userAddress = getAddress(wallet.address);
    }

    if (!userAddress) {
      setSourceBalanceUnits(null);
      return;
    }

    setIsFetchingBalance(true);
    try {
      const response = await fetch(
        `/api/cctp/balance?chainId=${selectedNetwork.chainId}&userAddress=${userAddress}`,
        { cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok || !result?.success || typeof result.balanceUnits !== "string") {
        throw new Error(result?.error ?? "Source-chain balance request failed.");
      }
      setSourceBalanceUnits(BigInt(result.balanceUnits));
    } catch (error) {
      console.warn("Failed to fetch source USDC balance:", error);
      setSourceBalanceUnits(null);
    } finally {
      setIsFetchingBalance(false);
    }
  }, [selectedNetwork.chainId, wallet.address]);

  useEffect(() => {
    fetchSourceUsdcBalance();
  }, [fetchSourceUsdcBalance]);

  function handleSetMaxAmount() {
    setAmountInput(sourceBalanceUnits === null ? "0" : (Number(sourceBalanceUnits) / 1_000_000).toString());
  }

  async function handleTransfer() {
    setErrorMessage(null);

    if (!amountIsValid || amountUnits === null) {
      setErrorMessage("Enter a valid USDC amount with up to 6 decimal places.");
      return;
    }
    if (exceedsBalance) {
      setErrorMessage("Amount exceeds your source-chain USDC balance.");
      return;
    }
    if (!recipientIsValid) {
      setErrorMessage("Enter a valid EVM recipient address.");
      return;
    }

    const provider = typeof window !== "undefined"
      ? (window as unknown as {
          ethereum?: { request: (args: { method: string; params?: unknown }) => Promise<unknown> };
        }).ethereum
      : undefined;

    if (!provider) {
      setErrorMessage("No EVM wallet detected. Connect MetaMask, Rabby, or another EVM wallet.");
      return;
    }

    try {
      setStatus("switching");
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts?.[0] || !isAddress(accounts[0])) throw new Error("No valid wallet account selected.");

      const connectedAddress = getAddress(accounts[0]);
      const recipientAddress = useCustomAddress ? getAddress(customAddress) : connectedAddress;
      const chainId = `0x${selectedNetwork.chainId.toString(16)}`;

      try {
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
      } catch (switchError) {
        if ((switchError as { code?: number }).code !== 4902) throw switchError;
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId,
            chainName: selectedNetwork.name,
            rpcUrls: [selectedNetwork.rpcUrl],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            blockExplorerUrls: [selectedNetwork.explorerUrl],
          }],
        });
      }

      setStatus("submitting");
      const data = encodeFunctionData({
        abi: erc20TransferAbi,
        functionName: "transfer",
        args: [selectedNetwork.tokenMessengerAddress, amountUnits],
      });
      const transferTxHash = (await provider.request({
        method: "eth_sendTransaction",
        params: [{ from: connectedAddress, to: selectedNetwork.usdcAddress, data }],
      })) as string;
      setSourceTxHash(transferTxHash);

      setStatus("settling");
      const result = await apiJson<{ success?: boolean; mintTxHash?: string }>("/api/cctp/receive-message", {
        method: "POST",
        body: JSON.stringify({
          burnTxHash: transferTxHash,
          recipientAddress,
          amountUnits: Number(amountUnits),
          sourceChainId: selectedNetwork.chainId,
        }),
      });

      if (!result?.success || !result.mintTxHash) {
        throw new Error("Source transfer succeeded, but Arc settlement did not return a transaction hash.");
      }

      setDestinationTxHash(result.mintTxHash);
      setStatus("completed");
      await refreshState?.();
      onSuccess?.();
    } catch (error) {
      console.error("Transfer to Arc failed:", error);
      const walletError = error as { code?: number; message?: string };
      setStatus("error");
      setErrorMessage(
        walletError.code === 4001 || /user rejected|user denied/i.test(walletError.message ?? "")
          ? "Transaction cancelled in wallet."
          : walletError.message ?? "Transfer failed.",
      );
    }
  }

  function handleReset() {
    setStatus("idle");
    setSourceTxHash(null);
    setDestinationTxHash(null);
    setErrorMessage(null);
    fetchSourceUsdcBalance();
  }

  const formattedBalance = sourceBalanceUnits === null
    ? "—"
    : (Number(sourceBalanceUnits) / 1_000_000).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });
  const formattedAmount = amountIsValid && amountUnits !== null
    ? (Number(amountUnits) / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 6 })
    : "0";

  return (
    <section className="bridge-panel" aria-labelledby="bridge-dialog-title">
      <header className="bridge-header">
        <div className="bridge-brand">
          <span className="bridge-brand-mark"><img src="/img/worknet_logo.png" alt="" /></span>
          <div>
            <span className="bridge-kicker">WorkNet settlement</span>
            <h2 id="bridge-dialog-title">Transfer USDC to Arc</h2>
          </div>
        </div>
        {onClose ? (
          <button id="bridge-close-button" type="button" className="bridge-icon-button" onClick={onClose} aria-label="Close transfer dialog">
            <X size={18} />
          </button>
        ) : null}
      </header>

      <div className="bridge-notice">
        <ShieldCheck size={17} />
        <p>Source transfer settles through WorkNet relayer. Recipient gets same USDC amount on Arc Testnet.</p>
      </div>

      {errorMessage ? (
        <div className="bridge-error" role="alert">
          <AlertCircle size={17} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {status === "completed" ? (
        <div className="bridge-result" aria-live="polite">
          <span className="bridge-result-icon"><Check size={25} /></span>
          <span className="bridge-kicker">Settlement confirmed</span>
          <h3>{formattedAmount} USDC arrived on Arc</h3>
          <p>Destination transaction returned by WorkNet relayer.</p>
          <div className="bridge-tx-links">
            {sourceTxHash ? (
              <a href={`${selectedNetwork.explorerUrl}/tx/${sourceTxHash}`} target="_blank" rel="noopener noreferrer">
                Source transaction <ExternalLink size={13} />
              </a>
            ) : null}
            {destinationTxHash ? (
              <a href={`${ARC_EXPLORER_URL}/tx/${destinationTxHash}`} target="_blank" rel="noopener noreferrer">
                Arc transaction <ExternalLink size={13} />
              </a>
            ) : null}
          </div>
          <button id="bridge-done-button" type="button" className="bridge-primary-button" onClick={handleReset}>Done</button>
        </div>
      ) : isBusy ? (
        <div className="bridge-progress" aria-live="polite" aria-busy="true">
          <span className="bridge-kicker">Transfer in progress</span>
          <h3>Keep this window open</h3>
          <div className="bridge-steps">
            {[
              ["switching", "Connect and switch source network"],
              ["submitting", "Confirm source USDC transfer"],
              ["settling", "Settle USDC on Arc"],
            ].map(([step, label], index) => {
              const order = ["switching", "submitting", "settling"];
              const activeIndex = order.indexOf(status);
              const stepIndex = order.indexOf(step);
              return (
                <div className={`bridge-step ${stepIndex <= activeIndex ? "active" : ""}`} key={step}>
                  <span>{stepIndex < activeIndex ? <Check size={14} /> : stepIndex === activeIndex ? <RefreshCw className="spin" size={14} /> : index + 1}</span>
                  <p>{label}</p>
                </div>
              );
            })}
          </div>
          {sourceTxHash ? (
            <a className="bridge-inline-link" href={`${selectedNetwork.explorerUrl}/tx/${sourceTxHash}`} target="_blank" rel="noopener noreferrer">
              View source transaction <ExternalLink size={13} />
            </a>
          ) : null}
        </div>
      ) : (
        <div className="bridge-form">
          <div className="bridge-transfer-stack">
            <div className="bridge-asset-card">
              <div className="bridge-card-label-row">
                <span>From</span>
                <span>Balance {isFetchingBalance ? "loading…" : `${formattedBalance} USDC`}</span>
              </div>
              <div className="bridge-amount-row">
                <input
                  id="bridge-amount-input"
                  type="number"
                  min="0"
                  step="0.000001"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  placeholder="0.00"
                  aria-label="USDC amount"
                  aria-invalid={!amountIsValid || exceedsBalance}
                />
                <button id="bridge-max-button" type="button" className="bridge-max-button" onClick={handleSetMaxAmount}>Max</button>
              </div>
              <div className="bridge-network-select">
                <button
                  id="bridge-source-network-button"
                  type="button"
                  className="bridge-network-button"
                  onClick={() => setIsChainDropdownOpen((open) => !open)}
                  aria-expanded={isChainDropdownOpen}
                >
                  <img src={selectedNetwork.iconUrl} alt="" />
                  <span><strong>{selectedNetwork.name}</strong><small>USDC</small></span>
                  <ChevronDown size={15} />
                </button>
                {isChainDropdownOpen ? (
                  <div className="bridge-network-menu" role="listbox" aria-label="Source network">
                    {CCTP_TESTNET_NETWORKS.map((network) => (
                      <button
                        id={`bridge-network-${network.id}`}
                        key={network.id}
                        type="button"
                        className={network.id === selectedNetwork.id ? "selected" : ""}
                        onClick={() => { setSelectedNetwork(network); setIsChainDropdownOpen(false); }}
                        role="option"
                        aria-selected={network.id === selectedNetwork.id}
                      >
                        <img src={network.iconUrl} alt="" />
                        <span>{network.name}</span>
                        {network.id === selectedNetwork.id ? <Check size={14} /> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <span className="bridge-direction"><ArrowDown size={16} /></span>

            <div className="bridge-asset-card bridge-destination-card">
              <div className="bridge-card-label-row"><span>To</span><span>Arc Testnet</span></div>
              <div className="bridge-output-row"><strong>{formattedAmount}</strong><span>USDC</span></div>
              <label className="bridge-address-toggle">
                <input type="checkbox" checked={useCustomAddress} onChange={(event) => setUseCustomAddress(event.target.checked)} />
                Send to another wallet
              </label>
              {useCustomAddress ? (
                <input
                  id="bridge-recipient-input"
                  className="bridge-address-input"
                  value={customAddress}
                  onChange={(event) => setCustomAddress(event.target.value)}
                  placeholder="0x… recipient on Arc"
                  aria-label="Recipient wallet address"
                  aria-invalid={!recipientIsValid}
                />
              ) : (
                <p className="bridge-wallet-destination">Connected wallet · {wallet.address ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}` : "resolved at confirmation"}</p>
              )}
            </div>
          </div>

          <dl className="bridge-review">
            <div><dt>Recipient receives</dt><dd>{formattedAmount} USDC</dd></div>
            <div><dt>Transfer fee</dt><dd>0 USDC</dd></div>
            <div><dt>Network gas</dt><dd>Paid on {selectedNetwork.name}</dd></div>
            <div><dt>Estimated time</dt><dd>Usually under 2 min</dd></div>
            <div><dt>Settlement</dt><dd>WorkNet relayer</dd></div>
          </dl>

          <p className="bridge-estimate-note">Estimate starts after wallet confirmation. Network congestion or relayer availability can take longer.</p>

          <button id="bridge-submit-button" type="button" className="bridge-primary-button" onClick={handleTransfer} disabled={!canSubmit}>
            {exceedsBalance ? "Insufficient USDC balance" : !recipientIsValid ? "Check recipient address" : "Transfer to Arc"}
          </button>

          {onrampUrl ? (
            <a className="bridge-faucet-link" href={onrampUrl} target="_blank" rel="noopener noreferrer">Need testnet USDC? Open Circle faucet <ExternalLink size={12} /></a>
          ) : null}
        </div>
      )}
    </section>
  );
}
