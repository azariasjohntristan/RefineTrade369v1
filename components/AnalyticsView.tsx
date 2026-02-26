import React, { useState, useMemo } from 'react';
import { Trade, Strategy } from '../types';
import { Trophy, BarChart3, Target, TrendingUp, TrendingDown, ChevronRight, Filter, Layers, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalyticsViewProps {
  trades: Trade[];
  strategies: Strategy[];
  activeStrategyId: string;
}

interface TagStats {
  tag: string;
  categoryName: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ trades, strategies, activeStrategyId }) => {
  const [selectedLayer, setSelectedLayer] = useState<string>('all');

  const selectedStrategy = useMemo(() => 
    strategies.find(s => s.id === activeStrategyId),
    [strategies, activeStrategyId]
  );

  const statsByTag = useMemo(() => {
    if (!selectedStrategy) return [];

    const tagMap: Record<string, TagStats & { layerKey: string }> = {};
    const strategyTrades = trades.filter(t => t.strategyId === activeStrategyId);

    strategyTrades.forEach(trade => {
      Object.entries(trade.selections).forEach(([catId, tags]) => {
        // Find category name and layer for display/filtering
        let categoryName = 'Unknown';
        let layerKey = '';
        
        Object.entries(selectedStrategy.layers).forEach(([layer, categories]) => {
          const cat = (categories as any[]).find(c => c.id === catId);
          if (cat) {
            categoryName = cat.name;
            layerKey = layer;
          }
        });

        (tags as string[]).forEach(tag => {
          const key = `${catId}-${tag}`;
          if (!tagMap[key]) {
            tagMap[key] = {
              tag,
              categoryName,
              layerKey,
              totalTrades: 0,
              wins: 0,
              losses: 0,
              winRate: 0,
              totalPnL: 0,
              avgPnL: 0
            };
          }

          const stats = tagMap[key];
          stats.totalTrades += 1;
          if (trade.pnl >= 0) stats.wins += 1;
          else stats.losses += 1;
          stats.totalPnL += trade.pnl;
        });
      });
    });

    let results = Object.values(tagMap).map(s => ({
      ...s,
      winRate: s.totalTrades > 0 ? (s.wins / s.totalTrades) * 100 : 0,
      avgPnL: s.totalTrades > 0 ? s.totalPnL / s.totalTrades : 0
    }));

    if (selectedLayer !== 'all') {
      results = results.filter(r => r.layerKey === selectedLayer);
    }

    return results.sort((a, b) => b.winRate - a.winRate || b.totalPnL - a.totalPnL);
  }, [trades, selectedStrategy, activeStrategyId, selectedLayer]);

  const leaderboard = useMemo(() => {
    const layers = ['layer1', 'layer2', 'layer3', 'layer4'];
    // statsByTag is already sorted by winRate desc, so we just find the first match for each layer
    return layers.map(layerKey => 
      statsByTag.find(s => s.layerKey === layerKey && s.totalTrades >= 2)
    ).filter(Boolean) as (TagStats & { layerKey: string })[];
  }, [statsByTag]);

  const dayOfWeekStats = useMemo(() => {
    if (!selectedStrategy) return [];

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap: Record<string, { totalTrades: number; wins: number; losses: number; totalPnL: number }> = {};
    
    dayNames.forEach(day => {
      dayMap[day] = { totalTrades: 0, wins: 0, losses: 0, totalPnL: 0 };
    });

    const strategyTrades = trades.filter(t => t.strategyId === activeStrategyId);

    strategyTrades.forEach(trade => {
      const date = new Date(trade.time);
      const dayIndex = (date.getDay() + 6) % 7;
      const dayName = dayNames[dayIndex];
      
      dayMap[dayName].totalTrades += 1;
      if (trade.pnl >= 0) dayMap[dayName].wins += 1;
      else dayMap[dayName].losses += 1;
      dayMap[dayName].totalPnL += trade.pnl;
    });

    const results = dayNames.map((day, idx) => {
      const stats = dayMap[day];
      return {
        day,
        shortDay: shortDays[idx],
        dayIndex: idx,
        totalTrades: stats.totalTrades,
        wins: stats.wins,
        losses: stats.losses,
        winRate: stats.totalTrades > 0 ? (stats.wins / stats.totalTrades) * 100 : 0,
        totalPnL: stats.totalPnL,
        avgPnL: stats.totalTrades > 0 ? stats.totalPnL / stats.totalTrades : 0
      };
    });

    return results.sort((a, b) => a.dayIndex - b.dayIndex);
  }, [trades, selectedStrategy, activeStrategyId]);

  const mostProfitableDay = dayOfWeekStats.length > 0 ? dayOfWeekStats[0] : null;

  const LayerHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Layers size={16} className="text-gray-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
          <p className="text-[11px] text-gray-500 font-mono uppercase tracking-wider mt-0.5">{desc}</p>
        </div>
      </div>
    </div>
  );

  const PerformanceTable = ({ data }: { data: (TagStats & { layerKey: string })[] }) => (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 px-5 text-[11px] font-mono text-gray-400 uppercase tracking-wider">Variable / Tag</th>
                <th className="py-4 px-5 text-[11px] font-mono text-gray-400 uppercase tracking-wider">Category</th>
                <th className="py-4 px-5 text-[11px] font-mono text-gray-400 uppercase tracking-wider text-center">Executions</th>
                <th className="py-4 px-5 text-[11px] font-mono text-gray-400 uppercase tracking-wider text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.length > 0 ? data.map((stat, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                  <td className="py-4 px-5">
                    <span className="text-sm font-semibold text-gray-800 uppercase tracking-tight">{stat.tag}</span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-xs font-mono text-gray-400 uppercase">{stat.categoryName}</span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    <span className="text-sm font-mono text-gray-500">{stat.totalTrades}</span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${stat.winRate >= 50 ? 'bg-accent-gain' : 'bg-accent-loss'}`}
                          style={{ width: `${stat.winRate}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold font-mono w-10 ${stat.winRate >= 50 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                        {stat.winRate.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <p className="text-sm text-gray-400">No variables detected for this selection.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.length > 0 ? data.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-card p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{stat.categoryName}</span>
                <h4 className="text-sm font-bold text-gray-900 uppercase">{stat.tag}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-gray-400 uppercase block">Executions</span>
                <span className="text-sm font-semibold text-gray-700">{stat.totalTrades}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Win Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stat.winRate >= 50 ? 'bg-accent-gain' : 'bg-accent-loss'}`}
                    style={{ width: `${stat.winRate}%` }}
                  />
                </div>
                <span className={`text-sm font-bold font-mono ${stat.winRate >= 50 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                  {stat.winRate.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            <p className="text-sm text-gray-400">No variables detected.</p>
          </div>
        )}
      </div>
    </div>
  );

  const layerConfigs = [
    { key: 'layer1', title: 'Layer 1: Identity', desc: 'Instrument IDs and core asset identifiers.' },
    { key: 'layer2', title: 'Layer 2: Strategy & Logic', desc: 'Market bias, execution engines, and confluence signatures.' },
    { key: 'layer3', title: 'Layer 3: Temporal & Risk', desc: 'Time window constraints and risk management parameters.' },
    { key: 'layer4', title: 'Layer 4: Reflection', desc: 'Post-execution data points and neural state tracking.' },
  ];

  if (strategies.length === 0) {
    return (
      <div className="space-y-8 pb-20 animate-slide-up">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-[14px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-1">CORE_TERMINAL_V4 // ED-230934</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">NEURAL EDGE ANALYTICS</h2>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Filter className="text-gray-400" size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wider mb-2">No Strategies Found</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">Initialize a strategy in the Strategy Builder to begin neural analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-slide-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[14px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-1">CORE_TERMINAL_V4 // ED-230934</p>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">NEURAL EDGE ANALYTICS</h2>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
            STATISTICAL VALIDATION <BarChart3 size={10} className="text-accent-gain" />
          </p>
          <p className="text-3xl font-black text-gray-900 tracking-tight">{trades.length}</p>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="space-y-5">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Edge Leaderboard (Min 2 Trades)</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaderboard.length > 0 ? leaderboard.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-card p-5 relative overflow-hidden group hover:shadow-card-lg transition-all">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={40} className={idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-700' : 'text-orange-500'} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{stat.categoryName}</span>
                  <h4 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{stat.tag}</h4>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase block">Win Rate</span>
                    <span className="text-lg font-bold text-accent-gain">{stat.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-gray-400 uppercase block">Net PnL</span>
                    <span className={`text-lg font-bold ${stat.totalPnL >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                      ${stat.totalPnL.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full bg-white rounded-2xl shadow-card p-8 text-center">
              <p className="text-sm text-gray-500">Insufficient data for leaderboard generation. Record more executions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Table Section */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Variable Performance Matrix</h3>
            </div>
            
            <div className="flex bg-gray-100 rounded-xl p-1">
              {['all', 'layer1', 'layer2', 'layer3', 'layer4'].map((layer) => (
                <button
                  key={layer}
                  onClick={() => setSelectedLayer(layer)}
                  className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all rounded-lg ${
                    selectedLayer === layer 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {layer === 'all' ? 'All' : `L${layer.slice(-1)}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {layerConfigs.map(config => {
            if (selectedLayer !== 'all' && selectedLayer !== config.key) return null;
            const layerData = statsByTag.filter(s => s.layerKey === config.key);
            
            return (
              <div key={config.key} className="animate-slide-up">
                <LayerHeader title={config.title} desc={config.desc} />
                <PerformanceTable data={layerData} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
