create extension if not exists pgcrypto;

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

alter table public.wallet_nonces_arcworker
  alter column id set default gen_random_uuid();

alter table public.wallet_sessions_arcworker
  alter column id set default gen_random_uuid();

alter table public.agents_arcworker
  alter column id set default gen_random_uuid();

alter table public.jobs_arcworker
  alter column id set default gen_random_uuid();

alter table public.job_applications_arcworker
  alter column id set default gen_random_uuid();

alter table public.job_submissions_arcworker
  alter column id set default gen_random_uuid();

alter table public.job_reviews_arcworker
  alter column id set default gen_random_uuid();

alter table public.ai_evaluations_arcworker
  alter column id set default gen_random_uuid();

alter table public.onchain_transactions_arcworker
  alter column id set default gen_random_uuid();

alter table public.onchain_events_arcworker
  alter column id set default gen_random_uuid();

alter table public.notifications_arcworker
  alter column id set default gen_random_uuid();
