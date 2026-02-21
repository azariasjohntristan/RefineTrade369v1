import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Activity,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { Trade } from '../types';

interface DashboardViewProps {
  trades: Trade[];
  startingEquity: number;
  rules: string[];
  onRulesChange: (rules: string[]) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ trades, startingEquity, rules: initialRules, onRulesChange }) => {
  const [rules, setRules] = useState<string[]>(initialRules || []);
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  useEffect(() => {
    if (initialRules) {
      setRules(initialRules);
    }
  }, [initialRules]);

  // Calculations
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winCount = trades.filter(t => t.pnl > 0).length;
  const lossCount = trades.filter(t => t.pnl < 0).length;
  const winRate = trades.length > 0 ? (winCount / trades.length * 100).toFixed(0) : '0';
  
  const profitFactor = (() => {
    const grossProfit = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    return grossLoss === 0 ? (grossProfit > 0 ? 'MAX' : '0.00') : (grossProfit / grossLoss).toFixed(2);
  })();

  const avgRR = (() => {
    const avgWin = winCount > 0 ? trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / winCount : 0;
    const avgLoss = lossCount > 0 ? Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0)) / lossCount : 0;
    const ratio = avgLoss === 0 ? (avgWin > 0 ? 'MAX' : '1:1') : `1:${(avgWin / avgLoss).toFixed(1)}`;
    return ratio;
  })();

  // Equity Curve Data
  const equityData = (() => {
    let currentEquity = startingEquity; // Starting base
    const sortedTrades = [...trades].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    
    // If no trades, show a flat line
    if (sortedTrades.length === 0) {
        return [
            { name: 'Start', equity: startingEquity },
            { name: 'Now', equity: startingEquity }
        ];
    }

    return sortedTrades.map((t, idx) => {
      currentEquity += t.pnl;
      return {
        name: new Date(t.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        equity: currentEquity,
        pnl: t.pnl
      };
    });
  })();

  const pieData = [
    { name: 'Wins', value: winCount, color: '#4ade80' },
    { name: 'Losses', value: lossCount, color: '#f87171' }
  ];

  // Calendar Logic
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Padding for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, date: null });
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dailyPnL = trades
        .filter(t => new Date(t.time).toISOString().split('T')[0] === dateStr)
        .reduce((sum, t) => sum + t.pnl, 0);
      
      days.push({ day: i, date: dateStr, pnl: dailyPnL });
    }
    
    return days;
  }, [currentCalendarDate, trades]);

  // Day of Week Stats
  const dayOfWeekStats = useMemo(() => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap: Record<string, { trades: number; pnl: number }> = {};
    
    dayNames.forEach(day => dayMap[day] = { trades: 0, pnl: 0 });
    
    trades.forEach(trade => {
      const dayIndex = (new Date(trade.time).getDay() + 6) % 7;
      dayMap[dayNames[dayIndex]].trades++;
      dayMap[dayNames[dayIndex]].pnl += trade.pnl;
    });
    
    return dayNames.map((day, idx) => ({
      day,
      shortDay: shortDays[idx],
      dayIndex: idx,
      trades: dayMap[day].trades,
      pnl: dayMap[day].pnl
    }));
  }, [trades]);

  // Recent Trades (5 most recent)
  const recentTrades = useMemo(() => {
    return [...trades]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [trades]);

  const changeMonth = (offset: number) => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + offset, 1));
  };

  const addRule = () => {
    if (newRule.trim()) {
      const updatedRules = [...rules, newRule.trim()];
      setRules(updatedRules);
      onRulesChange(updatedRules);
      setNewRule('');
    }
  };

  const removeRule = (idx: number) => {
    const updatedRules = rules.filter((_, i) => i !== idx);
    setRules(updatedRules);
    onRulesChange(updatedRules);
  };

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[14px] font-mono text-slate-500 uppercase tracking-[0.3em] mb-1">CORE_TERMINAL_V4 // ED-230934</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-100 uppercase tracking-tighter">EQUITY_NEXUS</h2>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-mono text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
            GLOBAL CUMULATIVE EQUITY <Activity size={10} className="text-accent-gain" />
          </p>
          <p className="text-3xl font-black text-accent-gain tracking-tight">
            ${(startingEquity + totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-sm">
          <p className="text-[14px] font-mono text-slate-500 uppercase tracking-widest mb-4">NET P&L</p>
          <p className={`text-3xl font-black tracking-tight ${totalPnL >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
            {totalPnL >= 0 ? '' : '-'}${Math.abs(totalPnL).toLocaleString()}
          </p>
          <p className="text-[14px] font-mono text-slate-600 uppercase mt-2">CUMULATIVE_YIELD</p>
        </div>
        <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-sm">
          <p className="text-[14px] font-mono text-slate-500 uppercase tracking-widest mb-4">PROFIT FACTOR</p>
          <p className="text-3xl font-black text-slate-100 tracking-tight">{profitFactor}</p>
          <p className="text-[14px] font-mono text-accent-gain uppercase mt-2">OPTIMAL</p>
        </div>
        <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-sm">
          <p className="text-[14px] font-mono text-slate-500 uppercase tracking-widest mb-4">AVG R:R</p>
          <p className="text-3xl font-black text-slate-100 tracking-tight">{avgRR}</p>
          <p className="text-[14px] font-mono text-slate-600 uppercase mt-2">BASED ON {trades.length} EXECUTIONS</p>
        </div>
        <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-sm">
          <p className="text-[14px] font-mono text-slate-500 uppercase tracking-widest mb-4">MAX DRAWDOWN</p>
          <p className="text-3xl font-black text-slate-100 tracking-tight">0%</p>
          <p className="text-[14px] font-mono text-orange-500/70 uppercase mt-2">LIMIT: 5.0%</p>
        </div>
      </div>

      {/* Middle Row: Equity Curve & Logic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/30 border border-slate-800 p-6 rounded-sm flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[14px] font-black text-orange-500 uppercase tracking-[0.3em]">EQUITY GROWTH // NEURAL PATH</h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-gain animate-pulse"></div>
              <span className="text-[13px] font-mono text-slate-500 uppercase">STREAM_ACTIVE</span>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `$${(value/1000).toFixed(1)}k`}
                  domain={['dataMin - 100', 'dataMax + 100']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', fontSize: '10px' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorEquity)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[14px] font-black text-orange-500 uppercase tracking-[0.3em]">LOGIC DISTRIBUTION</h3>
            <PieChartIcon size={14} className="text-slate-600" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-full h-[240px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[14px] font-mono text-slate-500 uppercase">WIN RATE</span>
                <span className="text-4xl font-black text-slate-100">{winRate}%</span>
              </div>
            </div>
            
            <div className="w-full mt-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[14px] font-mono text-slate-500 uppercase">
                    <span>WINS</span>
                    <span>{winCount}</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-gain" style={{ width: `${(winCount / (trades.length || 1)) * 100}%` }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[14px] font-mono text-slate-500 uppercase">
                    <span>LOSSES</span>
                    <span>{lossCount}</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-loss" style={{ width: `${(lossCount / (trades.length || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/50">
                <p className="text-[13px] font-mono text-slate-600 uppercase tracking-widest mb-3">STRATEGY_PERFORMANCE</p>
                <div className="space-y-2 max-h-[100px] overflow-y-auto custom-scrollbar pr-2">
                  {Object.entries(trades.reduce((acc, t) => {
                    const stratName = t.strategyId || 'UNTAGGED';
                    if (!acc[stratName]) acc[stratName] = { w: 0, t: 0 };
                    acc[stratName].t++;
                    if (t.pnl > 0) acc[stratName].w++;
                    return acc;
                  }, {} as Record<string, { w: number; t: number }>)).map(([name, stats]: [string, { w: number; t: number }]) => (
                    <div key={name} className="flex items-center justify-between text-[14px] font-mono">
                      <span className="text-slate-400 truncate max-w-[120px]">{name.replace('strat-', '').replace('-', ' ').toUpperCase()}</span>
                      <span className="text-slate-200">{(stats.w / stats.t * 100).toFixed(0)}% WR</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: P&L Calendar & Trading Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/30 border border-slate-800 p-6 rounded-sm flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <CalendarIcon size={14} className="text-orange-500" />
              <h3 className="text-[14px] font-black text-orange-500 uppercase tracking-[0.3em]">P&L CALENDAR</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[14px] font-mono text-slate-300 uppercase tracking-widest">
                {currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={() => changeMonth(-1)}
                  className="p-1.5 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button 
                  onClick={() => changeMonth(1)}
                  className="p-1.5 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                <div key={d} className="text-center text-[13px] font-mono text-slate-600 uppercase py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 flex-1">
              {calendarDays.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`
                    relative min-h-[60px] p-2 border border-slate-800/30 transition-all
                    ${day.day ? 'bg-slate-900/40' : 'bg-transparent'}
                    ${day.pnl > 0 ? 'bg-accent-gain/5 border-accent-gain/20' : day.pnl < 0 ? 'bg-accent-loss/5 border-accent-loss/20' : ''}
                  `}
                >
                  {day.day && (
                    <>
                      <span className="text-[14px] font-mono text-slate-600 absolute top-2 left-2">{day.day}</span>
                      {day.pnl !== 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className={`text-[14px] font-black font-mono ${day.pnl > 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                            {day.pnl > 0 ? '+' : ''}{day.pnl.toFixed(0)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <ShieldCheck size={14} className="text-orange-500" />
              <h3 className="text-[14px] font-black text-orange-500 uppercase tracking-[0.3em]">TRADING RULES</h3>
            </div>
            <button 
              onClick={() => {
                setIsEditingRules(!isEditingRules);
              }}
              className={`text-slate-500 hover:text-white transition-colors p-1 ${isEditingRules ? 'text-accent-gain' : ''}`}
            >
              {isEditingRules ? <Check size={18} /> : <Edit3 size={18} />}
            </button>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
            {rules.map((rule, idx) => (
              <div key={idx} className="group flex items-start gap-3 bg-slate-900/50 p-3 border border-slate-800/50 rounded-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50 mt-1.5 shrink-0"></div>
                <p className="text-[14px] font-mono text-slate-300 leading-relaxed flex-1">{rule}</p>
                {isEditingRules && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRule(idx);
                    }} 
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-accent-loss transition-all p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            
            {isEditingRules && (
              <div className="pt-4 flex gap-2">
                <input 
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRule()}
                  placeholder="NEW_RULE..."
                  className="flex-1 bg-slate-900 border border-slate-800 px-3 py-2 text-[14px] font-mono text-slate-300 outline-none focus:border-orange-500/50"
                />
                <button 
                  onClick={addRule}
                  className="bg-orange-500 text-slate-950 p-2 rounded-sm hover:bg-orange-400 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
            
            {rules.length === 0 && !isEditingRules && (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <AlertCircle size={24} className="text-slate-800 mb-3" />
                <p className="text-[14px] font-mono text-slate-700 uppercase tracking-widest">NO_RULES_DEFINED</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Day of Week + Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Day of Week Performance - col-span-2 */}
        <div className="lg:col-span-2 bg-slate-800/30 border border-slate-800 p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-6">
            <CalendarIcon size={14} className="text-orange-500" />
            <h3 className="text-[14px] font-black text-orange-500 uppercase tracking-[0.3em]">DAY OF WEEK PERFORMANCE</h3>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekStats} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="shortDay" 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'P&L']}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {dayOfWeekStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#4ade80' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={14} className="text-orange-500" />
            <h3 className="text-[14px] font-black text-orange-500 uppercase tracking-[0.3em]">RECENT TRADES</h3>
          </div>
          
          <div className="flex-1 space-y-2">
            {recentTrades.length > 0 ? (
              recentTrades.map((trade, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-500 uppercase">
                      {new Date(trade.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[12px] font-mono text-slate-300 uppercase bg-slate-900 px-2 py-0.5 border border-slate-800">
                      {trade.pair}
                    </span>
                    <span className={`text-[10px] font-black uppercase ${trade.type === 'LONG' ? 'text-accent-gain' : 'text-accent-loss'}`}>
                      {trade.type}
                    </span>
                  </div>
                  <span className={`text-[12px] font-mono font-bold ${trade.pnl >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                    {trade.pnl > 0 ? '+' : ''}{trade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <AlertCircle size={24} className="text-slate-800 mb-3" />
                <p className="text-[14px] font-mono text-slate-700 uppercase tracking-widest">NO RECENT TRADES</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

