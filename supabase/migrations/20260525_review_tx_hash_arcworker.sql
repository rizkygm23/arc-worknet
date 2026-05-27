alter table public.job_reviews_arcworker
  add column if not exists review_tx_hash text,
  add column if not exists review_tx_method text;
