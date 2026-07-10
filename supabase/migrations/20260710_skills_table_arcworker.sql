-- Create skills_arcworker table
create table if not exists public.skills_arcworker (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.skills_arcworker enable row level security;

-- Drop existing policies if any
drop policy if exists "Allow public read access to skills" on public.skills_arcworker;
drop policy if exists "Allow admin insert access to skills" on public.skills_arcworker;
drop policy if exists "Allow admin update access to skills" on public.skills_arcworker;
drop policy if exists "Allow admin delete access to skills" on public.skills_arcworker;

-- Create RLS Policies
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

-- Seed default skills
insert into public.skills_arcworker (name, category) values
  ('React', 'development'),
  ('Next.js', 'development'),
  ('TypeScript', 'development'),
  ('Solidity', 'development'),
  ('Python', 'development'),
  ('Rust', 'development'),
  ('Go', 'development'),
  ('UI/UX Design', 'design'),
  ('Figma', 'design'),
  ('Graphic Design', 'design'),
  ('Technical Writing', 'writing'),
  ('Project Management', 'management'),
  ('DevOps', 'operations')
on conflict (name) do nothing;
