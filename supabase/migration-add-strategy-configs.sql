-- ============================================================================
-- RefineTrade Migration: Add Strategy Configs
-- Run this if you already have the base schema and need to add strategy_configs
-- ============================================================================

-- ============================================================================
-- STRATEGY CONFIGS TABLE (1:1 with sub_accounts - stores custom tags)
-- ============================================================================
CREATE TABLE IF NOT EXISTS strategy_configs (
  id uuid default gen_random_uuid() primary key,
  sub_account_id uuid references sub_accounts(id) on delete cascade unique,
  name text,
  layers jsonb default '{"layer1":[],"layer2":[],"layer3":[],"layer4":[]}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- ADD selections COLUMN TO TRADES (if not exists)
-- ============================================================================
ALTER TABLE trades ADD COLUMN IF NOT EXISTS selections jsonb DEFAULT '{}';

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_strategy_configs_sub_account_id ON strategy_configs(sub_account_id);

-- ============================================================================
-- ENABLE RLS ON strategy_configs
-- ============================================================================
ALTER TABLE strategy_configs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR strategy_configs
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own strategy configs" ON strategy_configs;
CREATE POLICY "Users can view own strategy configs" ON strategy_configs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sub_accounts 
    WHERE sub_accounts.id = strategy_configs.sub_account_id 
    AND sub_accounts.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert own strategy configs" ON strategy_configs;
CREATE POLICY "Users can insert own strategy configs" ON strategy_configs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM sub_accounts 
    WHERE sub_accounts.id = strategy_configs.sub_account_id 
    AND sub_accounts.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own strategy configs" ON strategy_configs;
CREATE POLICY "Users can update own strategy configs" ON strategy_configs FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM sub_accounts 
    WHERE sub_accounts.id = strategy_configs.sub_account_id 
    AND sub_accounts.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own strategy configs" ON strategy_configs;
CREATE POLICY "Users can delete own strategy configs" ON strategy_configs FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM sub_accounts 
    WHERE sub_accounts.id = strategy_configs.sub_account_id 
    AND sub_accounts.user_id = auth.uid()
  )
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
