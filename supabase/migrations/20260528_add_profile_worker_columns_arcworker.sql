-- Add worker-specific columns to profiles_arcworker that the app already
-- references but were never added to the database.
--
-- Columns:
--   skills              – text array of skill tags (e.g. "Solidity", "React")
--   hourly_rate_usdc_units – worker hourly rate in USDC minor units
--   availability        – worker availability status enum-like check
--   portfolio           – freeform JSONB for portfolio links / entries

alter table public.profiles_arcworker
  add column if not exists skills text[] not null default '{}';

alter table public.profiles_arcworker
  add column if not exists hourly_rate_usdc_units bigint;

alter table public.profiles_arcworker
  add column if not exists availability text
    check (availability is null or availability in ('open', 'limited', 'unavailable'));

alter table public.profiles_arcworker
  add column if not exists portfolio jsonb not null default '[]'::jsonb;

-- Update the public_profiles view to expose the new columns
-- (must drop+create because new columns change position of existing ones)
drop view if exists public.public_profiles_arcworker;
create view public.public_profiles_arcworker as
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
