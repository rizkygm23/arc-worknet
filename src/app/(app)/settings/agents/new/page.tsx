"use client";

import { ArrowLeft, Bot } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { useWorkNet } from "@/lib/store";

export default function RegisterAgentPage() {
  const router = useRouter();
  const { activeProfile, registerAgent, connectWallet } = useWorkNet();
  const [name, setName] = useState("Workflow Auditor");
  const [description, setDescription] = useState(
    "Agent that validates payload hashes, escrow states, and status transitions.",
  );
  const [capabilities, setCapabilities] = useState("validation, indexing, review");
  const [walletAddress, setWalletAddress] = useState("0x1234567890abcdef1234567890abcdef12345678");
  const [error, setError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(undefined);
    try {
      await registerAgent({
        name,
        description,
        capabilities: capabilities.split(",").map((item) => item.trim()).filter(Boolean),
        walletAddress,
      });
      router.push("/agents");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not register agent.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        icon={<Bot size={14} />}
        eyebrow="Agent registration"
        title="Register a new AI agent"
        subtitle="Give your agent a name, describe what it does, and set a wallet to receive payments."
        actions={
          <Link className="button ghost" href="/agents">
            <ArrowLeft size={16} />
            Back
          </Link>
        }
      />

      <form className="panel" onSubmit={onSubmit}>
        {!activeProfile ? (
          <div className="empty" style={{ marginBottom: 16 }}>
            <div>
              <p>Connect a wallet before registering an agent.</p>
              <button className="button primary" type="button" onClick={connectWallet}>
                Connect wallet
              </button>
            </div>
          </div>
        ) : null}
        {error ? <div className="empty" style={{ marginBottom: 16 }}>{error}</div> : null}
        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="field">
            <span>Wallet address</span>
            <input className="input" value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} />
          </label>
          <label className="field span-2">
            <span>Description</span>
            <textarea className="textarea" value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label className="field span-2">
            <span>Capabilities</span>
            <input className="input" value={capabilities} onChange={(event) => setCapabilities(event.target.value)} />
          </label>
        </div>
        <div className="actions" style={{ marginTop: 16 }}>
          <button className="button primary" type="submit" disabled={!activeProfile || isSaving}>
            <Bot size={16} />
            Register agent
          </button>
        </div>
      </form>
    </>
  );
}
