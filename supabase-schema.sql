create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('coach', 'athlete')),
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.coach_athletes (
  athlete_id uuid primary key references public.profiles(user_id) on delete cascade,
  coach_id uuid not null references public.profiles(user_id) on delete cascade,
  linked_at timestamptz not null default now(),
  check (coach_id <> athlete_id)
);

create table if not exists public.coach_link_codes (
  code_hash bytea primary key,
  coach_id uuid not null references public.profiles(user_id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.training_plans (
  athlete_id uuid primary key references public.profiles(user_id) on delete cascade,
  sessions jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(user_id)
);

create or replace function public.touch_training_plan()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_training_plan_updated_at on public.training_plans;
create trigger touch_training_plan_updated_at
before update on public.training_plans
for each row execute function public.touch_training_plan();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_role text := coalesce(new.raw_user_meta_data ->> 'role', 'athlete');
  selected_name text := coalesce(new.raw_user_meta_data ->> 'display_name', '');
begin
  if selected_role not in ('coach', 'athlete') then
    selected_role := 'athlete';
  end if;
  insert into public.profiles (user_id, role, display_name)
  values (new.id, selected_role, left(selected_name, 80));
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create or replace function public.create_coach_link_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_code text := encode(extensions.gen_random_bytes(16), 'hex');
begin
  if not exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'coach'
  ) then
    raise exception 'Only coach accounts can create link codes';
  end if;
  insert into public.coach_link_codes (code_hash, coach_id, expires_at)
  values (extensions.digest(new_code, 'sha256'), auth.uid(), now() + interval '30 minutes');
  return new_code;
end;
$$;

create or replace function public.redeem_coach_link_code(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  link_code public.coach_link_codes%rowtype;
begin
  if not exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'athlete'
  ) then
    raise exception 'Only athlete accounts can redeem link codes';
  end if;
  if p_code is null or length(trim(p_code)) <> 32 then
    raise exception 'Invalid or expired link code';
  end if;
  select * into link_code
  from public.coach_link_codes
  where code_hash = extensions.digest(lower(trim(p_code)), 'sha256')
  for update;
  if not found or link_code.used_at is not null or link_code.expires_at <= now() then
    raise exception 'Invalid or expired link code';
  end if;
  if exists (select 1 from public.coach_athletes where athlete_id = auth.uid()) then
    raise exception 'This athlete account is already linked to a coach';
  end if;
  insert into public.coach_athletes (athlete_id, coach_id)
  values (auth.uid(), link_code.coach_id);
  update public.coach_link_codes set used_at = now() where code_hash = link_code.code_hash;
end;
$$;

alter table public.profiles enable row level security;
alter table public.coach_athletes enable row level security;
alter table public.coach_link_codes enable row level security;
alter table public.training_plans enable row level security;

drop policy if exists "Profiles visible to account and linked counterpart" on public.profiles;
create policy "Profiles visible to account and linked counterpart"
on public.profiles for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.coach_athletes ca
    where (ca.coach_id = (select auth.uid()) and ca.athlete_id = profiles.user_id)
       or (ca.athlete_id = (select auth.uid()) and ca.coach_id = profiles.user_id)
  )
);

drop policy if exists "Linked pair can view relationship" on public.coach_athletes;
create policy "Linked pair can view relationship"
on public.coach_athletes for select to authenticated
using (coach_id = (select auth.uid()) or athlete_id = (select auth.uid()));

drop policy if exists "Either side can unlink" on public.coach_athletes;
create policy "Either side can unlink"
on public.coach_athletes for delete to authenticated
using (coach_id = (select auth.uid()) or athlete_id = (select auth.uid()));

drop policy if exists "Linked pair can read training plan" on public.training_plans;
create policy "Linked pair can read training plan"
on public.training_plans for select to authenticated
using (
  athlete_id = (select auth.uid())
  or exists (
    select 1 from public.coach_athletes ca
    where ca.athlete_id = training_plans.athlete_id
      and ca.coach_id = (select auth.uid())
  )
);

drop policy if exists "Linked coach can create training plan" on public.training_plans;
create policy "Linked coach can create training plan"
on public.training_plans for insert to authenticated
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.coach_athletes ca
    where ca.athlete_id = training_plans.athlete_id
      and ca.coach_id = (select auth.uid())
  )
);

drop policy if exists "Linked coach can edit training plan" on public.training_plans;
create policy "Linked coach can edit training plan"
on public.training_plans for update to authenticated
using (
  exists (
    select 1 from public.coach_athletes ca
    where ca.athlete_id = training_plans.athlete_id
      and ca.coach_id = (select auth.uid())
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.coach_athletes ca
    where ca.athlete_id = training_plans.athlete_id
      and ca.coach_id = (select auth.uid())
  )
);

grant usage on schema public to authenticated;
revoke all on public.profiles, public.coach_athletes, public.coach_link_codes, public.training_plans from anon, authenticated;
grant select on public.profiles, public.coach_athletes, public.training_plans to authenticated;
grant delete on public.coach_athletes to authenticated;
grant insert, update on public.training_plans to authenticated;
revoke all on function public.create_coach_link_code() from public, anon, authenticated;
revoke all on function public.redeem_coach_link_code(text) from public, anon, authenticated;
grant execute on function public.create_coach_link_code() to authenticated;
grant execute on function public.redeem_coach_link_code(text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'training_plans'
  ) then
    alter publication supabase_realtime add table public.training_plans;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'coach_athletes'
  ) then
    alter publication supabase_realtime add table public.coach_athletes;
  end if;
end;
$$;
