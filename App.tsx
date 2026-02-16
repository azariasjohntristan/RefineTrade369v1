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
import { Trade, ViewState, Strategy } from './types';

// Initial Mock Data
const INITIAL_TRADES: Trade[] = [
  { id: 't1', time: '2023.10.24 14:20', pair: 'EUR/USD', type: 'LONG', size: '2.5 Lot', entry: 1.0542, exit: 1.0598, pnl: 1400.00, status: 'gain', selections: {} },
  { id: 't2', time: '2023.10.24 11:05', pair: 'XAU/USD', type: 'SHORT', size: '1.0 Lot', entry: 1972.10, exit: 1980.45, pnl: -835.00, status: 'loss', selections: {} },
];

const EQUITY_DATA_BASE = [
  { name: 'Oct 01', value: 135000 },
  { name: 'Oct 05', value: 136200 },
  { name: 'Oct 10', value: 138500 },
  { name: 'Oct 15', value: 137800 },
  { name: 'Oct 20', value: 140500 },
  { name: 'Oct 24', value: 142850 },
];

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
    return saved ? JSON.parse(saved) : [];
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
            { id: 'analytics', label: 'Analytics', icon: BarChart2 },
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
                   <TradeTable trades={trades.slice(0, 5)} />
                </div>
              </div>
            )}
            
            {activeView === 'log' && (
                <div className="animate-slide-up space-y-8">
                    <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight uppercase">Performance Log</h2>
                    <TradeTable trades={trades} />
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

            {(activeView === 'analytics' || activeView === 'risk' || activeView === 'settings') && (
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