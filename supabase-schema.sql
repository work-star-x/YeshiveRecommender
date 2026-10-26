create table if not exists public.site_content (
  id text primary key check (id = 'main'),
  questions jsonb not null,
  yeshivot jsonb not null,
  parameters jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.site_content
  add column if not exists parameters jsonb not null default '[]'::jsonb;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  yeshiva_name text not null check (length(trim(yeshiva_name)) between 1 and 120),
  yeshiva_id text,
  request_type text not null check (request_type in ('suggest', 'update')),
  notes text check (notes is null or length(notes) <= 2000),
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  resolved_tags text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'applied', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

alter table public.submissions
  add column if not exists yeshiva_id text;

alter table public.submissions
  add column if not exists resolved_tags text[] not null default '{}';

create table if not exists public.analytics_counters (
  event_type text primary key check (event_type in ('completion', 'share_home', 'share_results')),
  total bigint not null default 0 check (total >= 0)
);

create table if not exists public.yeshiva_analytics (
  yeshiva_id text primary key,
  first_place_count bigint not null default 0 check (first_place_count >= 0),
  second_place_count bigint not null default 0 check (second_place_count >= 0),
  third_place_count bigint not null default 0 check (third_place_count >= 0),
  score_total numeric not null default 0 check (score_total >= 0),
  completion_count bigint not null default 0 check (completion_count >= 0)
);

alter table public.analytics_counters enable row level security;
alter table public.yeshiva_analytics enable row level security;
revoke all on public.analytics_counters, public.yeshiva_analytics from public, anon, authenticated;

create index if not exists submissions_pending_created_at_idx
  on public.submissions (created_at)
  where status = 'pending';

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

create or replace function public.has_current_questionnaire_answers(p_answers jsonb)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_typeof(p_answers) = 'object'
    and (select count(*) from jsonb_object_keys(p_answers)) = jsonb_array_length(content.questions)
    and not exists (
      select 1
      from jsonb_array_elements(content.questions) as q
      where not (p_answers ? (q.value->>'id'))
        or not exists (
          select 1
          from jsonb_array_elements(q.value->'options') as choice
          where choice.value->>'id' = p_answers->>(q.value->>'id')
        )
    ),
    false
  )
  from public.site_content as content
  where content.id = 'main';
$$;

create or replace function public.validate_submission_target()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  content public.site_content%rowtype;
begin
  select *
  into content
  from public.site_content
  where id = 'main';

  if not found then
    raise exception 'Site content has not been initialized.';
  end if;

  if new.request_type = 'suggest' then
    if new.yeshiva_id is not null then
      raise exception 'New yeshiva suggestions cannot reference an existing yeshiva.';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(content.yeshivot) as item
      where lower(btrim(new.yeshiva_name)) in (
        lower(btrim(coalesce(item.value->>'name', ''))),
        lower(btrim(coalesce(item.value->>'shortName', '')))
      )
    ) then
      raise exception 'A yeshiva with this name already exists.';
    end if;
  elsif new.request_type = 'update' then
    if new.yeshiva_id is null or not exists (
      select 1
      from jsonb_array_elements(content.yeshivot) as item
      where item.value->>'id' = new.yeshiva_id
        and lower(btrim(new.yeshiva_name)) in (
          lower(btrim(coalesce(item.value->>'name', ''))),
          lower(btrim(coalesce(item.value->>'shortName', '')))
        )
    ) then
      raise exception 'Updates must reference an existing yeshiva.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_submission_target_before_insert on public.submissions;
create trigger validate_submission_target_before_insert
  before insert on public.submissions
  for each row execute function public.validate_submission_target();

create or replace function public.record_public_analytics_event(p_event_type text, p_results jsonb default '[]'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  result_item jsonb;
  score_value numeric;
  result_rank integer;
  expected_yeshiva_count integer;
begin
  if p_event_type is null or p_event_type not in ('completion', 'share_home', 'share_results') then
    raise exception 'Unsupported analytics event.';
  end if;

  if p_event_type = 'completion' then
    if jsonb_typeof(p_results) is distinct from 'array' or jsonb_array_length(p_results) > 100 then
      raise exception 'Completion results must be an array of up to one hundred placements.';
    end if;
    select jsonb_array_length(yeshivot)
    into expected_yeshiva_count
    from public.site_content
    where id = 'main';

    if expected_yeshiva_count is null or jsonb_array_length(p_results) <> expected_yeshiva_count then
      raise exception 'Completion results do not match the current yeshiva list.';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(p_results) as placement(value)
      group by placement.value->>'rank'
      having count(*) > 1
    ) or exists (
      select 1
      from jsonb_array_elements(p_results) as placement(value)
      group by placement.value->>'yeshiva_id'
      having count(*) > 1
    ) then
      raise exception 'Completion rankings must be unique.';
    end if;

    insert into public.analytics_counters as existing_counter (event_type, total)
    values ('completion', 1)
    on conflict (event_type) do update
    set total = existing_counter.total + 1;

    for result_item in select value from jsonb_array_elements(p_results)
    loop
      if coalesce(result_item->>'yeshiva_id', '') = ''
        or coalesce(result_item->>'rank', '') !~ '^([1-9]|[1-9][0-9]|100)$'
        or coalesce(result_item->>'score', '') !~ '^[0-9]+([.][0-9]+)?$' then
        raise exception 'Invalid completion placement.';
      end if;

      score_value := (result_item->>'score')::numeric;
      result_rank := (result_item->>'rank')::integer;
      if score_value < 0 or score_value > 100 then
        raise exception 'Completion score is outside the allowed range.';
      end if;
      if not exists (
        select 1
        from public.site_content as content,
          jsonb_array_elements(content.yeshivot) as yeshiva(value)
        where content.id = 'main'
          and yeshiva.value->>'id' = result_item->>'yeshiva_id'
      ) then
        raise exception 'Completion contains an unknown yeshiva.';
      end if;

      insert into public.yeshiva_analytics as current_stats (
        yeshiva_id,
        first_place_count,
        second_place_count,
        third_place_count,
        score_total,
        completion_count
      )
      values (
        result_item->>'yeshiva_id',
        case when result_rank = 1 then 1 else 0 end,
        case when result_rank = 2 then 1 else 0 end,
        case when result_rank = 3 then 1 else 0 end,
        score_value,
        1
      )
      on conflict (yeshiva_id) do update
      set first_place_count = current_stats.first_place_count + excluded.first_place_count,
          second_place_count = current_stats.second_place_count + excluded.second_place_count,
          third_place_count = current_stats.third_place_count + excluded.third_place_count,
          score_total = current_stats.score_total + excluded.score_total,
          completion_count = current_stats.completion_count + excluded.completion_count;
    end loop;
  else
    insert into public.analytics_counters as existing_counter (event_type, total)
    values (p_event_type, 1)
    on conflict (event_type) do update
    set total = existing_counter.total + 1;
  end if;
end;
$$;

revoke all on function public.record_public_analytics_event(text, jsonb) from public;
grant execute on function public.record_public_analytics_event(text, jsonb) to anon, authenticated;

create or replace function public.get_admin_analytics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_site_admin() then
    raise exception 'Administrator access is required.';
  end if;

  return (
    select jsonb_build_object(
      'completions', coalesce((select total from public.analytics_counters where event_type = 'completion'), 0),
      'home_shares', coalesce((select total from public.analytics_counters where event_type = 'share_home'), 0),
      'results_shares', coalesce((select total from public.analytics_counters where event_type = 'share_results'), 0),
      'yeshivot', coalesce((
        select jsonb_agg(jsonb_build_object(
          'yeshiva_id', yeshiva_id,
          'first_place', first_place_count,
          'second_place', second_place_count,
          'third_place', third_place_count,
          'average_score', case when completion_count > 0 then score_total / completion_count else 0 end
        ) order by first_place_count desc, score_total / nullif(completion_count, 0) desc)
        from public.yeshiva_analytics
      ), '[]'::jsonb)
    )
  );
end;
$$;

revoke all on function public.get_admin_analytics() from public, anon;
grant execute on function public.get_admin_analytics() to authenticated;

create or replace function public.reset_admin_analytics()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_site_admin() then
    raise exception 'Administrator access is required.';
  end if;

  delete from public.yeshiva_analytics
  where yeshiva_id is not null;
  delete from public.analytics_counters
  where event_type in ('completion', 'share_home', 'share_results');
end;
$$;

revoke all on function public.reset_admin_analytics() from public, anon;
grant execute on function public.reset_admin_analytics() to authenticated;

create or replace function public.restore_site_defaults(
  p_questions jsonb,
  p_yeshivot jsonb,
  p_parameters jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_site_admin() then
    raise exception 'Administrator access is required.';
  end if;
  if jsonb_typeof(p_questions) is distinct from 'array' or jsonb_array_length(p_questions) = 0
    or jsonb_typeof(p_yeshivot) is distinct from 'array' or jsonb_array_length(p_yeshivot) = 0
    or jsonb_typeof(p_parameters) is distinct from 'array' then
    raise exception 'Default content has an invalid structure.';
  end if;

  insert into public.site_content (id, questions, yeshivot, parameters, updated_at, updated_by)
  values ('main', p_questions, p_yeshivot, p_parameters, now(), (select auth.uid()))
  on conflict (id) do update
  set questions = excluded.questions,
      yeshivot = excluded.yeshivot,
      parameters = excluded.parameters,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by;

  delete from public.yeshiva_analytics
  where yeshiva_id is not null;
  delete from public.analytics_counters
  where event_type in ('completion', 'share_home', 'share_results');
end;
$$;

revoke all on function public.restore_site_defaults(jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.restore_site_defaults(jsonb, jsonb, jsonb) to authenticated;

revoke all on function public.has_current_questionnaire_answers(jsonb) from public;
grant execute on function public.has_current_questionnaire_answers(jsonb) to anon, authenticated;

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;
grant insert on public.submissions to anon, authenticated;
grant select, update on public.submissions to authenticated;
grant select on public.admins to authenticated;

alter table public.site_content enable row level security;
alter table public.admins enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
  on public.site_content for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert site content" on public.site_content;
create policy "Admins can insert site content"
  on public.site_content for insert
  to authenticated
  with check (public.is_site_admin());

drop policy if exists "Admins can update site content" on public.site_content;
create policy "Admins can update site content"
  on public.site_content for update
  to authenticated
  using (public.is_site_admin())
  with check (public.is_site_admin());

drop policy if exists "Admins can read their own membership" on public.admins;
create policy "Admins can read their own membership"
  on public.admins for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Visitors can submit pending requests" on public.submissions;
create policy "Visitors can submit pending requests"
  on public.submissions for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and reviewed_at is null
    and reviewed_by is null
    and public.has_current_questionnaire_answers(answers)
  );

drop policy if exists "Admins can read submissions" on public.submissions;
create policy "Admins can read submissions"
  on public.submissions for select
  to authenticated
  using (public.is_site_admin());

drop policy if exists "Admins can review submissions" on public.submissions;
create policy "Admins can review submissions"
  on public.submissions for update
  to authenticated
  using (public.is_site_admin())
  with check (public.is_site_admin());

notify pgrst, 'reload schema';
