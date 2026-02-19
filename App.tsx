import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ScrollText, 
  BarChart2, 
 
  Settings,
  Bell,
  Search,
  Wifi,
  ChevronDown,
  X,
  Menu,
  Layers,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import StatCard from './components/StatCard';
import TradeTable from './components/TradeTable';
import TradeForm from './components/TradeForm';
import StrategyBuilder from './components/StrategyBuilder';
import AnalyticsView from './components/AnalyticsView';
import DashboardView from './components/DashboardView';
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
  startingEquity: 10000,
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
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
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
  const [activeStrategyId, setActiveStrategyId] = useState<string>(() => {
    const saved = localStorage.getItem('activeStrategyId');
    return saved && strategies.find(s => s.id === saved) ? saved : (strategies[0]?.id || 'strat-default-sr');
  });

  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false);
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Strategy | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Strategy | null>(null);
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [editWorkspaceEquity, setEditWorkspaceEquity] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceEquity, setNewWorkspaceEquity] = useState('10000');

  useEffect(() => {
    localStorage.setItem('trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('strategies_v2', JSON.stringify(strategies));
  }, [strategies]);

  useEffect(() => {
    localStorage.setItem('activeStrategyId', activeStrategyId);
  }, [activeStrategyId]);

  // Close sidebar on view change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeView]);

  const handleAddTrade = (newTradeData: Omit<Trade, 'id' | 'status'>) => {
    const newTrade: Trade = {
      ...newTradeData,
      id: `t${Date.now()}`,
      status: newTradeData.pnl >= 0 ? 'gain' : 'loss',
      strategyId: activeStrategyId // Force the active strategy
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

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName) return;

    const newModel: Strategy = {
      id: `strat-${Date.now()}`,
      name: newWorkspaceName,
      startingEquity: parseFloat(newWorkspaceEquity) || 10000,
      layers: { 
        layer1: [
          {
            id: `cat-instrument-${Date.now()}`,
            name: 'INSTRUMENT',
            tags: [
              { text: 'NQ', color: '#06b6d4' },
              { text: 'ES', color: '#f43f5e' }
            ],
            selectionType: 'single'
          }
        ], 
        layer2: [], 
        layer3: [], 
        layer4: [] 
      },
      createdAt: new Date().toLocaleDateString()
    };

    handleAddStrategy(newModel);
    setActiveStrategyId(newModel.id);
    setNewWorkspaceName('');
    setNewWorkspaceEquity('10000');
    setIsAddingWorkspace(false);
  };

  const handleDeleteStrategy = (id: string) => {
    if (id === 'strat-default-sr') return;
    setStrategies(strategies.filter(s => s.id !== id));
    setTrades(trades.filter(t => t.strategyId !== id));
    if (activeStrategyId === id) {
      const remaining = strategies.filter(s => s.id !== id);
      setActiveStrategyId(remaining[0]?.id || 'strat-default-sr');
    }
  };

  const handleUpdateStrategy = (updated: Strategy) => {
    setStrategies(strategies.map(s => s.id === updated.id ? updated : s));
  };

  const handleUpdateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToEdit) return;
    
    const updated: Strategy = {
      ...workspaceToEdit,
      name: editWorkspaceName,
      startingEquity: parseFloat(editWorkspaceEquity) || workspaceToEdit.startingEquity
    };
    
    handleUpdateStrategy(updated);
    setIsEditingWorkspace(false);
    setWorkspaceToEdit(null);
  };

  // Derived stats
  const activeStrategy = strategies.find(s => s.id === activeStrategyId) || strategies[0];
  const filteredTrades = trades.filter(t => t.strategyId === activeStrategyId);
  
  const totalPnLValue = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
  const winCount = filteredTrades.filter(t => t.status === 'gain').length;
  const winRate = filteredTrades.length > 0 ? (winCount / filteredTrades.length * 100).toFixed(1) : '0';
  const totalEquityValue = (activeStrategy?.startingEquity || 10000) + totalPnLValue;
  const totalEquity = totalEquityValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-screen bg-slate-900 overflow-hidden font-sans">
      
      {/* Sidebar / Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 w-[280px] z-[100] bg-slate-900 flex flex-col p-6 transition-transform duration-300 md:relative md:translate-x-0 border-r border-structural-border
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent-gain shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
            <div className="text-[11px] tracking-[0.4em] uppercase font-black text-slate-100">
              TERMINAL
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Mobile Header Actions in Sidebar */}
        <div className="md:hidden flex items-center gap-4 mb-8 pb-8 border-b border-slate-800">
          <div className="flex-1 flex items-center gap-3 bg-slate-800/40 p-3 rounded-sm border border-slate-800">
            <Search size={16} className="text-slate-500" />
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Search...</span>
          </div>
          <button className="relative p-3 bg-slate-800/40 border border-slate-800 rounded-sm text-slate-500">
            <Bell size={16} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent-loss rounded-full"></span>
          </button>
        </div>

        <nav className="flex-1 space-y-1.5">
          {/* Mobile Add Trade Button */}
          <div className="md:hidden mb-6">
            <button 
              onClick={() => {
                // We need a way to trigger TradeForm's isOpen state.
                // Since TradeForm is a separate component, we might need to lift state
                // or use a custom event. For now, I'll assume the user can still use the 
                // floating button if I don't hide it, OR I'll implement a global state.
                // Actually, I'll just add the button and let it be handled.
                window.dispatchEvent(new CustomEvent('open-trade-form'));
              }}
              className="w-full bg-accent-gain text-slate-950 py-3 rounded-sm text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
            >
              <Plus size={16} /> Initialize Log
            </button>
          </div>

          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'log', label: 'Trade Log', icon: ScrollText },
            { id: 'strategy', label: 'Strategy Parameters', icon: Layers },
            { id: 'analytics', label: 'Analytics', icon: BarChart2 },

            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                onClick={() => setActiveView(item.id as ViewState)}
                className={`
                  px-4 py-3 rounded-sm text-[13px] flex items-center gap-4 cursor-pointer transition-all duration-300
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
            <div className="px-4 py-3 rounded-sm text-[13px] flex items-center gap-4 bg-slate-800/20 border border-slate-800/50 group hover:border-accent-gain transition-all">
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

        <div className="mt-8 bg-slate-800/40 p-4 rounded-sm border border-slate-800">
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
        <header className="flex h-16 md:h-20 items-center justify-between px-4 md:px-12 shrink-0 border-b border-structural-border bg-slate-900/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-white">
              <Menu size={24} />
            </button>
            <div className="font-mono text-[clamp(0.5rem,2vw,0.625rem)] text-slate-500 tracking-widest uppercase truncate max-w-[150px] sm:max-w-none">
              SYS.PATH // {activeView.toUpperCase()}
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center gap-6">
               <Search size={18} className="text-slate-500 hover:text-slate-300 cursor-pointer transition-colors" />
               <Bell size={18} className="text-slate-500 hover:text-slate-300 cursor-pointer transition-colors" />
            </div>
            <div className="hidden md:block h-5 w-px bg-slate-800"></div>
            
            {/* Profile & Strategy Switcher Dropdown */}
            <div className="relative group">
              <div className="flex items-center gap-2 md:gap-4 text-sm cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-slate-800 border border-white/5 rounded-sm flex items-center justify-center text-[10px] md:text-[11px] font-bold text-slate-300 uppercase tracking-tighter">
                  TR
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Workspace</span>
                  <span className="text-[11px] font-bold text-slate-200 uppercase truncate max-w-[100px]">
                    {activeStrategy?.name || 'Select'}
                  </span>
                </div>
                <ChevronDown size={14} className="text-slate-600 transition-transform group-hover:rotate-180" />
              </div>

              {/* Dropdown Menu */}
              <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-slate-700 shadow-2xl rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-4 border-b border-slate-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-800 border border-white/5 rounded-sm flex items-center justify-center text-xs font-bold text-slate-300">
                      TR
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-100">TERMINAL_USER</p>
                      <p className="text-[9px] font-mono text-slate-500">ID: 230934-ALPHA</p>
                    </div>
                  </div>
                  <div className="h-px bg-slate-800 w-full mb-4"></div>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Switch Workspace</span>
                </div>
                
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {strategies.map(s => (
                    <div 
                      key={s.id}
                      className={`group/row px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors ${activeStrategyId === s.id ? 'bg-slate-800/50 border-l-2 border-accent-gain' : ''}`}
                    >
                      <div className="flex flex-col flex-1" onClick={() => setActiveStrategyId(s.id)}>
                        <span className={`text-[11px] font-bold uppercase ${activeStrategyId === s.id ? 'text-accent-gain' : 'text-slate-300'}`}>
                          {s.name}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          Equity: ${(s.startingEquity ?? 10000).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setWorkspaceToEdit(s);
                            setEditWorkspaceName(s.name);
                            setEditWorkspaceEquity((s.startingEquity ?? 10000).toString());
                            setIsEditingWorkspace(true);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-200"
                        >
                          <Edit3 size={12} />
                        </button>
                        {s.id !== 'strat-default-sr' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setWorkspaceToDelete(s);
                              setIsDeletingWorkspace(true);
                            }}
                            className="p-1 text-slate-500 hover:text-accent-loss"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      {activeStrategyId === s.id && <div className="w-1.5 h-1.5 rounded-full bg-accent-gain shadow-[0_0_8px_rgba(74,222,128,0.6)] ml-2"></div>}
                    </div>
                  ))}
                </div>

                <div className="p-2 border-t border-slate-800">
                  <button 
                    onClick={() => setIsAddingWorkspace(true)}
                    className="w-full text-left px-3 py-2 text-[10px] font-mono text-accent-gain hover:bg-slate-800 transition-all uppercase tracking-[0.2em] flex items-center gap-2"
                  >
                    <Plus size={12} /> New Workspace
                  </button>
                  <button 
                    onClick={() => setActiveView('settings')}
                    className="w-full text-left px-3 py-2 text-[10px] font-mono text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all uppercase tracking-widest"
                  >
                    Account Settings
                  </button>
                  <button className="w-full text-left px-3 py-2 text-[10px] font-mono text-accent-loss hover:bg-slate-800 transition-all uppercase tracking-widest">
                    Terminate Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-8 md:p-12 scroll-smooth bg-[#0c0d0e]">
          <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-20">
            {activeView === 'dashboard' && (
              <DashboardView trades={filteredTrades} startingEquity={activeStrategy?.startingEquity || 10000} />
            )}
            
            {activeView === 'log' && (
                <div className="animate-slide-up">
                    <TradeTable trades={filteredTrades} strategies={strategies} onUpdateTrade={handleUpdateTrade} onDeleteTrade={handleDeleteTrade} showTitle={true} />
                </div>
            )}

            {activeView === 'strategy' && (
              <StrategyBuilder 
                strategies={strategies} 
                activeStrategyId={activeStrategyId}
                onUpdateStrategy={handleUpdateStrategy}
              />
            )}

            {activeView === 'analytics' && (
              <AnalyticsView trades={filteredTrades} strategies={strategies} activeStrategyId={activeStrategyId} />
            )}


          </div>
        </main>

        {/* Trade Form Trigger */}
        <TradeForm onAddTrade={handleAddTrade} strategies={strategies} />

        {/* Workspace Edit Modal */}
        {isEditingWorkspace && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsEditingWorkspace(false)} />
            <form onSubmit={handleUpdateWorkspace} className="relative w-full max-w-md bg-slate-900 border border-slate-800 p-8 space-y-6 shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Edit Workspace</h3>
                <button type="button" onClick={() => setIsEditingWorkspace(false)} className="text-slate-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Workspace Name</label>
                  <input 
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-800 p-4 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                    value={editWorkspaceName}
                    onChange={(e) => setEditWorkspaceName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Starting Equity ($)</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 p-4 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                    value={editWorkspaceEquity}
                    onChange={(e) => setEditWorkspaceEquity(e.target.value)}
                  />
                </div>
              </div>
              <button className="w-full bg-slate-100 text-slate-900 py-4 text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">Save Changes</button>
            </form>
          </div>
        )}

        {/* Workspace Add Modal */}
        {isAddingWorkspace && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsAddingWorkspace(false)} />
            <form onSubmit={handleCreateWorkspace} className="relative w-full max-w-md bg-slate-900 border border-slate-800 p-8 space-y-6 shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Initialize New Workspace</h3>
                <button type="button" onClick={() => setIsAddingWorkspace(false)} className="text-slate-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Workspace Name</label>
                  <input 
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-800 p-4 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                    placeholder="E.G. SCALPING_PRO"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Starting Equity ($)</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 p-4 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                    placeholder="10000"
                    value={newWorkspaceEquity}
                    onChange={(e) => setNewWorkspaceEquity(e.target.value)}
                  />
                </div>
              </div>
              <button className="w-full bg-slate-100 text-slate-900 py-4 text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">Commit_Workspace</button>
            </form>
          </div>
        )}

        {/* Workspace Delete Confirmation Modal */}
        {isDeletingWorkspace && workspaceToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsDeletingWorkspace(false)} />
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 p-10 space-y-8 shadow-2xl animate-slide-up">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-accent-loss/10 border border-accent-loss/20 flex items-center justify-center rounded-full">
                  <AlertTriangle size={32} className="text-accent-loss" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-100 uppercase tracking-widest">Delete Workspace?</h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter leading-relaxed">
                    This action will permanently purge the workspace <span className="text-slate-300 font-bold">"{workspaceToDelete.name}"</span> and all associated trade data. This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsDeletingWorkspace(false)}
                  className="py-4 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 hover:text-slate-100 transition-all border border-slate-700"
                >
                  Abort_Action
                </button>
                <button 
                  onClick={() => {
                    handleDeleteStrategy(workspaceToDelete.id);
                    setIsDeletingWorkspace(false);
                  }}
                  className="py-4 bg-accent-loss/80 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-accent-loss transition-all shadow-xl"
                >
                  Confirm_Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;