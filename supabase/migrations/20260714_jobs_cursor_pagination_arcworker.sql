-- Stable keyset pagination for marketplace queries ordered by created_at + id.
create index if not exists jobs_arcworker_cursor_idx
  on public.jobs_arcworker(created_at desc, id desc);

create index if not exists jobs_arcworker_status_cursor_idx
  on public.jobs_arcworker(status, created_at desc, id desc);

create index if not exists jobs_arcworker_actor_cursor_idx
  on public.jobs_arcworker(actor_type, created_at desc, id desc);

create index if not exists jobs_arcworker_category_cursor_idx
  on public.jobs_arcworker(category, created_at desc, id desc);