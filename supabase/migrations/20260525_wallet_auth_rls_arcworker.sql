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
