-- 2026-11-10 pentest remediation (Critical, cross-app blast radius):
-- lockdown for sibling-application tables on the shared Supabase project.
--
-- These tables belong to sibling apps sharing this database and have no RLS,
-- so WorkNet's public anon key reads/writes them over direct PostgREST:
--   sessions (plaintext tokens), users, users_learn, tasks, projects,
--   rain_users, user_progress, markets_cherry, profiles_sd.
--
-- WARNING — apply via Supabase SQL editor AFTER confirming with each sibling
-- app's owner that it does not query these tables client-side with the anon
-- key. If one does, that app breaks the moment this runs (its own fix is the
-- same pattern: enable RLS + service-role/backed queries). per-table
-- regardless, the anon key embedded in ANY app's bundle can reach them.
--
-- Pattern per table: enable RLS first (deny-by-default for anon/authenticated;
-- existing service-role usage bypasses RLS and keeps working), then revoke
-- grants so anon gets 401 instead of an empty result set.

do $$
declare
  t text;
begin
  foreach t in array array[
    'sessions',
    'users',
    'users_learn',
    'tasks',
    'projects',
    'rain_users',
    'user_progress',
    'markets_cherry',
    'profiles_sd'
  ]
  loop
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = t) then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all privileges on public.%I from anon', t);
      execute format('revoke all privileges on public.%I from authenticated', t);
    end if;
  end loop;
end $$;

alter default privileges in schema public
  revoke all on tables from anon;
alter default privileges in schema public
  revoke all on tables from authenticated;
