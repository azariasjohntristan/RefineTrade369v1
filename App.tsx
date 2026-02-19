import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ScrollText, 
  BarChart2, 
  ShieldAlert, 
  Settings,
  Bell,
  Search,
  Wifi,
  ChevronDown,
  X,
  Menu,
  Layers,
  Calendar
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import StatCard from './components/StatCard';
import TradeTable from './components/TradeTable';
import TradeForm from './components/TradeForm';
import StrategyBuilder from './components/StrategyBuilder';
import AIAnalyst from './components/AIAnalyst';
import { Trade, ViewState, Strategy } from './types';

// Initial Mock Data with 10 Feb Trades updated to match new default strategy structure
const INITIAL_TRADES: Trade[] = [
  { 
    id: 'f10', 
    time: '2024-02-28T14:20:00Z', 
    pair: 'NQ', 
    type: 'SHORT', 
    size: '1.5 Lot', 
    entry: 17850.25, 
    exit: 17900.50, 
    pnl: -450.00, 
    status: 'loss', 
    strategyId: 'strat-default-sr',
    selections: {
      'cat-instrument': ['NQ'],
      'cat-sr-logic': ['MINOR_S/R'],
      'cat-risk-mgt': ['FIXED_1%'],
      'cat-neural-state': ['HESITANT']
    },
    reflection: 'EXITS WERE SLOPPY. MOVED STOP TO BREAKEVEN TOO LATE.'
  },
  { 
    id: 'f9', 
    time: '2024-02-27T09:15:00Z', 
    pair: 'NQ', 
    type: 'LONG', 
    size: '2.0 Lot', 
    entry: 17750.00, 
    exit: 17825.00, 
    pnl: 1500.00, 
    status: 'gain', 
    strategyId: 'strat-default-sr',
    selections: {
      'cat-instrument': ['NQ'],
      'cat-sr-logic': ['MAJOR_S/R', 'VBP_POC'],
      'cat-risk-mgt': ['SCALED_ENTRY'],
      'cat-neural-state': ['OPTIMAL_FLOW']
    },
    reflection: 'SOLID CONFLUENCE AT PSYCHOLOGICAL LEVEL.'
  },
  { 
    id: 'f8', 
    time: '2024-02-25T20:30:00Z', 
    pair: 'ES', 
    type: 'SHORT', 
    size: '1.0 Lot', 
    entry: 5080.25, 
    exit: 5070.25, 
    pnl: 500.00, 
    status: 'gain', 
    strategyId: 'strat-default-sr',
    selections: {
      'cat-instrument': ['ES'],
      'cat-sr-logic': ['DYNAMIC_EMA'],
      'cat-risk-mgt': ['FIXED_1%'],
      'cat-neural-state': ['OPTIMAL_FLOW']
    },
    reflection: 'TREND FOLLOWING AT ITS BEST. CLEAN REJECTION.'
  },
  { 
    id: 'f7', 
    time: '2024-02-22T15:00:00Z', 
    pair: 'NQ', 
    type: 'LONG', 
    size: '1.0 Lot', 
    entry: 17950.00, 
    exit: 17940.00, 
    pnl: -200.00, 
    status: 'loss', 
    strategyId: 'strat-default-sr',
    selections: {
      'cat-instrument': ['NQ'],
      'cat-sr-logic': ['VBP_POC'],
      'cat-risk-mgt': ['AGGRESSIVE'],
      'cat-neural-state': ['FOMO_IMPULSE']
    },
    reflection: 'CHASED THE PUMP. LEARN TO WAIT FOR THE PULLBACK.'
  },
  { 
    id: 'f6', 
    time: '2024-02-19T11:45:00Z', 
    pair: 'NQ', 
    type: 'LONG', 
    size: '0.5 Lot', 
    entry: 17815.00, 
    exit: 17832.00, 
    pnl: 850.00, 
    status: 'gain', 
    strategyId: 'strat-default-sr',
    selections: {
      'cat-instrument': ['NQ'],
      'cat-sr-logic': ['MAJOR_S/R'],
      'cat-risk-mgt': ['FIXED_1%'],
      'cat-neural-state': ['OPTIMAL_FLOW']
    },
    reflection: 'PATIENT EXECUTION AT PREVIOUS DAY LOW.'
  },
  { 
    id: 'f5', 
    time: '2024-02-15T13:20:00Z', 
    pair: 'ES', 
    type: 'SHORT', 
    size: '3.0 Lot', 
    entry: 5078.00, 
    exit: 5081.50, 
    pnl: -1050.00, 
    status: 'loss', 
    strategyId: 'strat-default-sr',
    selections: {
      'cat-instrument': ['ES'],
      'cat-sr-logic': ['DYNAMIC_EMA'],
      'cat-risk-mgt': ['FIXED_1%'],
      'cat-neural-state': ['HESITANT']
    },
    reflection: 'COUNTER-TREND ATTEMPT FAILED. STICK TO THE BIAS.'
  },
  { 
    id: 'f4', 
    time: '2024-02-12T08:00:00Z', 
    pair: 'NQ', 
    type: 'SHORT', 
    size: '2.0 Lot', 
    entry: 17989.50, 
    exit: 17988.20, 
    pnl: 1730.00, 
    status: 'gain', 
    strategyId: 'strat-default-sr',
    selections: {
      'cat-instrument': ['NQ'],
      'cat-sr-logic': ['MAJOR_S/R'],
      'cat-risk-mgt': ['SCALED_ENTRY'],
      'cat-neural-state': ['OPTIMAL_FLOW']
    },
    reflection: 'LONDON OPEN VOLATILITY WORKED IN FAVOR.'
  },
  { 
    id: 'f3', 
    time: '2024-02-08T16:40:00Z', 
    pair: 'NQ', 
    type: 'LONG', 
    size: '0.1 BTC', 
    entry: 17844.00, 
    exit: 17845.00, 
    pnl: 160.00, 
    status: 'gain', 
    strategyId: 'strat-default-sr',
    selections: {
      'cat-instrument': ['NQ'],
      'cat-sr-logic': ['VBP_POC', 'MAJOR_S/R'],
      'cat-risk-mgt': ['FIXED_1%'],
      'cat-neural-state': ['OPTIMAL_FLOW']
    },
    reflection: 'LONG TERM POSITIONING. MACRO BIAS IS BULLISH.'
  },
  { 
    id: 'f2', 
    time: '2024-02-04T12:10:00Z', 
    pair: 'NQ', 
    type: 'SHORT', 
    size: '1.2 Lot', 
    entry: 17820.50, 
    exit: 17830.00, 
    pnl: -1140.00, 
    status: 'loss', 
    strategyId: 'strat-default-sr',
    selections: {
      'cat-instrument': ['NQ'],
      'cat-sr-logic': ['MINOR_S/R'],
      'cat-risk-mgt': ['AGGRESSIVE'],
      'cat-neural-state': ['FOMO_IMPULSE']
    },
    reflection: 'STOP HUNTED BEFORE THE MOVE. SPREADS WERE WIDE.'
  },
  { 
    id: 'f1', 
    time: '2024-02-01T10:00:00Z', 
    pair: 'NQ', 
    type: 'LONG', 
    size: '2.5 Lot', 
    entry: 17808.20, 
    exit: 17810.95, 
    pnl: 1875.00, 
    status: 'gain', 
    strategyId: 'strat-default-sr',
    selections: {
      'cat-instrument': ['NQ'],
      'cat-sr-logic': ['MAJOR_S/R'],
      'cat-risk-mgt': ['FIXED_1%'],
      'cat-neural-state': ['OPTIMAL_FLOW']
    },
    reflection: 'INITIAL FEB GAIN. FOLLOWED THE PLAN PERFECTLY.'
  },
];

const DEFAULT_STRATEGY: Strategy = {
  id: 'strat-default-sr',
  name: 'SUPPORT AND RESISTANCE',
  layers: {
    layer1: [
      {
        id: 'cat-instrument',
        name: 'INSTRUMENT',
        selectionType: 'single',
        tags: [
          { text: 'NQ', color: '#06b6d4' },
          { text: 'ES', color: '#f43f5e' }
        ]
      }
    ],
    layer2: [
      {
        id: 'cat-sr-logic',
        name: 'ZONE_IDENTIFIER',
        selectionType: 'multi',
        tags: [
          { text: 'MAJOR_S/R', color: '#8b5cf6' },
          { text: 'MINOR_S/R', color: '#06b6d4' },
          { text: 'DYNAMIC_EMA', color: '#3b82f6' },
          { text: 'VBP_POC', color: '#f59e0b' }
        ]
      }
    ],
    layer3: [
      {
        id: 'cat-risk-mgt',
        name: 'RISK_PROTOCOL',
        selectionType: 'single',
        tags: [
          { text: 'FIXED_1%', color: '#10b981' },
          { text: 'SCALED_ENTRY', color: '#06b6d4' },
          { text: 'AGGRESSIVE', color: '#f43f5e' }
        ]
      }
    ],
    layer4: [
      {
        id: 'cat-neural-state',
        name: 'PSYCH_INDEX',
        selectionType: 'single',
        tags: [
          { text: 'OPTIMAL_FLOW', color: '#10b981' },
          { text: 'HESITANT', color: '#f59e0b' },
          { text: 'FOMO_IMPULSE', color: '#f43f5e' }
        ]
      }
    ]
  },
  createdAt: new Date().toLocaleDateString()
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('trades');
    return saved ? JSON.parse(saved) : INITIAL_TRADES;
  });
  const [strategies, setStrategies] = useState<Strategy[]>(() => {
    const saved = localStorage.getItem('strategies_v2');
    return saved ? JSON.parse(saved) : [DEFAULT_STRATEGY];
  });

  useEffect(() => {
    localStorage.setItem('trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('strategies_v2', JSON.stringify(strategies));
  }, [strategies]);

  // Close sidebar on view change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeView]);

  const handleAddTrade = (newTradeData: Omit<Trade, 'id' | 'status'>) => {
    const newTrade: Trade = {
      ...newTradeData,
      id: `t${Date.now()}`,
      status: newTradeData.pnl >= 0 ? 'gain' : 'loss'
    };
    setTrades([newTrade, ...trades]);
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    setTrades(trades.map(t => t.id === updatedTrade.id ? {
      ...updatedTrade,
      status: updatedTrade.pnl >= 0 ? 'gain' : 'loss'
    } : t));
  };

  const handleDeleteTrade = (id: string) => {
    setTrades(trades.filter(t => t.id !== id));
  };

  const handleAddStrategy = (newStrat: Strategy) => {
    setStrategies([...strategies, newStrat]);
  };

  const handleDeleteStrategy = (id: string) => {
    setStrategies(strategies.filter(s => s.id !== id));
  };

  const handleUpdateStrategy = (updated: Strategy) => {
    setStrategies(strategies.map(s => s.id === updated.id ? updated : s));
  };

  // Derived stats
  const totalPnLValue = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winCount = trades.filter(t => t.status === 'gain').length;
  const winRate = trades.length > 0 ? (winCount / trades.length * 100).toFixed(1) : '0';
  const totalEquityValue = 142850.42 + totalPnLValue;
  const totalEquity = totalEquityValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-screen bg-slate-900 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-[280px] z-50 bg-slate-900 flex flex-col p-8 transition-transform duration-300 md:relative md:translate-x-0 border-r border-structural-border
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-3 mb-14">
          <div className="w-2 h-2 rounded-full bg-accent-gain shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
          <div className="text-[11px] tracking-[0.4em] uppercase font-black text-slate-100">
            TERMINAL / JOURNAL
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'log', label: 'Trade Log', icon: ScrollText },
            { id: 'strategy', label: 'Strategy Parameters', icon: Layers },
            { id: 'analytics', label: 'AI Analyst', icon: BarChart2 },
            { id: 'risk', label: 'Risk Manager', icon: ShieldAlert },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                onClick={() => setActiveView(item.id as ViewState)}
                className={`
                  px-4 py-3.5 rounded-sm text-[13px] flex items-center gap-4 cursor-pointer transition-all duration-300
                  ${activeView === item.id 
                    ? 'bg-slate-800 text-slate-100 shadow-md ring-1 ring-white/5' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                  }
                `}
              >
                <Icon size={18} className={activeView === item.id ? 'text-slate-100' : 'text-slate-600'} />
                <span className="font-medium">{item.label}</span>
              </div>
            );
          })}

          {/* New Date Selection Button / Nav Item */}
          <div className="pt-4 mt-4 border-t border-slate-800">
            <div className="px-4 py-3.5 rounded-sm text-[13px] flex items-center gap-4 bg-slate-800/20 border border-slate-800/50 group hover:border-accent-gain transition-all">
              <Calendar size={18} className="text-slate-600 group-hover:text-accent-gain" />
              <input 
                type="date"
                className="bg-transparent text-slate-500 text-[11px] font-mono outline-none cursor-pointer uppercase w-full"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
              />
            </div>
            <p className="text-[8px] text-slate-700 font-mono mt-2 ml-4 uppercase tracking-widest">Global Date Pointer</p>
          </div>
        </nav>

        <div className="mt-8 bg-slate-800/40 p-5 rounded-sm border border-slate-800">
          <p className="text-[9px] font-black text-slate-600 mb-3 tracking-[0.2em] uppercase">CONNECTION STATUS</p>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
             <Wifi size={14} className="text-accent-gain" />
             <span className="truncate">OANDA / LIVE / 12ms</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col h-full min-h-0 bg-slate-900 relative overflow-hidden">
        
        {/* Header */}
        <header className="flex h-20 items-center justify-between px-12 shrink-0 border-b border-structural-border">
          <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">
            SYS.PATH // DASHBOARD / {activeView.toUpperCase()}_VIEW
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6">
               <Search size={18} className="text-slate-500 hover:text-slate-300 cursor-pointer transition-colors" />
               <Bell size={18} className="text-slate-500 hover:text-slate-300 cursor-pointer transition-colors" />
            </div>
            <div className="h-5 w-px bg-slate-800"></div>
            <div className="flex items-center gap-4 text-sm">
              <div className="w-9 h-9 bg-slate-800 border border-white/5 rounded-sm flex items-center justify-center text-[11px] font-bold text-slate-300 uppercase tracking-tighter">
                TR
              </div>
              <ChevronDown size={16} className="text-slate-600" />
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto min-h-0 p-12 scroll-smooth bg-[#0c0d0e]">
          <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {activeView === 'overview' && (
              <div className="space-y-12">
                <div className="grid grid-cols-12 gap-6">
                  <StatCard label="Total Equity" value={totalEquity} delta="+12.4% vs last month" deltaType="positive" delay={0.1} />
                  <StatCard label="Win Rate" value={`${winRate}%`} delta="Stable" deltaType="positive" delay={0.2} />
                  <StatCard label="Profit Factor" value="2.41" delta="-0.04" deltaType="negative" delay={0.3} />
                  <StatCard label="Active Drawdown" value="1.2%" delta="Within Limits" deltaType="positive" delay={0.4} />
                </div>
                <div className="bg-slate-800/40 border border-structural-border p-10 rounded-sm">
                   <TradeTable trades={trades.slice(0, 5)} strategies={strategies} onUpdateTrade={handleUpdateTrade} onDeleteTrade={handleDeleteTrade} />
                </div>
              </div>
            )}
            
            {activeView === 'log' && (
                <div className="animate-slide-up">
                    <TradeTable trades={trades} strategies={strategies} onUpdateTrade={handleUpdateTrade} onDeleteTrade={handleDeleteTrade} showTitle={true} />
                </div>
            )}

            {activeView === 'strategy' && (
              <StrategyBuilder 
                strategies={strategies} 
                onAddStrategy={handleAddStrategy}
                onDeleteStrategy={handleDeleteStrategy}
                onUpdateStrategy={handleUpdateStrategy}
              />
            )}

            {activeView === 'analytics' && (
              <div className="space-y-8">
                <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight uppercase">Neural Intelligence Analysis</h2>
                <AIAnalyst trades={trades} />
              </div>
            )}

            {(activeView === 'risk' || activeView === 'settings') && (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                    <div className="w-12 h-12 border-2 border-slate-800 border-t-accent-gain rounded-full animate-spin mb-6"></div>
                    <h3 className="text-lg font-bold text-slate-300 uppercase tracking-widest">Optimizing Module...</h3>
                </div>
            )}
          </div>
        </main>

        {/* Trade Form Trigger */}
        <TradeForm onAddTrade={handleAddTrade} strategies={strategies} />
      </div>
    </div>
  );
};

export default App;