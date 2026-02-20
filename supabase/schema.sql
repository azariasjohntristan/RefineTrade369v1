-- ============================================================================
-- RefineTrade Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, drop tables that depend on the types
drop table if exists trades cascade;
drop table if exists sub_accounts cascade;
drop table if exists profiles cascade;

-- Now drop the types
drop type if exists plan_status_type;
drop type if exists plan_type;

-- ============================================================================
-- ENUMS
-- ============================================================================
create type plan_type as enum ('free', 'pro');
create type plan_status_type as enum ('active', 'pending_upgrade', 'cancelled');

-- ============================================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text default 'Trader' not null,
  plan plan_type default 'free',
  plan_status plan_status_type default 'active',
  timezone text default 'UTC',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- SUB_ACCOUNTS TABLE (Trading Strategies)
-- ============================================================================
create table sub_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  starting_equity numeric default 10000,
  timezone text default 'UTC',
  rules text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- STRATEGY CONFIGS TABLE (1:1 with sub_accounts - stores custom tags)
-- ============================================================================
create table if not exists strategy_configs (
  id uuid default gen_random_uuid() primary key,
  sub_account_id uuid references sub_accounts(id) on delete cascade unique,
  name text,
  layers jsonb default '{"layer1":[],"layer2":[],"layer3":[],"layer4":[]}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table trades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  sub_account_id uuid references sub_accounts(id) on delete cascade not null,
  time timestamptz not null,
  pair text not null,
  type text not null check (type in ('LONG', 'SHORT')),
  size text not null,
  entry numeric not null,
  exit numeric not null,
  pnl numeric not null,
  status text not null check (status in ('gain', 'loss')),
  notes text,
  reflection text,
  selections jsonb default '{}',
  screenshots text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index idx_sub_accounts_user_id on sub_accounts(user_id);
create index idx_trades_user_id on trades(user_id);
create index idx_trades_sub_account_id on trades(sub_account_id);
create index idx_trades_created_at on trades(created_at desc);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
alter table profiles enable row level security;
alter table sub_accounts enable row level security;
alter table trades enable row level security;

-- ============================================================================
-- RLS POLICIES: PROFILES
-- ============================================================================
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES: SUB_ACCOUNTS
-- ============================================================================
create policy "Users can view own subaccounts"
  on sub_accounts for select
  using (auth.uid() = user_id);

create policy "Users can create subaccounts"
  on sub_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subaccounts"
  on sub_accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete own subaccounts"
  on sub_accounts for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- STRATEGY CONFIGS (1:1 with sub_accounts)
-- ============================================================================
-- Enable RLS
alter table strategy_configs enable row level security;

-- Index
create index if not exists idx_strategy_configs_sub_account_id on strategy_configs(sub_account_id);

-- RLS Policies (access via sub_accounts relationship)
create policy "Users can view own strategy configs"
  on strategy_configs for select
  using (
    exists (
      select 1 from sub_accounts 
      where sub_accounts.id = strategy_configs.sub_account_id 
      and sub_accounts.user_id = auth.uid()
    )
  );

create policy "Users can insert own strategy configs"
  on strategy_configs for insert
  with check (
    exists (
      select 1 from sub_accounts 
      where sub_accounts.id = strategy_configs.sub_account_id 
      and sub_accounts.user_id = auth.uid()
    )
  );

create policy "Users can update own strategy configs"
  on strategy_configs for update
  using (
    exists (
      select 1 from sub_accounts 
      where sub_accounts.id = strategy_configs.sub_account_id 
      and sub_accounts.user_id = auth.uid()
    )
  );

create policy "Users can delete own strategy configs"
  on strategy_configs for delete
  using (
    exists (
      select 1 from sub_accounts 
      where sub_accounts.id = strategy_configs.sub_account_id 
      and sub_accounts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: TRADES
-- ============================================================================
create policy "Users can view own trades"
  on trades for select
  using (auth.uid() = user_id);

create policy "Users can create trades"
  on trades for insert
  with check (auth.uid() = user_id);

create policy "Users can update own trades"
  on trades for update
  using (auth.uid() = user_id);

create policy "Users can delete own trades"
  on trades for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- FUNCTION: Create profile on user signup (trigger)
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- FUNCTION: Update updated_at timestamp
-- ============================================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_profiles_updated_at on profiles;
create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();

drop trigger if exists update_sub_accounts_updated_at on sub_accounts;
create trigger update_sub_accounts_updated_at before update on sub_accounts
  for each row execute function update_updated_at_column();

drop trigger if exists update_trades_updated_at on trades;
create trigger update_trades_updated_at before update on trades
  for each row execute function update_updated_at_column();

-- ============================================================================
-- PLAN LIMITS CONSTANTS
-- ============================================================================
-- FREE PLAN:  max_trades = 100, max_subaccounts = 1
-- PRO PLAN:    max_trades = UNLIMITED, max_subaccounts = UNLIMITED

-- ============================================================================
-- MIGRATION: Add rules column if not exists (run this if table already exists)
-- ============================================================================
-- ALTER TABLE sub_accounts ADD COLUMN IF NOT EXISTS rules text[] DEFAULT '{}';
