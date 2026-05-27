import { cookies } from "next/headers";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env, requireSupabaseServiceConfig } from "@/lib/env";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | unknown }
  | Json[]
  | Record<string, unknown>;

export type Database = {
  public: {
    Tables: {
      profiles_arcworker: {
        Row: {
          id: string;
          auth_user_id: string | null;
          display_name: string;
          handle: string | null;
          role: "client" | "worker" | "agent_owner" | "admin";
          bio: string | null;
          avatar_url: string | null;
          wallet_address: string;
          circle_wallet_id: string | null;
          country_code: string | null;
          timezone: string | null;
          total_earned_usdc_units: number;
          total_spent_usdc_units: number;
          completed_jobs_count: number;
          rating_avg: number | null;
          rating_count: number;
          is_verified: boolean;
          is_blocked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles_arcworker"]["Row"]> & {
          display_name: string;
          wallet_address: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles_arcworker"]["Row"]>;
        Relationships: [];
      };
      agents_arcworker: {
        Row: {
          id: string;
          owner_profile_id: string;
          name: string;
          slug: string | null;
          description: string | null;
          avatar_url: string | null;
          capabilities: string[];
          agent_wallet_address: string | null;
          metadata_uri: string | null;
          arc_agent_id: string | null;
          identity_registry_address: string | null;
          reputation_registry_address: string | null;
          validation_registry_address: string | null;
          registration_tx_hash: string | null;
          reputation_score: number;
          jobs_completed: number;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["agents_arcworker"]["Row"]> & {
          owner_profile_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["agents_arcworker"]["Row"]>;
        Relationships: [];
      };
      jobs_arcworker: {
        Row: {
          id: string;
          client_profile_id: string;
          provider_profile_id: string | null;
          provider_agent_id: string | null;
          actor_type: "human" | "agent";
          title: string;
          brief: string;
          acceptance_criteria: string;
          deliverable_format: string | null;
          category: string | null;
          tags: string[];
          budget_usdc_units: number;
          platform_fee_bps: number;
          deadline_at: string | null;
          status:
            | "draft"
            | "open"
            | "assigned"
            | "onchain_created"
            | "budget_set"
            | "funding_pending"
            | "funded"
            | "in_progress"
            | "submitted"
            | "revision_requested"
            | "completed"
            | "rejected"
            | "expired"
            | "cancelled"
            | "disputed";
          evaluator_address: string | null;
          provider_address: string | null;
          arc_chain_id: number;
          arc_contract_address: string | null;
          arc_job_id: string | null;
          hook_address: string | null;
          description_hash: string | null;
          create_tx_hash: string | null;
          set_budget_tx_hash: string | null;
          approve_tx_hash: string | null;
          fund_tx_hash: string | null;
          submit_tx_hash: string | null;
          complete_tx_hash: string | null;
          cancel_tx_hash: string | null;
          last_indexed_block: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["jobs_arcworker"]["Row"]> & {
          client_profile_id: string;
          title: string;
          brief: string;
          acceptance_criteria: string;
          budget_usdc_units: number;
        };
        Update: Partial<Database["public"]["Tables"]["jobs_arcworker"]["Row"]>;
        Relationships: [];
      };
      job_applications_arcworker: {
        Row: {
          id: string;
          job_id: string;
          applicant_profile_id: string | null;
          applicant_agent_id: string | null;
          actor_type: "human" | "agent";
          pitch: string;
          proposed_budget_usdc_units: number | null;
          proposed_deadline_at: string | null;
          status: "pending" | "accepted" | "rejected" | "withdrawn";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["job_applications_arcworker"]["Row"]> & {
          job_id: string;
          actor_type: "human" | "agent";
          pitch: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_applications_arcworker"]["Row"]>;
        Relationships: [];
      };
      job_submissions_arcworker: {
        Row: {
          id: string;
          job_id: string;
          submitter_profile_id: string | null;
          submitter_agent_id: string | null;
          notes: string | null;
          deliverable_url: string | null;
          deliverable_storage_path: string | null;
          deliverable_sha256: string | null;
          deliverable_payload: Json;
          deliverable_hash_bytes32: string | null;
          status: "submitted" | "revision_requested" | "approved" | "rejected";
          submit_tx_hash: string | null;
          encrypted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["job_submissions_arcworker"]["Row"]> & {
          job_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_submissions_arcworker"]["Row"]>;
        Relationships: [];
      };
      job_reviews_arcworker: {
        Row: {
          id: string;
          job_id: string;
          reviewer_profile_id: string;
          submission_id: string | null;
          rating: number | null;
          review_text: string | null;
          reason_hash_bytes32: string | null;
          complete_tx_hash: string | null;
          review_tx_hash: string | null;
          review_tx_method: string | null;
          encrypted_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["job_reviews_arcworker"]["Row"]> & {
          job_id: string;
          reviewer_profile_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_reviews_arcworker"]["Row"]>;
        Relationships: [];
      };
      ai_evaluations_arcworker: {
        Row: {
          id: string;
          job_id: string;
          submission_id: string;
          model: string;
          score: number | null;
          verdict: "pass" | "needs_revision" | "fail" | null;
          summary: string | null;
          rubric: Json;
          raw_output: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_evaluations_arcworker"]["Row"]> & {
          job_id: string;
          submission_id: string;
          model: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_evaluations_arcworker"]["Row"]>;
        Relationships: [];
      };
      onchain_transactions_arcworker: {
        Row: {
          id: string;
          job_id: string | null;
          profile_id: string | null;
          chain_id: number;
          blockchain: string;
          contract_address: string | null;
          method: string | null;
          tx_hash: string | null;
          user_op_hash: string | null;
          status: "pending" | "confirmed" | "failed";
          block_number: number | null;
          log_index: number | null;
          error_message: string | null;
          metadata: Json;
          created_at: string;
          confirmed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["onchain_transactions_arcworker"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["onchain_transactions_arcworker"]["Row"]>;
        Relationships: [];
      };
      onchain_events_arcworker: {
        Row: {
          id: string;
          chain_id: number;
          blockchain: string;
          contract_address: string;
          event_signature: string;
          event_signature_hash: string | null;
          tx_hash: string;
          user_op_hash: string | null;
          block_hash: string | null;
          block_number: number;
          log_index: number;
          topics: string[];
          data: string | null;
          decoded: Json;
          first_confirm_date: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["onchain_events_arcworker"]["Row"]> & {
          contract_address: string;
          event_signature: string;
          tx_hash: string;
          block_number: number;
          log_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["onchain_events_arcworker"]["Row"]>;
        Relationships: [];
      };
      notifications_arcworker: {
        Row: {
          id: string;
          profile_id: string;
          type: string;
          title: string;
          body: string | null;
          href: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications_arcworker"]["Row"]> & {
          profile_id: string;
          type: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications_arcworker"]["Row"]>;
        Relationships: [];
      };
      wallet_nonces_arcworker: {
        Row: {
          id: string;
          wallet_address: string;
          chain_id: number;
          nonce: string;
          message: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_nonces_arcworker"]["Row"]> & {
          wallet_address: string;
          chain_id: number;
          nonce: string;
          message: string;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_nonces_arcworker"]["Row"]>;
        Relationships: [];
      };
      wallet_sessions_arcworker: {
        Row: {
          id: string;
          profile_id: string;
          wallet_address: string;
          token_hash: string;
          expires_at: string;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_sessions_arcworker"]["Row"]> & {
          profile_id: string;
          wallet_address: string;
          token_hash: string;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_sessions_arcworker"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server components cannot set cookies; route handlers can.
          }
        },
      },
    },
  );
}

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}

export function createSupabaseServiceClient() {
  requireSupabaseServiceConfig();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
