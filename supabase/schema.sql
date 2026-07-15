create extension if not exists pgcrypto;

do $$ begin
  create type public.profile_role as enum ('client', 'worker', 'agent_owner', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.job_status as enum (
    'draft',
    'open',
    'assigned',
    'onchain_created',
    'budget_set',
    'funding_pending',
    'funded',
    'in_progress',
    'submitted',
    'revision_requested',
    'completed',
    'rejected',
    'expired',
    'cancelled',
    'disputed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.application_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.submission_status as enum ('submitted', 'revision_requested', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.actor_type as enum ('human', 'agent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.tx_status as enum ('pending', 'confirmed', 'failed');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles_arcworker (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  display_name text not null,
  handle text unique,
  role public.profile_role not null default 'client',
  bio text,
  avatar_url text,
  wallet_address text not null unique,
  circle_wallet_id text,
  country_code text,
  timezone text,
  skills text[] not null default '{}',
  hourly_rate_usdc_units bigint,
  availability text check (availability is null or availability in ('open', 'limited', 'unavailable')),
  portfolio jsonb not null default '[]'::jsonb,
  total_earned_usdc_units bigint not null default 0,
  total_spent_usdc_units bigint not null default 0,
  completed_jobs_count integer not null default 0,
  rating_avg numeric(3,2),
  rating_count integer not null default 0,
  is_verified boolean not null default false,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles_arcworker
  alter column id set default gen_random_uuid();

do $$
declare
  fk_name text;
begin
  for fk_name in
    select c.conname
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
      and a.attnum = any(c.conkey)
    where c.conrelid = 'public.profiles_arcworker'::regclass
      and c.contype = 'f'
      and a.attname = 'id'
  loop
    execute format('alter table public.profiles_arcworker drop constraint %I', fk_name);
  end loop;
end $$;

alter table public.profiles_arcworker
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

alter table public.profiles_arcworker
  alter column wallet_address set not null;

create unique index if not exists profiles_arcworker_wallet_unique_idx
  on public.profiles_arcworker (lower(wallet_address));

create table if not exists public.wallet_nonces_arcworker (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  chain_id integer not null default 5042002,
  nonce text not null unique,
  message text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.wallet_nonces_arcworker
  alter column id set default gen_random_uuid();

create index if not exists wallet_nonces_arcworker_wallet_idx
  on public.wallet_nonces_arcworker(wallet_address, used_at, expires_at);

create table if not exists public.wallet_sessions_arcworker (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles_arcworker(id) on delete cascade,
  wallet_address text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.wallet_sessions_arcworker
  alter column id set default gen_random_uuid();

create index if not exists wallet_sessions_arcworker_profile_idx
  on public.wallet_sessions_arcworker(profile_id, expires_at, revoked_at);

create table if not exists public.agents_arcworker (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles_arcworker(id) on delete cascade,
  name text not null,
  slug text unique,
  description text,
  avatar_url text,
  capabilities text[] not null default '{}',
  agent_wallet_address text,
  metadata_uri text,
  arc_agent_id numeric(78,0),
  identity_registry_address text,
  reputation_registry_address text,
  validation_registry_address text,
  registration_tx_hash text,
  reputation_score integer not null default 0,
  jobs_completed integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agents_arcworker
  alter column id set default gen_random_uuid();

create table if not exists public.jobs_arcworker (
  id uuid primary key default gen_random_uuid(),
  client_profile_id uuid not null references public.profiles_arcworker(id),
  provider_profile_id uuid references public.profiles_arcworker(id),
  provider_agent_id uuid references public.agents_arcworker(id),
  actor_type public.actor_type not null default 'human',
  title text not null,
  brief text not null,
  acceptance_criteria text not null,
  deliverable_format text,
  category text,
  tags text[] not null default '{}',
  budget_usdc_units bigint not null check (budget_usdc_units > 0),
  platform_fee_bps integer not null default 100 check (platform_fee_bps >= 0),
  deadline_at timestamptz,
  status public.job_status not null default 'draft',
  evaluator_address text,
  provider_address text,
  arc_chain_id integer not null default 5042002,
  arc_contract_address text,
  arc_job_id numeric(78,0),
  hook_address text,
  description_hash text,
  create_tx_hash text,
  set_budget_tx_hash text,
  approve_tx_hash text,
  fund_tx_hash text,
  submit_tx_hash text,
  complete_tx_hash text,
  cancel_tx_hash text,
  last_indexed_block bigint,
  task_file_path text,
  task_file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobs_arcworker
  alter column id set default gen_random_uuid();

create index if not exists jobs_arcworker_status_idx on public.jobs_arcworker(status);
create index if not exists jobs_arcworker_client_idx on public.jobs_arcworker(client_profile_id);
create index if not exists jobs_arcworker_provider_idx on public.jobs_arcworker(provider_profile_id);
create index if not exists jobs_arcworker_marketplace_idx
  on public.jobs_arcworker(status, created_at desc)
  where status in (
    'open',
    'assigned',
    'onchain_created',
    'budget_set',
    'funded',
    'submitted',
    'revision_requested',
    'completed'
  );
create index if not exists jobs_arcworker_cursor_idx
  on public.jobs_arcworker(created_at desc, id desc);
create index if not exists jobs_arcworker_status_cursor_idx
  on public.jobs_arcworker(status, created_at desc, id desc);
create index if not exists jobs_arcworker_actor_cursor_idx
  on public.jobs_arcworker(actor_type, created_at desc, id desc);
create index if not exists jobs_arcworker_category_cursor_idx
  on public.jobs_arcworker(category, created_at desc, id desc);
create unique index if not exists jobs_arcworker_arc_unique_idx
  on public.jobs_arcworker(arc_contract_address, arc_job_id)
  where arc_contract_address is not null and arc_job_id is not null;

create table if not exists public.job_applications_arcworker (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs_arcworker(id) on delete cascade,
  applicant_profile_id uuid references public.profiles_arcworker(id),
  applicant_agent_id uuid references public.agents_arcworker(id),
  actor_type public.actor_type not null,
  pitch text not null,
  proposed_budget_usdc_units bigint,
  proposed_deadline_at timestamptz,
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (actor_type = 'human' and applicant_profile_id is not null and applicant_agent_id is null)
    or
    (actor_type = 'agent' and applicant_agent_id is not null)
  )
);

alter table public.job_applications_arcworker
  alter column id set default gen_random_uuid();

create unique index if not exists job_applications_arcworker_human_unique_idx
  on public.job_applications_arcworker(job_id, applicant_profile_id)
  where applicant_profile_id is not null;

create unique index if not exists job_applications_arcworker_agent_unique_idx
  on public.job_applications_arcworker(job_id, applicant_agent_id)
  where applicant_agent_id is not null;

create table if not exists public.job_submissions_arcworker (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs_arcworker(id) on delete cascade,
  submitter_profile_id uuid references public.profiles_arcworker(id),
  submitter_agent_id uuid references public.agents_arcworker(id),
  notes text,
  deliverable_url text,
  deliverable_storage_path text,
  deliverable_sha256 text,
  deliverable_payload jsonb not null default '{}'::jsonb,
  deliverable_hash_bytes32 text,
  status public.submission_status not null default 'submitted',
  submit_tx_hash text,
  encrypted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_submissions_arcworker
  alter column id set default gen_random_uuid();

create index if not exists job_submissions_arcworker_job_idx
  on public.job_submissions_arcworker(job_id, created_at desc);

create table if not exists public.job_reviews_arcworker (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs_arcworker(id) on delete cascade,
  reviewer_profile_id uuid not null references public.profiles_arcworker(id),
  submission_id uuid references public.job_submissions_arcworker(id),
  rating integer check (rating between 1 and 5),
  review_text text,
  reason_hash_bytes32 text,
  complete_tx_hash text,
  review_tx_hash text,
  review_tx_method text,
  encrypted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.job_reviews_arcworker
  alter column id set default gen_random_uuid();

create index if not exists job_reviews_arcworker_job_idx
  on public.job_reviews_arcworker(job_id, created_at desc);

create table if not exists public.ai_evaluations_arcworker (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs_arcworker(id) on delete cascade,
  submission_id uuid not null references public.job_submissions_arcworker(id) on delete cascade,
  model text not null,
  score integer check (score between 0 and 100),
  verdict text check (verdict in ('pass', 'needs_revision', 'fail')),
  summary text,
  rubric jsonb not null default '{}'::jsonb,
  raw_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_evaluations_arcworker
  alter column id set default gen_random_uuid();

create table if not exists public.onchain_transactions_arcworker (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs_arcworker(id) on delete cascade,
  profile_id uuid references public.profiles_arcworker(id),
  chain_id integer not null default 5042002,
  blockchain text not null default 'ARC-TESTNET',
  contract_address text,
  method text,
  tx_hash text unique,
  user_op_hash text,
  status public.tx_status not null default 'pending',
  block_number bigint,
  log_index integer,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.onchain_transactions_arcworker
  alter column id set default gen_random_uuid();

create index if not exists onchain_transactions_arcworker_job_idx
  on public.onchain_transactions_arcworker(job_id, created_at desc);

create table if not exists public.onchain_events_arcworker (
  id uuid primary key default gen_random_uuid(),
  chain_id integer not null default 5042002,
  blockchain text not null default 'ARC-TESTNET',
  contract_address text not null,
  event_signature text not null,
  event_signature_hash text,
  tx_hash text not null,
  user_op_hash text,
  block_hash text,
  block_number bigint not null,
  log_index integer not null,
  topics text[] not null default '{}',
  data text,
  decoded jsonb not null default '{}'::jsonb,
  first_confirm_date timestamptz,
  created_at timestamptz not null default now(),
  unique (chain_id, tx_hash, log_index)
);

alter table public.onchain_events_arcworker
  alter column id set default gen_random_uuid();

create table if not exists public.indexer_state_arcworker (
  id text primary key,
  last_processed_block bigint not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications_arcworker (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles_arcworker(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications_arcworker
  alter column id set default gen_random_uuid();

create index if not exists notifications_arcworker_profile_idx
  on public.notifications_arcworker(profile_id, created_at desc);

create or replace view public.public_profiles_arcworker as
select
  id,
  display_name,
  handle,
  role,
  bio,
  avatar_url,
  wallet_address,
  skills,
  hourly_rate_usdc_units,
  availability,
  portfolio,
  completed_jobs_count,
  rating_avg,
  rating_count,
  is_verified,
  created_at
from public.profiles_arcworker
where is_blocked = false;

alter table public.profiles_arcworker enable row level security;
alter table public.wallet_nonces_arcworker enable row level security;
alter table public.wallet_sessions_arcworker enable row level security;
alter table public.agents_arcworker enable row level security;
alter table public.jobs_arcworker enable row level security;
alter table public.job_applications_arcworker enable row level security;
alter table public.job_submissions_arcworker enable row level security;
alter table public.job_reviews_arcworker enable row level security;
alter table public.ai_evaluations_arcworker enable row level security;
alter table public.onchain_transactions_arcworker enable row level security;
alter table public.onchain_events_arcworker enable row level security;
alter table public.indexer_state_arcworker enable row level security;
alter table public.notifications_arcworker enable row level security;

drop policy if exists "Public profiles are readable" on public.profiles_arcworker;
create policy "Public profiles are readable"
  on public.profiles_arcworker for select
  using (is_blocked = false);

drop policy if exists "Open jobs are readable" on public.jobs_arcworker;
create policy "Open jobs are readable"
  on public.jobs_arcworker for select
  using (status in ('open', 'assigned', 'onchain_created', 'budget_set', 'funded', 'submitted', 'completed'));

drop policy if exists "Public agents are readable" on public.agents_arcworker;
create policy "Public agents are readable"
  on public.agents_arcworker for select
  using (is_public = true);

drop policy if exists "Service role can manage profiles" on public.profiles_arcworker;
create policy "Service role can manage profiles"
  on public.profiles_arcworker for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage wallet nonces" on public.wallet_nonces_arcworker;
create policy "Service role can manage wallet nonces"
  on public.wallet_nonces_arcworker for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage wallet sessions" on public.wallet_sessions_arcworker;
create policy "Service role can manage wallet sessions"
  on public.wallet_sessions_arcworker for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage agents" on public.agents_arcworker;
create policy "Service role can manage agents"
  on public.agents_arcworker for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage jobs" on public.jobs_arcworker;
create policy "Service role can manage jobs"
  on public.jobs_arcworker for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage applications" on public.job_applications_arcworker;
create policy "Service role can manage applications"
  on public.job_applications_arcworker for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage submissions" on public.job_submissions_arcworker;
create policy "Service role can manage submissions"
  on public.job_submissions_arcworker for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage reviews" on public.job_reviews_arcworker;
create policy "Service role can manage reviews"
  on public.job_reviews_arcworker for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage AI evaluations" on public.ai_evaluations_arcworker;
create policy "Service role can manage AI evaluations"
  on public.ai_evaluations_arcworker for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage transactions" on public.onchain_transactions_arcworker;
create policy "Service role can manage transactions"
  on public.onchain_transactions_arcworker for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage events" on public.onchain_events_arcworker;
create policy "Service role can manage events"
  on public.onchain_events_arcworker for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage indexer state" on public.indexer_state_arcworker;
create policy "Service role can manage indexer state"
  on public.indexer_state_arcworker for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage notifications" on public.notifications_arcworker;
create policy "Service role can manage notifications"
  on public.notifications_arcworker for all
  to service_role
  using (true)
  with check (true);

-- =========================================================================
-- Tables migrated from browser localStorage (cross-device persistence)
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
create policy "Job messages readable to anyone on the job"
  on public.job_messages_arcworker for select using (true);

drop policy if exists "Service role can manage job messages" on public.job_messages_arcworker;
create policy "Service role can manage job messages"
  on public.job_messages_arcworker for all
  to service_role using (true) with check (true);

revoke all on public.job_messages_arcworker from anon;
grant select on public.job_messages_arcworker to authenticated;

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
  on public.job_invitations_arcworker for select using (true);

drop policy if exists "Service role can manage invitations" on public.job_invitations_arcworker;
create policy "Service role can manage invitations"
  on public.job_invitations_arcworker for all
  to service_role using (true) with check (true);

revoke all on public.job_invitations_arcworker from anon;
grant select on public.job_invitations_arcworker to authenticated;

create table if not exists public.saved_jobs_arcworker (
  profile_id uuid not null references public.profiles_arcworker(id) on delete cascade,
  job_id uuid not null references public.jobs_arcworker(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, job_id)
);

create index if not exists saved_jobs_arcworker_profile_idx
  on public.saved_jobs_arcworker(profile_id, created_at desc);

alter table public.saved_jobs_arcworker enable row level security;

drop policy if exists "Service role can manage saved jobs" on public.saved_jobs_arcworker;
create policy "Service role can manage saved jobs"
  on public.saved_jobs_arcworker for all
  to service_role using (true) with check (true);

revoke all on public.saved_jobs_arcworker from anon, authenticated;

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
  on public.application_status_overlay_arcworker for select using (true);

drop policy if exists "Service role can manage overlay" on public.application_status_overlay_arcworker;
create policy "Service role can manage overlay"
  on public.application_status_overlay_arcworker for all
  to service_role using (true) with check (true);

revoke all on public.application_status_overlay_arcworker from anon;
grant select on public.application_status_overlay_arcworker to authenticated;

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

-- =========================================================================
-- Skills Master Table
-- =========================================================================

create table if not exists public.skills_arcworker (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  created_at timestamptz not null default now()
);

alter table public.skills_arcworker enable row level security;

create policy "Allow public read access to skills"
  on public.skills_arcworker for select
  using (true);

create policy "Allow admin insert access to skills"
  on public.skills_arcworker for insert
  with check (
    exists (
      select 1 from public.profiles_arcworker
      where auth_user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Allow admin update access to skills"
  on public.skills_arcworker for update
  using (
    exists (
      select 1 from public.profiles_arcworker
      where auth_user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Allow admin delete access to skills"
  on public.skills_arcworker for delete
  using (
    exists (
      select 1 from public.profiles_arcworker
      where auth_user_id = auth.uid() and role = 'admin'
    )
  );

grant select on public.skills_arcworker to authenticated;
grant select on public.skills_arcworker to anon;

-- Full-table aggregates stay separate from paginated list queries.
create or replace function public.get_public_statistics_arcworker()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'totalJobs', (select count(*) from public.jobs_arcworker),
    'openBudgetUsdcUnits', (
      select coalesce(sum(budget_usdc_units), 0)
      from public.jobs_arcworker
      where status in ('open', 'assigned', 'onchain_created', 'budget_set', 'funded', 'submitted', 'revision_requested')
    ),
    'knownAgents', (select count(*) from public.agents_arcworker where is_public),
    'workers', (
      select count(*) from public.profiles_arcworker
      where role in ('worker', 'agent_owner') and not is_blocked
    ),
    'openWorkers', (
      select count(*) from public.profiles_arcworker
      where role in ('worker', 'agent_owner') and availability = 'open' and not is_blocked
    ),
    'workerSkills', (
      select count(distinct skill)
      from public.profiles_arcworker p
      cross join lateral unnest(p.skills) skill
      where p.role in ('worker', 'agent_owner') and not p.is_blocked
    ),
    'averageWorkerRating', (
      select coalesce(avg(rating_avg), 0)
      from public.profiles_arcworker
      where role in ('worker', 'agent_owner') and not is_blocked
    )
  );
$$;

create or replace function public.get_private_statistics_arcworker(p_profile_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  with active_profile as (
    select role from public.profiles_arcworker where id = p_profile_id
  ),
  owned_agents as (
    select id from public.agents_arcworker where owner_profile_id = p_profile_id
  ),
  relevant_jobs as (
    select distinct j.*
    from public.jobs_arcworker j
    cross join active_profile p
    where p.role = 'admin'
       or j.client_profile_id = p_profile_id
       or j.provider_profile_id = p_profile_id
       or j.provider_agent_id in (select id from owned_agents)
  )
  select jsonb_build_object(
    'myApplications', (
      select count(*) from public.job_applications_arcworker a
      where a.applicant_profile_id = p_profile_id
         or a.applicant_agent_id in (select id from owned_agents)
    ),
    'myJobs', (select count(*) from relevant_jobs),
    'pendingReview', (
      select count(*)
      from relevant_jobs j
      cross join active_profile p
      where (p.role in ('admin', 'client') and j.status = 'submitted')
         or (p.role in ('worker', 'agent_owner') and j.status in ('funded', 'assigned', 'revision_requested'))
    ),
    'escrowedUsdcUnits', (
      select coalesce(sum(j.budget_usdc_units), 0)
      from relevant_jobs j
      where j.status in ('funded', 'submitted', 'revision_requested')
    ),
    'openApplications', (
      select count(*)
      from public.job_applications_arcworker a
      cross join active_profile p
      left join public.jobs_arcworker j on j.id = a.job_id
      where a.status = 'pending'
        and (
          p.role = 'admin'
          or a.applicant_profile_id = p_profile_id
          or a.applicant_agent_id in (select id from owned_agents)
          or j.client_profile_id = p_profile_id
        )
    )
  );
$$;

revoke all on function public.get_public_statistics_arcworker() from public, anon, authenticated;
revoke all on function public.get_private_statistics_arcworker(uuid) from public, anon, authenticated;
grant execute on function public.get_public_statistics_arcworker() to service_role;
grant execute on function public.get_private_statistics_arcworker(uuid) to service_role;
