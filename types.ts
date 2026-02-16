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
  layers: {
    layer1: Category[];
    layer2: Category[];
    layer3: Category[];
    layer4: Category[];
  };
  createdAt: string;
}

export type ViewState = 'overview' | 'log' | 'analytics' | 'risk' | 'settings' | 'strategy';