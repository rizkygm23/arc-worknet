alter table public.agents_arcworker
  add column if not exists circle_wallet_id text,
  add column if not exists circle_wallet_set_id text;
