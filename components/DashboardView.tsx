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
    { name: 'Wins', value: winCount, color: '#22c55e' },
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
          <p className="text-[14px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-1">CORE_TERMINAL_V4 // ED-230934</p>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">EQUITY_NEXUS</h2>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
            GLOBAL CUMULATIVE EQUITY <Activity size={10} className="text-accent-gain" />
          </p>
          <p className="text-3xl font-black text-accent-gain tracking-tight">
            ${(startingEquity + totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mb-3">NET P&L</p>
          <p className={`text-3xl font-mono font-bold tracking-tight ${totalPnL >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
            {totalPnL >= 0 ? '' : '-'}${Math.abs(totalPnL).toLocaleString()}
          </p>
          <p className="text-[11px] font-mono text-gray-400 uppercase mt-2">Cumulative yield</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mb-3">PROFIT FACTOR</p>
          <p className="text-3xl font-mono font-bold text-gray-900 tracking-tight">{profitFactor}</p>
          <p className="text-[11px] font-mono text-accent-gain uppercase mt-2">Optimal range</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mb-3">AVG R:R</p>
          <p className="text-3xl font-mono font-bold text-gray-900 tracking-tight">{avgRR}</p>
          <p className="text-[11px] font-mono text-gray-400 uppercase mt-2">{trades.length} executions</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mb-3">MAX DRAWDOWN</p>
          <p className="text-3xl font-mono font-bold text-gray-900 tracking-tight">0%</p>
          <p className="text-[11px] font-mono text-orange-500/80 uppercase mt-2">Limit: 5.0%</p>
        </div>
      </div>

      {/* Middle Row: Equity Curve & Logic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6 flex flex-col min-h-[360px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">PROJECTED REVENUE</p>
              <h3 className="text-2xl font-mono font-bold text-gray-900">
                ${(startingEquity + totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-gain animate-pulse"></div>
              <span className="text-[11px] font-mono text-gray-400 uppercase">Live</span>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f1" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#a1a1aa"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                  domain={['dataMin - 100', 'dataMax + 100']}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
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

        <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <div>
              <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">SYSTEM INTEGRITY</p>
              <h3 className="text-2xl font-mono font-bold text-accent-gain">{winRate}%</h3>
            </div>
            <PieChartIcon size={16} className="text-gray-300" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-full h-[200px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Win Rate</span>
                <span className="text-3xl font-mono font-bold text-gray-900">{winRate}%</span>
              </div>
            </div>

            <div className="w-full mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-gray-500 uppercase">
                    <span>Wins</span>
                    <span>{winCount}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-gain rounded-full" style={{ width: `${(winCount / (trades.length || 1)) * 100}%` }}></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-gray-500 uppercase">
                    <span>Losses</span>
                    <span>{lossCount}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-loss rounded-full" style={{ width: `${(lossCount / (trades.length || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mb-2">By Strategy</p>
                <div className="space-y-1.5 max-h-[90px] overflow-y-auto pr-1">
                  {Object.entries(trades.reduce((acc, t) => {
                    const stratName = t.strategyId || 'Untagged';
                    if (!acc[stratName]) acc[stratName] = { w: 0, t: 0 };
                    acc[stratName].t++;
                    if (t.pnl > 0) acc[stratName].w++;
                    return acc;
                  }, {} as Record<string, { w: number; t: number }>)).map(([name, stats]: [string, { w: number; t: number }]) => (
                    <div key={name} className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-gray-400 truncate max-w-[110px]">{name.replace('strat-', '').replace('-', ' ')}</span>
                      <span className="text-gray-600 font-semibold">{(stats.w / stats.t * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: P&L Calendar & Trading Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6 flex flex-col min-h-[420px]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <CalendarIcon size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">P&L Calendar</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                {currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-1.5 bg-gray-100 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-1.5 bg-gray-100 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                <div key={d} className="text-center text-[10px] font-mono text-gray-400 uppercase py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 flex-1">
              {calendarDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`
                    relative min-h-[56px] p-2 rounded-lg transition-all
                    ${day.day ? 'bg-gray-50' : 'bg-transparent'}
                    ${day.pnl > 0 ? 'bg-green-50' : day.pnl < 0 ? 'bg-red-50' : ''}
                  `}
                >
                  {day.day && (
                    <>
                      <span className="text-[11px] font-mono text-gray-400 absolute top-1.5 left-2">{day.day}</span>
                      {day.pnl !== 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className={`text-[11px] font-bold font-mono ${day.pnl > 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
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

        <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Trading Rules</h3>
            </div>
            <button
              onClick={() => setIsEditingRules(!isEditingRules)}
              className={`p-1.5 rounded-lg transition-colors ${isEditingRules ? 'text-accent-gain bg-green-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              {isEditingRules ? <Check size={15} /> : <Edit3 size={15} />}
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {rules.map((rule, idx) => (
              <div key={idx} className="group flex items-start gap-3 bg-gray-50 p-3 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0"></div>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">{rule}</p>
                {isEditingRules && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeRule(idx); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}

            {isEditingRules && (
              <div className="pt-3 flex gap-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRule()}
                  placeholder="Add a rule..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400"
                />
                <button
                  onClick={addRule}
                  className="bg-gray-900 text-white p-2 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            {rules.length === 0 && !isEditingRules && (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <AlertCircle size={22} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No rules defined</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Day of Week + Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Day of Week Performance */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <CalendarIcon size={14} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Day of Week Performance</h3>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f1" vertical={false} />
                <XAxis
                  dataKey="shortDay"
                  stroke="#a1a1aa"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#a1a1aa"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e4e4e7',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    fontFamily: 'monospace'
                  }}
                  labelStyle={{ color: '#18181b', fontWeight: '600', fontSize: '11px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'P&L']}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {dayOfWeekStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#22c55e' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Recent Trades</h3>
          </div>

          <div className="flex-1 space-y-1">
            {recentTrades.length > 0 ? (
              recentTrades.map((trade, idx) => (
                <div key={idx} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono text-gray-400">
                      {new Date(trade.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                      {trade.pair}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${trade.type === 'LONG' ? 'text-accent-gain' : 'text-accent-loss'}`}>
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
                <AlertCircle size={22} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No trades yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

