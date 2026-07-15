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
