"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { useWorkNet } from "@/lib/store";

export default function ProfilePage() {
  const { activeProfile } = useWorkNet();
  const profile = activeProfile;

  return (
    <>
      <PageHeader
        eyebrow="Profile"
        title="Your account"
        subtitle="Connect and sign a wallet to create or select a Supabase-backed profile."
        actions={
          <Link className="button ghost" href="/dashboard">
            <ArrowLeft size={16} />
            Back
          </Link>
        }
      />

      {!profile ? (
        <section className="empty">No profile selected. Connect a wallet from the sidebar first.</section>
      ) : (
        <section className="panel">
          <div className="form-grid">
            <label className="field">
              <span>Display name</span>
              <input className="input" value={profile.displayName} readOnly />
            </label>
            <label className="field">
              <span>Handle</span>
              <input className="input" value={profile.handle} readOnly />
            </label>
            <label className="field">
              <span>Wallet</span>
              <input className="input" value={profile.walletAddress} readOnly />
            </label>
            <label className="field">
              <span>Timezone</span>
              <input className="input" value={profile.timezone} readOnly />
            </label>
            <label className="field span-2">
              <span>Bio</span>
              <textarea className="textarea" value={profile.bio} readOnly />
            </label>
          </div>
          <div className="actions" style={{ marginTop: 16 }}>
            <button className="button" type="button" disabled>
              <Save size={16} />
              Save changes
            </button>
          </div>
        </section>
      )}
    </>
  );
}
