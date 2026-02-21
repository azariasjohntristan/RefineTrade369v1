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
    <div className="flex items-center gap-4 border-b border-slate-800 pb-4 mb-6">
      <div className="w-10 h-10 bg-slate-800 border border-slate-700 flex items-center justify-center rounded-sm">
        <Layers size={16} className="text-accent-gain" />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-200 tracking-[0.2em] uppercase">{title}</h3>
        <p className="text-[14px] text-slate-600 font-mono uppercase tracking-tighter mt-0.5">{desc}</p>
      </div>
    </div>
  );

  const PerformanceTable = ({ data }: { data: (TagStats & { layerKey: string })[] }) => (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-slate-800/20 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                <th className="py-5 px-6 text-[14px] font-black text-slate-500 uppercase tracking-[0.2em]">Variable / Tag</th>
                <th className="py-5 px-6 text-[14px] font-black text-slate-500 uppercase tracking-[0.2em]">Category</th>
                <th className="py-5 px-6 text-[14px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Executions</th>
                <th className="py-5 px-6 text-[14px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {data.length > 0 ? data.map((stat, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-4 px-6">
                    <span className="text-[14px] font-bold text-slate-200 uppercase tracking-tight group-hover:text-white transition-colors">{stat.tag}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-[14px] font-mono text-slate-500 uppercase tracking-tighter">{stat.categoryName}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-[14px] font-mono text-slate-400">{stat.totalTrades}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className={`h-full transition-all duration-1000 ${stat.winRate >= 50 ? 'bg-accent-gain' : 'bg-accent-loss'}`}
                          style={{ width: `${stat.winRate}%` }}
                        />
                      </div>
                      <span className={`text-[14px] font-black font-mono w-10 ${stat.winRate >= 50 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                        {stat.winRate.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <p className="text-[14px] font-mono text-slate-600 uppercase tracking-widest">No variables detected for this selection.</p>
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
          <div key={idx} className="bg-slate-800/30 border border-slate-800 p-4 rounded-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[13px] font-mono text-slate-600 uppercase tracking-widest">{stat.categoryName}</span>
                <h4 className="text-xs font-black text-slate-100 uppercase tracking-tight">{stat.tag}</h4>
              </div>
              <div className="text-right">
                <span className="text-[13px] font-mono text-slate-600 uppercase block mb-1">Executions</span>
                <span className="text-[14px] font-mono text-slate-300">{stat.totalTrades}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
              <span className="text-[13px] font-mono text-slate-600 uppercase">Win Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stat.winRate >= 50 ? 'bg-accent-gain' : 'bg-accent-loss'}`}
                    style={{ width: `${stat.winRate}%` }}
                  />
                </div>
                <span className={`text-[14px] font-black font-mono ${stat.winRate >= 50 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                  {stat.winRate.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-slate-800/20 border border-dashed border-slate-800 p-8 text-center">
            <p className="text-[14px] font-mono text-slate-600 uppercase tracking-widest">No variables detected.</p>
          </div>
        )}
      </div>
    </div>
  );

  const layerConfigs = [
    { key: 'layer1', title: 'Layer_01 // Identity', desc: 'Instrument IDs and core asset identifiers.' },
    { key: 'layer2', title: 'Layer_02 // Strategy & Logic', desc: 'Market bias, execution engines, and confluence signatures.' },
    { key: 'layer3', title: 'Layer_03 // Temporal & Risk', desc: 'Time window constraints and risk management parameters.' },
    { key: 'layer4', title: 'Layer_04 // Reflection', desc: 'Post-execution data points and neural state tracking.' },
  ];

  if (strategies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
          <Filter className="text-slate-500" size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-200 uppercase tracking-widest">No Strategies Found</h3>
        <p className="text-slate-500 text-sm max-w-xs uppercase font-mono tracking-tighter">Initialize a strategy in the Strategy Builder to begin neural analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-[clamp(1.875rem,5vw,3rem)] font-black text-slate-100 uppercase tracking-tight mb-2">Neural Edge Analytics</h2>
          <p className="text-[14px] font-mono text-slate-500 uppercase tracking-[0.3em]">Statistical validation of execution variables</p>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Trophy size={18} className="text-accent-gain" />
          <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-[0.4em]">Edge Leaderboard (Min 2 Trades)</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {leaderboard.length > 0 ? leaderboard.map((stat, idx) => (
            <div key={idx} className="bg-slate-800/30 border border-slate-800 p-6 relative overflow-hidden group hover:border-accent-gain/30 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={48} className={idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-300' : 'text-orange-500'} />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="space-y-1">
                  <span className="text-[13px] font-mono text-slate-600 uppercase tracking-widest">{stat.categoryName}</span>
                  <h4 className="text-xl font-black text-slate-100 uppercase tracking-tight">{stat.tag}</h4>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <span className="text-[12px] font-mono text-slate-600 uppercase block mb-1">Win Rate</span>
                    <span className="text-base font-black text-accent-gain">{stat.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-mono text-slate-600 uppercase block mb-1">Net PnL</span>
                    <span className={`text-base font-black ${stat.totalPnL >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                      ${stat.totalPnL.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full bg-slate-800/20 border border-dashed border-slate-800 p-12 text-center">
              <p className="text-[14px] font-mono text-slate-600 uppercase tracking-widest">Insufficient data for leaderboard generation. Record more executions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Table Section */}
      <div className="space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 size={18} className="text-slate-500" />
            <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-[0.4em]">Variable Performance Matrix</h3>
          </div>
          
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-sm">
            {['all', 'layer1', 'layer2', 'layer3', 'layer4'].map((layer) => (
              <button
                key={layer}
                onClick={() => setSelectedLayer(layer)}
                className={`px-3 py-1.5 text-[14px] font-mono uppercase tracking-widest transition-all ${
                  selectedLayer === layer 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {layer === 'all' ? 'All_Layers' : `L${layer.slice(-1)}`}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-16">
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
