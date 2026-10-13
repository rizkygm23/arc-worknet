-- Gas Station / SCA dual-path support (Circle × Arc integration).
-- New agents get Circle SCA wallets whose gas is sponsored by the Gas Station
-- policy; existing agents stay EOA. Apply to the live Supabase project
-- BEFORE deploying the matching app code.

alter table public.agents_arcworker
  add column if not exists wallet_type text not null default 'EOA';

do $$ begin
  alter table public.agents_arcworker
    add constraint agents_arcworker_wallet_type_check
    check (wallet_type in ('EOA', 'SCA'));
exception when duplicate_object then null;
end $$;
