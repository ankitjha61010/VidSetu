-- VidSetu Watch Space schema
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / CREATE OR REPLACE).

-- ============================================================================
-- Enums
-- ============================================================================
do $$ begin
  create type watch_space_role as enum ('OWNER', 'ADMIN', 'MEMBER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type watch_space_member_status as enum ('ACTIVE', 'INVITED', 'REMOVED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_type as enum ('movie', 'tv');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- Tables
-- ============================================================================

-- One row per authenticated user, mirrors auth.users, kept up to date by the
-- handle_new_user trigger below (fires on Google sign-in via Supabase Auth).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Lookup table only - no billing logic. Watch spaces read member_limit from here.
-- Do NOT hard-code member counts anywhere in application code; always resolve
-- through subscription_plans -> watch_spaces.member_limit.
create table if not exists public.subscription_plans (
  id text primary key,
  name text not null,
  member_limit integer not null,
  status text not null default 'active'
);

insert into public.subscription_plans (id, name, member_limit, status) values
  ('FREE', 'Free', 1, 'active'),
  ('PRO', 'Pro', 4, 'active'),
  ('BUSINESS', 'Business', 10, 'active')
on conflict (id) do update set
  name = excluded.name,
  member_limit = excluded.member_limit,
  status = excluded.status;

create table if not exists public.watch_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  subscription_plan_id text references public.subscription_plans (id),
  member_limit integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.watch_space_members (
  watch_space_id uuid not null references public.watch_spaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role watch_space_role not null default 'MEMBER',
  status watch_space_member_status not null default 'ACTIVE',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (watch_space_id, user_id)
);

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  watch_space_id uuid not null references public.watch_spaces (id) on delete cascade,
  tmdb_id integer not null,
  media_type media_type not null,
  added_by uuid not null references public.profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (watch_space_id, tmdb_id, media_type)
);

create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  watch_space_id uuid not null references public.watch_spaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  tmdb_id integer not null,
  media_type media_type not null,
  season integer,
  episode integer,
  progress_seconds integer not null default 0,
  duration_seconds integer not null default 0,
  last_watched_at timestamptz not null default now(),
  unique (watch_space_id, user_id, tmdb_id, media_type, season, episode)
);

-- ============================================================================
-- Auth trigger: create/update a profile row whenever a user signs in
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    avatar_url = excluded.avatar_url;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- Watch space triggers: default member_limit from plan, auto-add owner as member
-- ============================================================================
create or replace function public.set_watch_space_member_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.subscription_plan_id is not null then
    select member_limit into new.member_limit
    from public.subscription_plans where id = new.subscription_plan_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_watch_space_member_limit on public.watch_spaces;
create trigger trg_set_watch_space_member_limit
  before insert on public.watch_spaces
  for each row execute procedure public.set_watch_space_member_limit();

create or replace function public.add_owner_as_member()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.watch_space_members (watch_space_id, user_id, role, status)
  values (new.id, new.owner_id, 'OWNER', 'ACTIVE')
  on conflict (watch_space_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_add_owner_as_member on public.watch_spaces;
create trigger trg_add_owner_as_member
  after insert on public.watch_spaces
  for each row execute procedure public.add_owner_as_member();

-- Enforce member_limit whenever a new active member is added. Mirrors the
-- app-level check in watchSpaceService.ts - defense in depth, not the only check.
create or replace function public.enforce_member_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  current_count integer;
  space_limit integer;
begin
  if new.status = 'ACTIVE' then
    select member_limit into space_limit from public.watch_spaces where id = new.watch_space_id;
    select count(*) into current_count
    from public.watch_space_members
    where watch_space_id = new.watch_space_id and status = 'ACTIVE';

    if current_count >= space_limit then
      raise exception 'Watch Space member limit (%) reached', space_limit;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_member_limit on public.watch_space_members;
create trigger trg_enforce_member_limit
  before insert on public.watch_space_members
  for each row execute procedure public.enforce_member_limit();

-- ============================================================================
-- Invite by email (real, not fake): adds an EXISTING VidSetu user (one who has
-- signed in at least once, so a profiles row exists) to a Watch Space as an
-- ACTIVE member. There's no email-sending service wired up, so this is the
-- honest scope for "invite" today - a full pending-invite/accept flow can be
-- layered on later without changing this function's callers.
-- ============================================================================
create or replace function public.invite_member_by_email(space_id uuid, invitee_email text)
returns public.watch_space_members
language plpgsql
security definer set search_path = public
as $$
declare
  caller_role watch_space_role;
  invitee_id uuid;
  result public.watch_space_members;
begin
  select role into caller_role
  from public.watch_space_members
  where watch_space_id = space_id and user_id = auth.uid() and status = 'ACTIVE';

  if caller_role is null or caller_role not in ('OWNER', 'ADMIN') then
    raise exception 'Only the owner or an admin can invite members';
  end if;

  select id into invitee_id from public.profiles where email = invitee_email;
  if invitee_id is null then
    raise exception 'No VidSetu user found with email %. They need to sign in at least once first.', invitee_email;
  end if;

  insert into public.watch_space_members (watch_space_id, user_id, role, status)
  values (space_id, invitee_id, 'MEMBER', 'ACTIVE')
  on conflict (watch_space_id, user_id) do update set status = 'ACTIVE'
  returning * into result;

  return result;
end;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- security definer helper so member-list policies don't recursively query the
-- table they're defined on (a common RLS foot-gun).
create or replace function public.is_watch_space_member(space_id uuid, uid uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.watch_space_members m
    where m.watch_space_id = space_id and m.user_id = uid and m.status = 'ACTIVE'
  );
$$;

alter table public.profiles enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.watch_spaces enable row level security;
alter table public.watch_space_members enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.watch_history enable row level security;

drop policy if exists "profiles are self-readable and readable by space members" on public.profiles;
create policy "profiles are self-readable and readable by space members"
  on public.profiles for select
  using (id = auth.uid() or exists (
    select 1 from public.watch_space_members m
    where m.user_id = public.profiles.id
      and public.is_watch_space_member(m.watch_space_id, auth.uid())
  ));

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update
  using (id = auth.uid());

drop policy if exists "subscription plans are readable by anyone signed in" on public.subscription_plans;
create policy "subscription plans are readable by anyone signed in"
  on public.subscription_plans for select
  using (auth.role() = 'authenticated');

-- owner_id = auth.uid() is checked directly (not just membership) because INSERT ...
-- RETURNING requires the new row to also satisfy the SELECT policy at insert time,
-- before the add_owner_as_member trigger has had a chance to create the owner's
-- membership row - without this, creating a Watch Space fails with a row-level
-- security error even for the correct owner.
drop policy if exists "members can read their watch spaces" on public.watch_spaces;
create policy "members can read their watch spaces"
  on public.watch_spaces for select
  using (owner_id = auth.uid() or public.is_watch_space_member(id, auth.uid()));

drop policy if exists "users can create watch spaces" on public.watch_spaces;
create policy "users can create watch spaces"
  on public.watch_spaces for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "owners/admins can update their watch space" on public.watch_spaces;
create policy "owners/admins can update their watch space"
  on public.watch_spaces for update
  using (exists (
    select 1 from public.watch_space_members m
    where m.watch_space_id = id and m.user_id = auth.uid()
      and m.role in ('OWNER', 'ADMIN') and m.status = 'ACTIVE'
  ));

drop policy if exists "owners can delete their watch space" on public.watch_spaces;
create policy "owners can delete their watch space"
  on public.watch_spaces for delete
  using (owner_id = auth.uid());

drop policy if exists "members can read the member list of their spaces" on public.watch_space_members;
create policy "members can read the member list of their spaces"
  on public.watch_space_members for select
  using (public.is_watch_space_member(watch_space_id, auth.uid()));

drop policy if exists "owners/admins can add members" on public.watch_space_members;
create policy "owners/admins can add members"
  on public.watch_space_members for insert
  with check (
    user_id = auth.uid() -- joining as owner (handled by trigger) or self-service invite accept
    or exists (
      select 1 from public.watch_space_members m
      where m.watch_space_id = watch_space_members.watch_space_id and m.user_id = auth.uid()
        and m.role in ('OWNER', 'ADMIN') and m.status = 'ACTIVE'
    )
  );

drop policy if exists "owners/admins can update members" on public.watch_space_members;
create policy "owners/admins can update members"
  on public.watch_space_members for update
  using (exists (
    select 1 from public.watch_space_members m
    where m.watch_space_id = watch_space_members.watch_space_id and m.user_id = auth.uid()
      and m.role in ('OWNER', 'ADMIN') and m.status = 'ACTIVE'
  ));

drop policy if exists "owners/admins can remove members" on public.watch_space_members;
create policy "owners/admins can remove members"
  on public.watch_space_members for delete
  using (exists (
    select 1 from public.watch_space_members m
    where m.watch_space_id = watch_space_members.watch_space_id and m.user_id = auth.uid()
      and m.role in ('OWNER', 'ADMIN') and m.status = 'ACTIVE'
  ));

drop policy if exists "members can read their space's watchlist" on public.watchlist_items;
create policy "members can read their space's watchlist"
  on public.watchlist_items for select
  using (public.is_watch_space_member(watch_space_id, auth.uid()));

drop policy if exists "members can add to their space's watchlist" on public.watchlist_items;
create policy "members can add to their space's watchlist"
  on public.watchlist_items for insert
  with check (public.is_watch_space_member(watch_space_id, auth.uid()) and added_by = auth.uid());

drop policy if exists "members can remove from their space's watchlist" on public.watchlist_items;
create policy "members can remove from their space's watchlist"
  on public.watchlist_items for delete
  using (public.is_watch_space_member(watch_space_id, auth.uid()));

drop policy if exists "members can read their space's watch history" on public.watch_history;
create policy "members can read their space's watch history"
  on public.watch_history for select
  using (public.is_watch_space_member(watch_space_id, auth.uid()));

drop policy if exists "members can write their own watch history" on public.watch_history;
create policy "members can write their own watch history"
  on public.watch_history for insert
  with check (public.is_watch_space_member(watch_space_id, auth.uid()) and user_id = auth.uid());

drop policy if exists "members can update their own watch history" on public.watch_history;
create policy "members can update their own watch history"
  on public.watch_history for update
  using (user_id = auth.uid());
