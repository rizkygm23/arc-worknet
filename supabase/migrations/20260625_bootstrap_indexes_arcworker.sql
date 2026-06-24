-- Add covering indexes for the columns the bootstrap endpoints filter on but
-- that had no supporting index. Every authenticated page load runs
-- GET /api/bootstrap/private, which fans out across these columns; without
-- indexes each query degrades to a sequential scan as the tables grow.
--
-- Mirrors existing index names: <table>_<purpose>_idx. All IF NOT EXISTS so the
-- migration is safe to re-run.
--
-- PRODUCTION NOTE: on a live database with significant row counts, prefer
-- running each statement with CREATE INDEX CONCURRENTLY (outside a transaction)
-- to avoid taking a write lock on the table. The plain form below is fine for
-- fresh/low-traffic environments and for `psql -f` application during a
-- maintenance window.

-- Wave 1: owned agents lookup — .eq("owner_profile_id", profileId)
create index if not exists agents_arcworker_owner_idx
  on public.agents_arcworker(owner_profile_id, created_at desc);

-- Wave 1: applications I submitted as a human — .eq("applicant_profile_id", profileId)
create index if not exists job_applications_arcworker_applicant_profile_idx
  on public.job_applications_arcworker(applicant_profile_id, created_at desc);

-- Wave 2: applications submitted by my agents — .in("applicant_agent_id", agentIds)
create index if not exists job_applications_arcworker_applicant_agent_idx
  on public.job_applications_arcworker(applicant_agent_id, created_at desc);

-- Wave 2: jobs where one of my agents is the provider — .in("provider_agent_id", agentIds)
create index if not exists jobs_arcworker_provider_agent_idx
  on public.jobs_arcworker(provider_agent_id, created_at desc);

-- Wave 3: AI evaluations for my jobs — .in("job_id", jobIds)
create index if not exists ai_evaluations_arcworker_job_idx
  on public.ai_evaluations_arcworker(job_id, created_at desc);

-- Wave 1: transactions scoped to my profile — .eq("profile_id", profileId)
create index if not exists onchain_transactions_arcworker_profile_idx
  on public.onchain_transactions_arcworker(profile_id, created_at desc);
