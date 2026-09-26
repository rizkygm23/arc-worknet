-- Security hardening from the 2026-09-26 pentest remediation.
-- Apply to the live Supabase project BEFORE deploying the matching app code.

-- ---------------------------------------------------------------------------
-- 1) Onchain tx-hash reuse protection (pentest finding M1)
-- Prevents the same onchain transaction from being recorded against multiple
-- jobs or submissions. The app routes now map Postgres code 23505 to a 409.
--
-- Pre-check for existing duplicates BEFORE applying; any rows returned must
-- be resolved first or index creation will fail:
--   select fund_tx_hash, count(*) from public.jobs_arcworker
--     where fund_tx_hash is not null group by 1 having count(*) > 1;
--   (repeat for create_tx_hash, set_budget_tx_hash, submit_tx_hash,
--    complete_tx_hash, and job_reviews_arcworker.review_tx_hash)
-- ---------------------------------------------------------------------------

create unique index if not exists jobs_arcworker_create_tx_hash_unique_idx
  on public.jobs_arcworker (create_tx_hash) where create_tx_hash is not null;
create unique index if not exists jobs_arcworker_set_budget_tx_hash_unique_idx
  on public.jobs_arcworker (set_budget_tx_hash) where set_budget_tx_hash is not null;
create unique index if not exists jobs_arcworker_fund_tx_hash_unique_idx
  on public.jobs_arcworker (fund_tx_hash) where fund_tx_hash is not null;
create unique index if not exists jobs_arcworker_submit_tx_hash_unique_idx
  on public.jobs_arcworker (submit_tx_hash) where submit_tx_hash is not null;
create unique index if not exists jobs_arcworker_complete_tx_hash_unique_idx
  on public.jobs_arcworker (complete_tx_hash) where complete_tx_hash is not null;
create unique index if not exists job_reviews_arcworker_review_tx_hash_unique_idx
  on public.job_reviews_arcworker (review_tx_hash) where review_tx_hash is not null;

-- ---------------------------------------------------------------------------
-- 2) Shared rate-limit counter (pentest finding M5)
-- Serverless instances cannot share in-memory counters; the app calls
-- increment_rate_limit() so limits hold across the whole deployment.
-- ---------------------------------------------------------------------------

create table if not exists public.rate_limit_counters_arcworker (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.rate_limit_counters_arcworker enable row level security;

drop policy if exists "Service role can manage rate limit counters" on public.rate_limit_counters_arcworker;
create policy "Service role can manage rate limit counters"
  on public.rate_limit_counters_arcworker for all
  to service_role using (true) with check (true);

revoke all on public.rate_limit_counters_arcworker from anon, authenticated;

create or replace function public.increment_rate_limit(p_key text, p_window_seconds integer)
returns integer
language sql
as $$
  insert into public.rate_limit_counters_arcworker (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update
    set count = case
          when rate_limit_counters_arcworker.reset_at <= now() then 1
          else rate_limit_counters_arcworker.count + 1
        end,
        reset_at = case
          when rate_limit_counters_arcworker.reset_at <= now()
          then now() + make_interval(secs => p_window_seconds)
          else rate_limit_counters_arcworker.reset_at
        end,
        updated_at = now()
  returning count;
$$;

revoke all on function public.increment_rate_limit(text, integer) from anon, authenticated;

-- Optional housekeeping: stale windows can be pruned periodically.
-- delete from public.rate_limit_counters_arcworker where reset_at <= now();

-- ---------------------------------------------------------------------------
-- 3) Remove dead cross-user read permissions (pentest finding I3)
-- These tables had `using (true)` select policies granted to `authenticated`.
-- The app never issues Supabase `authenticated` JWTs, so the grants are dead
-- permissions that would become cross-user reads the moment Supabase Auth is
-- introduced. The server only uses the service role, which bypasses RLS.
-- ---------------------------------------------------------------------------

revoke select on public.job_messages_arcworker from authenticated;
revoke select on public.job_invitations_arcworker from authenticated;
revoke select on public.application_status_overlay_arcworker from authenticated;
