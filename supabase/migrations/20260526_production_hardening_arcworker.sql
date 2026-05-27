alter table public.job_submissions_arcworker
  add column if not exists encrypted_at timestamptz;

alter table public.job_reviews_arcworker
  add column if not exists encrypted_at timestamptz;

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

create index if not exists job_submissions_arcworker_job_idx
  on public.job_submissions_arcworker(job_id, created_at desc);

create index if not exists job_reviews_arcworker_job_idx
  on public.job_reviews_arcworker(job_id, created_at desc);

create index if not exists onchain_transactions_arcworker_job_idx
  on public.onchain_transactions_arcworker(job_id, created_at desc);

create index if not exists notifications_arcworker_profile_idx
  on public.notifications_arcworker(profile_id, created_at desc);
