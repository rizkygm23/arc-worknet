-- Migrate features that were stored in browser localStorage into Postgres so
-- they persist across devices and become visible to all parties involved
-- (both sides of a chat, invited workers, decline reasons sent by clients).
--
-- Covers:
--   1. job_messages_arcworker             (was: arc-worknet:job-messages:v1)
--   2. job_invitations_arcworker          (was: arc-worknet:job-invitations:v1)
--   3. saved_jobs_arcworker               (was: arc-worknet:saved-jobs:v1)
--   4. application_status_overlay_arcworker (was: arc-worknet:application-overlay:v1)
--
-- Notifications read state already lives in notifications_arcworker.read_at so
-- it does not need a new table.
--
-- All tables are RLS-enabled. The app talks to them via the service role from
-- API routes that already enforce wallet_sessions_arcworker, so we mirror the
-- "Public … readable" + "Service role can manage" pattern used elsewhere.

-- =========================================================================
-- 1. Job thread messages (client ↔ worker chat per job)
-- =========================================================================

create table if not exists public.job_messages_arcworker (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs_arcworker(id) on delete cascade,
  author_profile_id uuid not null references public.profiles_arcworker(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists job_messages_arcworker_job_idx
  on public.job_messages_arcworker(job_id, created_at);

create index if not exists job_messages_arcworker_author_idx
  on public.job_messages_arcworker(author_profile_id, created_at desc);

alter table public.job_messages_arcworker enable row level security;

drop policy if exists "Job messages readable to anyone on the job" on public.job_messages_arcworker;
-- Read policy intentionally lenient (the API layer checks the wallet session
-- against the job's client/provider before returning rows). Anon dashboards
-- never call this table directly because of the empty anon grant.
create policy "Job messages readable to anyone on the job"
  on public.job_messages_arcworker for select
  using (true);

drop policy if exists "Service role can manage job messages" on public.job_messages_arcworker;
create policy "Service role can manage job messages"
  on public.job_messages_arcworker for all
  to service_role
  using (true)
  with check (true);

revoke all on public.job_messages_arcworker from anon;
grant select on public.job_messages_arcworker to authenticated;

-- =========================================================================
-- 2. Job invitations (client invites a specific worker to a job)
-- =========================================================================

do $$ begin
  create type public.invitation_status as enum ('pending', 'accepted', 'declined', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.job_invitations_arcworker (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs_arcworker(id) on delete cascade,
  from_client_profile_id uuid not null references public.profiles_arcworker(id) on delete cascade,
  to_worker_profile_id uuid not null references public.profiles_arcworker(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (from_client_profile_id <> to_worker_profile_id)
);

-- One open invite per (job, worker). New invite after a decline is fine; we
-- only block duplicates while the prior one is still pending.
create unique index if not exists job_invitations_arcworker_pending_unique_idx
  on public.job_invitations_arcworker(job_id, to_worker_profile_id)
  where status = 'pending';

create index if not exists job_invitations_arcworker_to_worker_idx
  on public.job_invitations_arcworker(to_worker_profile_id, status, created_at desc);

create index if not exists job_invitations_arcworker_from_client_idx
  on public.job_invitations_arcworker(from_client_profile_id, created_at desc);

alter table public.job_invitations_arcworker enable row level security;

drop policy if exists "Invitations readable" on public.job_invitations_arcworker;
create policy "Invitations readable"
  on public.job_invitations_arcworker for select
  using (true);

drop policy if exists "Service role can manage invitations" on public.job_invitations_arcworker;
create policy "Service role can manage invitations"
  on public.job_invitations_arcworker for all
  to service_role
  using (true)
  with check (true);

revoke all on public.job_invitations_arcworker from anon;
grant select on public.job_invitations_arcworker to authenticated;

-- =========================================================================
-- 3. Saved jobs (worker bookmarks)
-- =========================================================================

create table if not exists public.saved_jobs_arcworker (
  profile_id uuid not null references public.profiles_arcworker(id) on delete cascade,
  job_id uuid not null references public.jobs_arcworker(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, job_id)
);

create index if not exists saved_jobs_arcworker_profile_idx
  on public.saved_jobs_arcworker(profile_id, created_at desc);

alter table public.saved_jobs_arcworker enable row level security;

-- Saved jobs are private. Service-role only; nobody else reads or writes.
drop policy if exists "Service role can manage saved jobs" on public.saved_jobs_arcworker;
create policy "Service role can manage saved jobs"
  on public.saved_jobs_arcworker for all
  to service_role
  using (true)
  with check (true);

revoke all on public.saved_jobs_arcworker from anon, authenticated;

-- =========================================================================
-- 4. Application status overlay (client decline-reason / worker withdrawal)
-- =========================================================================
--
-- The on-chain / canonical row lives in job_applications_arcworker.status. The
-- overlay table stores extra metadata the UI needs (decline reason, the actor
-- who triggered the state change, when it happened) without coupling that
-- payload to the indexed status enum.

create table if not exists public.application_status_overlay_arcworker (
  application_id uuid primary key references public.job_applications_arcworker(id) on delete cascade,
  status public.application_status not null
    check (status in ('withdrawn', 'rejected')),
  reason text check (reason is null or char_length(reason) <= 2000),
  actor_profile_id uuid references public.profiles_arcworker(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists application_status_overlay_arcworker_actor_idx
  on public.application_status_overlay_arcworker(actor_profile_id, updated_at desc);

alter table public.application_status_overlay_arcworker enable row level security;

drop policy if exists "Overlay rows readable" on public.application_status_overlay_arcworker;
create policy "Overlay rows readable"
  on public.application_status_overlay_arcworker for select
  using (true);

drop policy if exists "Service role can manage overlay" on public.application_status_overlay_arcworker;
create policy "Service role can manage overlay"
  on public.application_status_overlay_arcworker for all
  to service_role
  using (true)
  with check (true);

revoke all on public.application_status_overlay_arcworker from anon;
grant select on public.application_status_overlay_arcworker to authenticated;

-- =========================================================================
-- updated_at touch trigger reused for the new mutable tables
-- =========================================================================

create or replace function public.touch_updated_at_arcworker()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_application_overlay_touch
  on public.application_status_overlay_arcworker;
create trigger trg_application_overlay_touch
  before update on public.application_status_overlay_arcworker
  for each row execute function public.touch_updated_at_arcworker();
