export interface Trade {
  id: string;
  time: string;
  pair: string;
  type: 'LONG' | 'SHORT';
  size: string;
  entry: number;
  exit: number;
  pnl: number;
  status: 'gain' | 'loss';
  notes?: string;
  strategyId?: string;
  selections: Record<string, string[]>; // categoryId -> array of tag texts
  reflection?: string;
  screenshots?: string[]; // Array of base64 data URLs
}

export interface StatMetric {
  label: string;
  value: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
}

export interface Tag {
  text: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  tags: Tag[];
  selectionType: 'single' | 'multi';
}

export interface Strategy {
  id: string;
  name: string;
  startingEquity: number;
  layers: {
    layer1: Category[];
    layer2: Category[];
    layer3: Category[];
    layer4: Category[];
  };
  createdAt: string;
}

export type ViewState = 'dashboard' | 'log' | 'analytics' | 'risk' | 'settings' | 'strategy' | 'notes';

export type PlanType = 'free' | 'pro';
export type PlanStatusType = 'active' | 'pending_upgrade' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  name: string;
  plan: PlanType;
  plan_status: PlanStatusType;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface SubAccount {
  id: string;
  user_id: string;
  name: string;
  starting_equity: number;
  timezone: string;
  rules?: string[];
  created_at: string;
  updated_at: string;
}

export interface StrategyConfig {
  id: string;
  sub_account_id: string;
  name: string;
  layers: {
    layer1: Category[];
    layer2: Category[];
    layer3: Category[];
    layer4: Category[];
  };
  created_at: string;
  updated_at: string;
}

export interface NoteCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  category_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}