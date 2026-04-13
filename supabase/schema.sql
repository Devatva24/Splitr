-- ============================================================
--  Splitr — Supabase Database Schema
--  Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Groups table
create table if not exists public.groups (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  name            text not null,
  emoji           text not null default '👥',
  members         text[]  not null default '{}',
  member_profiles jsonb   not null default '{}',
  created_at      timestamptz not null default now()
);

-- Expenses table
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references public.groups(id) on delete cascade not null,
  description text    not null,
  amount      numeric(14, 2) not null,
  payer       text    not null,
  split_among text[]  not null default '{}',
  settled     boolean not null default false,
  date        text    not null,
  category    text    not null default 'general',
  created_at  timestamptz not null default now(),
  edited_at   timestamptz
);

-- ── Row Level Security ────────────────────────────────────────
alter table public.groups   enable row level security;
alter table public.expenses enable row level security;

-- Users can only see / modify their own groups
create policy "users_own_groups"
  on public.groups for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can only see / modify expenses that belong to their groups
create policy "users_own_expenses"
  on public.expenses for all
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.user_id = auth.uid()
    )
  );

-- ── Indexes (optional but helpful) ───────────────────────────
create index if not exists groups_user_id_idx   on public.groups(user_id);
create index if not exists expenses_group_id_idx on public.expenses(group_id);
