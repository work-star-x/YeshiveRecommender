create table if not exists public.site_content (
  id text primary key check (id = 'main'),
  questions jsonb not null,
  yeshivot jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  yeshiva_name text not null check (length(trim(yeshiva_name)) between 1 and 120),
  request_type text not null check (request_type in ('suggest', 'update')),
  notes text check (notes is null or length(notes) <= 2000),
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'applied', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

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
    and jsonb_object_length(p_answers) =and (select count(*) from jsonb_object_keys(p_answers))
    = jsonb_array_length(content.questions) jsonb_array_length(content.questions)
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
