"use client";

import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { useWorkNet } from "@/lib/store";

export default function AdminUsersPage() {
  const { state } = useWorkNet();

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Users"
        subtitle="Profiles are kept simple in this MVP but the shape matches the Supabase schema from the architecture doc."
      />

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Profile</th>
              <th>Role</th>
              <th>Wallet</th>
              <th>Reputation</th>
            </tr>
          </thead>
          <tbody>
            {state.profiles.map((profile) => (
              <tr key={profile.id}>
                <td>
                  <Link href="/settings/profile">
                    <strong>{profile.displayName}</strong>
                  </Link>
                </td>
                <td>{profile.role}</td>
                <td>{profile.walletAddress}</td>
                <td>{profile.ratingAvg?.toFixed(2) ?? "n/a"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
