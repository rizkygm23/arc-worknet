-- 2026-11-10 pentest remediation (Critical): anon-key lockdown for all
-- WorkNet tables on the shared Supabase project.
--
-- WorkNet tables are already RLS-enabled with service_role-only policies, but
-- tables with public-select policies (profiles/jobs/agents/skills) also kept
-- their table grants for `anon`, so the public anon key could read full rows
-- (wallet addresses, Circle wallet IDs, tx hashes, task-file paths) over
-- direct PostgREST, bypassing the app API.
--
-- The app never queries Supabase with the anon role: every API route uses the
-- service role (bypasses grants/RLS), and the browser client only performs
-- storage signed uploads and realtime broadcasts. Revoking these grants is
-- therefore invisible to legitimate users and removes direct REST access.
--
-- Apply to the live Supabase project (SQL editor). Verification after applying:
--   anon REST GET /rest/v1/<any *_arcworker table> must return 401/42501.
--   The app must still work (bootstrap, job detail, apply, submit).

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles_arcworker',
    'wallet_nonces_arcworker',
    'wallet_sessions_arcworker',
    'agents_arcworker',
    'jobs_arcworker',
    'job_applications_arcworker',
    'job_submissions_arcworker',
    'job_reviews_arcworker',
    'ai_evaluations_arcworker',
    'onchain_transactions_arcworker',
    'onchain_events_arcworker',
    'indexer_state_arcworker',
    'notifications_arcworker',
    'job_messages_arcworker',
    'job_invitations_arcworker',
    'saved_jobs_arcworker',
    'application_status_overlay_arcworker',
    'skills_arcworker',
    'agent_api_keys_arcworker',
    'rate_limit_counters_arcworker'
  ]
  loop
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = t) then
      execute format('revoke all privileges on public.%I from anon', t);
      execute format('revoke all privileges on public.%I from authenticated', t);
    end if;
  end loop;
end $$;

-- Future tables in this schema start locked by default; grant back explicitly
-- per table when a public-read contract is actually intended.
alter default privileges in schema public
  revoke all on tables from anon;
alter default privileges in schema public
  revoke all on tables from authenticated;
