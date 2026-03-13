import React, { useState, useMemo } from 'react';
import { Trade, Strategy, Category, Tag } from '../types';
import { Trophy, BarChart3, Target, TrendingUp, ChevronRight, Filter, Layers, Calendar, AlertTriangle, ArrowUp, ArrowDown, X, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

// Helper function to get tag color from Strategy layers
const getTagColor = (catId: string, tag: string, layers: Strategy['layers']): string => {
  for (const categories of Object.values(layers)) {
    const category = (categories as Category[]).find(c => c.id === catId);
    if (category) {
      const tagObj = category.tags.find(t => t.text === tag);
      if (tagObj) return tagObj.color;
    }
  }
  return '#64748b'; // default gray
};

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
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  riskReward: number;
  layerKey: string;
  recentWinRate?: number;
  allTimeWinRate?: number;
  drift?: number;
}

interface DayStats {
  day: string;
  shortDay: string;
  dayIndex: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
  isBestDay: boolean;
}

interface HourStats {
  hour: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
}

interface TagCombination {
  tag1: string;
  tag2: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ trades, strategies, activeStrategyId }) => {
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [chartFilterType, setChartFilterType] = useState<'year' | 'month' | 'week'>('year');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const currentWeek = Math.ceil(new Date().getDate() / 7);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [expandedLayers, setExpandedLayers] = useState<string[]>(['layer1']);
  const [showTrendChart, setShowTrendChart] = useState(true);
  const [showDayOfWeek, setShowDayOfWeek] = useState(true);
  const [showDistribution, setShowDistribution] = useState(false);
  const [selectedTagForDrillDown, setSelectedTagForDrillDown] = useState<TagStats | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);

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
              avgPnL: 0,
              avgWin: 0,
              avgLoss: 0,
              expectancy: 0,
              riskReward: 0
            };
          }

          const stats = tagMap[key];
          stats.totalTrades += 1;
          if (trade.pnl >= 0) {
            stats.wins += 1;
          } else {
            stats.losses += 1;
          }
          stats.totalPnL += trade.pnl;
        });
      });
    });

    // Calculate wins and losses separately for expectancy
    const winLossMap: Record<string, { wins: number[]; losses: number[] }> = {};
    strategyTrades.forEach(trade => {
      Object.entries(trade.selections).forEach(([catId, tags]) => {
        (tags as string[]).forEach(tag => {
          const key = `${catId}-${tag}`;
          if (!winLossMap[key]) {
            winLossMap[key] = { wins: [], losses: [] };
          }
          if (trade.pnl >= 0) {
            winLossMap[key].wins.push(trade.pnl);
          } else {
            winLossMap[key].losses.push(Math.abs(trade.pnl));
          }
        });
      });
    });

    // Calculate 30-day drift (compare recent performance vs all-time)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTrades = strategyTrades.filter(t => new Date(t.time) >= thirtyDaysAgo);
    const recentWinLossMap: Record<string, { wins: number; losses: number; total: number }> = {};
    recentTrades.forEach(trade => {
      Object.entries(trade.selections).forEach(([catId, tags]) => {
        (tags as string[]).forEach(tag => {
          const key = `${catId}-${tag}`;
          if (!recentWinLossMap[key]) {
            recentWinLossMap[key] = { wins: 0, losses: 0, total: 0 };
          }
          recentWinLossMap[key].total += 1;
          if (trade.pnl >= 0) recentWinLossMap[key].wins += 1;
          else recentWinLossMap[key].losses += 1;
        });
      });
    });

    let results = Object.values(tagMap).map(s => {
      const wl = winLossMap[`${s.layerKey}-${s.tag}`] || { wins: [], losses: [] };
      const avgWin = wl.wins.length > 0 ? wl.wins.reduce((a, b) => a + b, 0) / wl.wins.length : 0;
      const avgLoss = wl.losses.length > 0 ? wl.losses.reduce((a, b) => a + b, 0) / wl.losses.length : 1;
      const winRate = s.totalTrades > 0 ? (s.wins / s.totalTrades) * 100 : 0;
      const lossRate = 100 - winRate;
      const expectancy = (winRate / 100 * avgWin) - (lossRate / 100 * avgLoss);
      const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;

      const recent = recentWinLossMap[`${s.layerKey}-${s.tag}`];
      const recentWinRate = recent && recent.total > 0 ? (recent.wins / recent.total) * 100 : null;
      const drift = recentWinRate !== null && s.totalTrades >= 5 ? recentWinRate - winRate : 0;

      return {
        ...s,
        winRate,
        avgPnL: s.totalTrades > 0 ? s.totalPnL / s.totalTrades : 0,
        avgWin,
        avgLoss,
        expectancy,
        riskReward,
        recentWinRate,
        allTimeWinRate: winRate,
        drift
      };
    });

    if (selectedLayer !== 'all') {
      results = results.filter(r => r.layerKey === selectedLayer);
    }

    return results.sort((a, b) => b.expectancy - a.expectancy || b.totalPnL - a.totalPnL);
  }, [trades, selectedStrategy, activeStrategyId, selectedLayer]);

  // Chart data for Variable Performance Bar Chart
  const chartData = useMemo(() => {
    if (!selectedStrategy) return [];

    const strategyTrades = trades.filter(t => t.strategyId === activeStrategyId);
    
    // Filter by year/month/week
    const filteredTrades = strategyTrades.filter(trade => {
      const tradeDate = new Date(trade.time);
      const tradeYear = tradeDate.getFullYear();
      const tradeMonth = tradeDate.getMonth();
      const tradeDay = tradeDate.getDate();
      const tradeWeek = Math.ceil(tradeDay / 7);

      if (chartFilterType === 'year') {
        return tradeYear === selectedYear;
      } else if (chartFilterType === 'month') {
        return tradeYear === selectedYear && tradeMonth === selectedMonth;
      } else if (chartFilterType === 'week') {
        return tradeYear === selectedYear && tradeMonth === selectedMonth && tradeWeek === selectedWeek;
      }
      return true;
    });

    // Calculate stats by tag
    const tagMap: Record<string, { tag: string; categoryName: string; layerKey: string; tagColor: string; totalTrades: number; wins: number; losses: number }> = {};

    filteredTrades.forEach(trade => {
      Object.entries(trade.selections).forEach(([catId, tags]) => {
        let categoryName = 'Unknown';
        let layerKey = '';
        
        Object.entries(selectedStrategy.layers).forEach(([layer, categories]) => {
          const cat = (categories as any[]).find(c => c.id === catId);
          if (cat) {
            categoryName = cat.name;
            layerKey = layer;
          }
        });

        const tagColor = getTagColor(catId, '', selectedStrategy.layers);

        (tags as string[]).forEach(tag => {
          const key = `${catId}-${tag}`;
          if (!tagMap[key]) {
            tagMap[key] = { tag, categoryName, layerKey, tagColor: getTagColor(catId, tag, selectedStrategy.layers), totalTrades: 0, wins: 0, losses: 0 };
          }
          
          const stats = tagMap[key];
          stats.totalTrades += 1;
          if (trade.pnl >= 0) stats.wins += 1;
          else stats.losses += 1;
        });
      });
    });

    let results = Object.values(tagMap)
      .map(s => ({
        tag: s.tag,
        categoryName: s.categoryName,
        tagColor: s.tagColor,
        totalTrades: s.totalTrades,
        wins: s.wins,
        losses: s.losses,
        winRate: s.totalTrades > 0 ? (s.wins / s.totalTrades) * 100 : 0
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 10); // Top 10 only

    if (selectedLayer !== 'all') {
      const layerKey = selectedLayer;
      results = results.filter(r => {
        const tagStat = statsByTag.find(s => s.tag === r.tag && s.layerKey === layerKey);
        return !!tagStat;
      });
    }

    return results;
  }, [trades, selectedStrategy, activeStrategyId, chartFilterType, selectedYear, selectedMonth, selectedWeek, selectedLayer, statsByTag]);

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

    const results: DayStats[] = dayNames.map((day, idx) => {
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
        avgPnL: stats.totalTrades > 0 ? stats.totalPnL / stats.totalTrades : 0,
        isBestDay: false
      };
    });

    // Find best day by total P&L
    const bestDay = results.reduce((best, curr) => curr.totalPnL > best.totalPnL ? curr : best, results[0] || { totalPnL: -Infinity } as DayStats);
    if (bestDay) {
      results.forEach(r => {
        r.isBestDay = r.totalPnL === bestDay.totalPnL && bestDay.totalPnL > 0;
      });
    }

    return results.sort((a, b) => a.dayIndex - b.dayIndex);
  }, [trades, selectedStrategy, activeStrategyId]);

  // Hour stats - performance by hour of day
  const hourStats = useMemo(() => {
    if (!selectedStrategy) return [];

    const hourMap: Record<string, { totalTrades: number; wins: number; losses: number; totalPnL: number }> = {};
    
    for (let h = 0; h < 24; h++) {
      hourMap[h.toString()] = { totalTrades: 0, wins: 0, losses: 0, totalPnL: 0 };
    }

    const strategyTrades = trades.filter(t => t.strategyId === activeStrategyId);

    strategyTrades.forEach(trade => {
      const date = new Date(trade.time);
      const hour = date.getHours();
      
      hourMap[hour.toString()].totalTrades += 1;
      if (trade.pnl >= 0) hourMap[hour.toString()].wins += 1;
      else hourMap[hour.toString()].losses += 1;
      hourMap[hour.toString()].totalPnL += trade.pnl;
    });

    return Object.entries(hourMap).map(([hour, stats]) => ({
      hour: parseInt(hour),
      totalTrades: stats.totalTrades,
      wins: stats.wins,
      losses: stats.losses,
      winRate: stats.totalTrades > 0 ? (stats.wins / stats.totalTrades) * 100 : 0,
      totalPnL: stats.totalPnL,
      avgPnL: stats.totalTrades > 0 ? stats.totalPnL / stats.totalTrades : 0
    })).sort((a, b) => a.hour - b.hour);
  }, [trades, selectedStrategy, activeStrategyId]);

  // Win rate trend data (weekly)
  const winRateTrend = useMemo(() => {
    if (!selectedStrategy) return [];

    const strategyTrades = trades.filter(t => t.strategyId === activeStrategyId);
    if (strategyTrades.length === 0) return [];

    // Group by week
    const weekMap: Record<string, { wins: number; total: number }> = {};
    
    strategyTrades.forEach(trade => {
      const date = new Date(trade.time);
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { wins: 0, total: 0 };
      }
      weekMap[weekKey].total += 1;
      if (trade.pnl >= 0) weekMap[weekKey].wins += 1;
    });

    return Object.entries(weekMap)
      .map(([week, data]) => ({
        week,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
        trades: data.total
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12); // Last 12 weeks
  }, [trades, selectedStrategy, activeStrategyId]);

  // P&L Distribution
  const pnlDistribution = useMemo(() => {
    if (!selectedStrategy) return [];

    const strategyTrades = trades.filter(t => t.strategyId === activeStrategyId);
    if (strategyTrades.length === 0) return [];

    const bins = [
      { min: -Infinity, max: -500, label: '<-$500', count: 0, totalPnL: 0 },
      { min: -500, max: -300, label: '-$500 to -$300', count: 0, totalPnL: 0 },
      { min: -300, max: -100, label: '-$300 to -$100', count: 0, totalPnL: 0 },
      { min: -100, max: 0, label: '-$100 to $0', count: 0, totalPnL: 0 },
      { min: 0, max: 100, label: '$0 to $100', count: 0, totalPnL: 0 },
      { min: 100, max: 300, label: '$100 to $300', count: 0, totalPnL: 0 },
      { min: 300, max: 500, label: '$300 to $500', count: 0, totalPnL: 0 },
      { min: 500, max: Infinity, label: '>$500', count: 0, totalPnL: 0 }
    ];

    strategyTrades.forEach(trade => {
      const bin = bins.find(b => trade.pnl >= b.min && trade.pnl < b.max);
      if (bin) {
        bin.count += 1;
        bin.totalPnL += trade.pnl;
      }
    });

    return bins.map(b => ({
      label: b.label,
      count: b.count,
      totalPnL: b.totalPnL,
      isProfit: b.totalPnL > 0
    }));
  }, [trades, selectedStrategy, activeStrategyId]);

  // Get multi-select category IDs from strategy
  const multiSelectCategoryIds = useMemo(() => {
    if (!selectedStrategy) return new Set<string>();
    const ids = new Set<string>();
    Object.values(selectedStrategy.layers).forEach((categories: Category[]) => {
      categories.forEach((cat: Category) => {
        if (cat.selectionType === 'multi') {
          ids.add(cat.id);
        }
      });
    });
    return ids;
  }, [selectedStrategy]);

  // Tag combination analysis - only using winning trades with multi-select category tags
  const tagCombinations = useMemo(() => {
    if (!selectedStrategy) return [];

    const comboMap: Record<string, TagCombination> = {};
    const strategyTrades = trades.filter(t => t.strategyId === activeStrategyId);

    strategyTrades.forEach(trade => {
      // Only consider winning trades
      if (trade.pnl <= 0) return;

      // Get only tags from multi-select categories
      const tags: string[] = [];
      Object.entries(trade.selections).forEach(([catId, catTags]) => {
        if (multiSelectCategoryIds.has(catId)) {
          tags.push(...(catTags as string[]));
        }
      });

      if (tags.length < 2) return;

      // Get unique tag pairs (2-tags combinations)
      for (let i = 0; i < tags.length; i++) {
        for (let j = i + 1; j < tags.length; j++) {
          const pairKey = [tags[i], tags[j]].sort().join('|');
          if (!comboMap[pairKey]) {
            comboMap[pairKey] = { tag1: tags[i], tag2: tags[j], totalTrades: 0, wins: 0, losses: 0, winRate: 0, totalPnL: 0 };
          }
          // Only count winning trades
          comboMap[pairKey].totalTrades += 1;
          comboMap[pairKey].wins += 1;
          // Only add P&L from winning trades
          comboMap[pairKey].totalPnL += trade.pnl;
        }
      }
    });

    return Object.values(comboMap)
      .map(c => ({
        ...c,
        winRate: 100 // All trades are wins, so 100%
      }))
      .filter(c => c.totalTrades >= 2) // Min 2 winning trades
      .sort((a, b) => b.totalPnL - a.totalPnL);
  }, [trades, selectedStrategy, activeStrategyId, multiSelectCategoryIds]);

  // Check if there are any multi-tag winning trades (from multi-select categories only)
  const hasMultiTagTrades = useMemo(() => {
    const strategyTrades = trades.filter(t => t.strategyId === activeStrategyId);
    return strategyTrades.some(t => {
      // Only consider winning trades
      if (t.pnl <= 0) return false;
      
      const tags: string[] = [];
      Object.entries(t.selections).forEach(([catId, catTags]) => {
        if (multiSelectCategoryIds.has(catId)) {
          tags.push(...(catTags as string[]));
        }
      });
      return tags.length >= 2;
    });
  }, [trades, activeStrategyId, multiSelectCategoryIds]);

  // State for tag drill-down modal (already declared above)

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
        <div className="flex gap-3">
          <button 
            onClick={() => setShowTrendChart(!showTrendChart)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${showTrendChart ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <TrendingUp size={14} className="inline mr-1" /> Trend
          </button>
          <button 
            onClick={() => setShowDayOfWeek(!showDayOfWeek)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${showDayOfWeek ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Calendar size={14} className="inline mr-1" /> Days
          </button>
          <button 
            onClick={() => setShowDistribution(!showDistribution)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${showDistribution ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <BarChart3 size={14} className="inline mr-1" /> Distribution
          </button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">Total P&L</p>
          <p className={`text-2xl font-black ${trades.reduce((sum, t) => sum + t.pnl, 0) >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
            ${trades.reduce((sum, t) => sum + t.pnl, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">Win Rate</p>
          <p className="text-2xl font-black text-gray-900">
            {trades.length > 0 ? ((trades.filter(t => t.pnl >= 0).length / trades.length) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">Best Day</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-black text-gray-900">
              {dayOfWeekStats.find(d => d.isBestDay)?.shortDay || '-'}
            </p>
            {dayOfWeekStats.find(d => d.isBestDay) && <span className="text-yellow-500">★</span>}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">Total Trades</p>
          <p className="text-2xl font-black text-gray-900">{trades.length}</p>
        </div>
      </div>

      {/* Win Rate Trend Chart */}
      {showTrendChart && winRateTrend.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Win Rate Trend (Last 12 Weeks)</h3>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={winRateTrend}>
                <defs>
                  <linearGradient id="colorWinRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f1" vertical={false} />
                <XAxis dataKey="week" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e4e4e7', borderRadius: '12px' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                />
                <Area type="monotone" dataKey="winRate" stroke="#22c55e" strokeWidth={2} fill="url(#colorWinRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Day of Week Analysis */}
      {showDayOfWeek && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Day of Week Performance</h3>
            </div>
          </div>
          <div className="space-y-3">
            {dayOfWeekStats.map((day) => (
              <div key={day.day} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${day.isBestDay ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                <div className="w-12 text-center">
                  <span className="text-sm font-bold text-gray-700">{day.shortDay}</span>
                  {day.isBestDay && <span className="block text-yellow-500 text-xs">★ Best</span>}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">{day.totalTrades} trades</span>
                    <span className={`text-sm font-bold ${day.totalPnL >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                      {day.totalPnL >= 0 ? '+' : ''}${day.totalPnL.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${day.winRate >= 50 ? 'bg-accent-gain' : 'bg-accent-loss'}`}
                      style={{ width: `${Math.min(day.winRate, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-right">
                  <span className={`text-sm font-bold ${day.winRate >= 50 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                    {day.winRate.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* P&L Distribution */}
      {showDistribution && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">P&L Distribution</h3>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlDistribution.filter(d => d.count > 0)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f1" horizontal={false} />
                <XAxis type="number" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="label" type="category" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e4e4e7', borderRadius: '12px' }}
                  formatter={(value: number, name: string) => [name === 'count' ? `${value} trades` : `$${value.toLocaleString()}`, name === 'count' ? 'Count' : 'Total P&L']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {pnlDistribution.filter(d => d.count > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isProfit ? '#22c55e' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tag Combinations Matrix - Only from multi-select categories, show when there are multi-tag winning trades */}
      {hasMultiTagTrades && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Winning Multi-Select Combinations (Min 2 Wins)</h3>
            </div>
          </div>
          {tagCombinations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {tagCombinations.map((combo, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-green-200 bg-green-50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded">{combo.tag1}</span>
                    <span className="text-gray-400">+</span>
                    <span className="text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded">{combo.tag2}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 uppercase">{combo.totalTrades} winning trades</span>
                      <span className="text-[10px] font-bold text-accent-gain">
                        100% win
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-green-300 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-accent-gain"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-green-200">
                      <span className="text-[10px] text-gray-400">Net P&L (Wins)</span>
                      <span className="text-sm font-bold text-accent-gain">
                        +${combo.totalPnL.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No winning combinations found with minimum 2 winning trades.</p>
              <p className="text-xs text-gray-400 mt-1">Select multiple tags from multi-select categories when logging trades.</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Section */}
      <div className="space-y-5">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Edge Leaderboard (Min 2 Trades)</h3>
            </div>
            <div className="text-xs text-gray-400 font-mono">Sorted by Expectancy</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaderboard.length > 0 ? leaderboard.map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl shadow-card p-5 relative overflow-hidden group hover:shadow-card-lg transition-all cursor-pointer"
              onClick={() => { setSelectedTagForDrillDown(stat); setShowTagModal(true); }}
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={40} className={idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-700' : 'text-orange-500'} />
              </div>
              {/* Drift indicator */}
              {stat.drift !== undefined && Math.abs(stat.drift) > 5 && (
                <div className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${stat.drift > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {stat.drift > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                  {Math.abs(stat.drift).toFixed(0)}%
                </div>
              )}
              <div className="relative z-10 space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{stat.categoryName}</span>
                  <h4 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{stat.tag}</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase block">Win Rate</span>
                    <span className="text-lg font-bold text-accent-gain">{stat.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-gray-400 uppercase block">Expectancy</span>
                    <span className={`text-lg font-bold ${stat.expectancy >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                      {stat.expectancy >= 0 ? '+' : ''}${stat.expectancy.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-end justify-between pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase block">R:R</span>
                    <span className="text-sm font-bold text-gray-700">1:{stat.riskReward.toFixed(1)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-gray-400 uppercase block">Net PnL</span>
                    <span className={`text-sm font-bold ${stat.totalPnL >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
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

      {/* Variable Performance - Expandable Layer Cards */}
      <div className="space-y-4">
        {layerConfigs.map((config) => {
          const isExpanded = expandedLayers.includes(config.key);
          const layerData = chartData.filter(d => {
            // Find layer for this tag
            const tagStat = statsByTag.find(s => s.tag === d.tag && s.layerKey === config.key);
            return !!tagStat;
          });
          
          const avgWinRate = layerData.length > 0 
            ? layerData.reduce((sum, d) => sum + d.winRate, 0) / layerData.length 
            : 0;
          const totalTrades = layerData.reduce((sum, d) => sum + d.totalTrades, 0);
          const totalPnL = layerData.reduce((sum, d) => {
            const tagStat = statsByTag.find(s => s.tag === d.tag);
            return sum + (tagStat?.totalPnL || 0);
          }, 0);

          return (
            <div key={config.key} className="bg-white rounded-2xl shadow-card overflow-hidden">
              {/* Layer Header - Clickable */}
              <div 
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setExpandedLayers(prev => 
                    prev.includes(config.key) 
                      ? prev.filter(l => l !== config.key)
                      : [...prev, config.key]
                  );
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      <ChevronRight size={18} className="text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{config.title.replace('Layer ', 'Layer ')}</h3>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">{config.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 uppercase block">{layerData.length} tags</span>
                      <span className="text-xs font-semibold text-gray-700">{avgWinRate.toFixed(0)}% avg</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 uppercase block">Net P&L</span>
                      <span className={`text-xs font-semibold ${totalPnL >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                        {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content - Tag Cards Grid */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-5">
                  {layerData.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {layerData.map((item, idx) => {
                        const tagStat = statsByTag.find(s => s.tag === item.tag && s.layerKey === config.key);
                        const netPnL = tagStat?.totalPnL || 0;
                        return (
                          <div 
                            key={idx} 
                            className="bg-gray-50 rounded-xl p-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-bold text-gray-800 uppercase">{item.tag}</span>
                              <span className={`text-sm font-bold ${item.winRate >= 50 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                                {item.winRate.toFixed(0)}%
                              </span>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-gray-200 rounded-full mb-2 overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${item.winRate}%`,
                                  backgroundColor: item.tagColor
                                }}
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              {/* Sample size badge */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-gray-400">
                                  {item.wins}W / {item.losses}L
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  item.totalTrades >= 30 ? 'bg-green-100 text-green-700' :
                                  item.totalTrades >= 10 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {item.totalTrades}
                                </span>
                              </div>
                              <span className={`text-xs font-bold font-mono ${netPnL >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                                {netPnL >= 0 ? '+' : ''}${netPnL.toLocaleString()}
                              </span>
                            </div>
                            {/* Expectancy & R:R row */}
                            {tagStat && (
                              <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-mono text-gray-400">EXP:</span>
                                  <span className={`text-[10px] font-bold ${tagStat.expectancy >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                                    {tagStat.expectancy >= 0 ? '+' : ''}${tagStat.expectancy.toFixed(0)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-mono text-gray-400">R:R:</span>
                                  <span className="text-[10px] font-bold text-gray-700">
                                    1:{tagStat.riskReward.toFixed(1)}
                                  </span>
                                </div>
                                {/* Drift indicator */}
                                {tagStat.drift !== undefined && Math.abs(tagStat.drift) > 5 && (
                                  <div className={`text-[9px] font-bold flex items-center gap-0.5 ${tagStat.drift > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {tagStat.drift > 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
                                    {Math.abs(tagStat.drift).toFixed(0)}%
                                  </div>
                                )}
                              </div>
                            )}
                            {/* View trades button */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedTagForDrillDown(tagStat); setShowTagModal(true); }}
                              className="w-full mt-2 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                            >
                              <Eye size={10} /> View Trades
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center">
                      <p className="text-sm text-gray-400">No data available for this layer</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tag Drill-down Modal */}
      {showTagModal && selectedTagForDrillDown && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTagModal(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-modal p-6 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                  {selectedTagForDrillDown.categoryName}
                </p>
                <h3 className="text-xl font-bold text-gray-900 uppercase">
                  {selectedTagForDrillDown.tag}
                </h3>
              </div>
              <button onClick={() => setShowTagModal(false)} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-mono text-gray-400 uppercase mb-1">Trades</p>
                <p className="text-lg font-bold text-gray-900">{selectedTagForDrillDown.totalTrades}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-mono text-gray-400 uppercase mb-1">Win Rate</p>
                <p className={`text-lg font-bold ${selectedTagForDrillDown.winRate >= 50 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                  {selectedTagForDrillDown.winRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-mono text-gray-400 uppercase mb-1">Expectancy</p>
                <p className={`text-lg font-bold ${selectedTagForDrillDown.expectancy >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                  {selectedTagForDrillDown.expectancy >= 0 ? '+' : ''}${selectedTagForDrillDown.expectancy.toFixed(0)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-mono text-gray-400 uppercase mb-1">Net P&L</p>
                <p className={`text-lg font-bold ${selectedTagForDrillDown.totalPnL >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                  {selectedTagForDrillDown.totalPnL >= 0 ? '+' : ''}${selectedTagForDrillDown.totalPnL.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-mono text-gray-400 uppercase mb-1">Avg Win</p>
                <p className="text-sm font-bold text-accent-gain">+${selectedTagForDrillDown.avgWin.toFixed(0)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-mono text-gray-400 uppercase mb-1">Avg Loss</p>
                <p className="text-sm font-bold text-accent-loss">-${selectedTagForDrillDown.avgLoss.toFixed(0)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-mono text-gray-400 uppercase mb-1">Risk:Reward</p>
                <p className="text-sm font-bold text-gray-900">1:{selectedTagForDrillDown.riskReward.toFixed(1)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-mono text-gray-400 uppercase mb-1">Sample Size</p>
                <p className={`text-sm font-bold ${selectedTagForDrillDown.totalTrades >= 30 ? 'text-green-600' : selectedTagForDrillDown.totalTrades >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {selectedTagForDrillDown.totalTrades >= 30 ? 'Significant' : selectedTagForDrillDown.totalTrades >= 10 ? 'Moderate' : 'Insufficient'}
                </p>
              </div>
            </div>

            {/* Recent Trades for this tag */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Recent Trades</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {trades
                  .filter(t => {
                    const selections = Object.values(t.selections).flat() as string[];
                    return t.strategyId === activeStrategyId && selections.includes(selectedTagForDrillDown.tag);
                  })
                  .slice(0, 20)
                  .map((trade, idx) => (
                    <div key={trade.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-xs text-gray-500">
                          {new Date(trade.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">{trade.pair} {trade.type}</span>
                      </div>
                      <span className={`text-sm font-bold ${trade.pnl >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString()}
                      </span>
                    </div>
                  ))}
                {trades.filter(t => {
                  const selections = Object.values(t.selections).flat() as string[];
                  return t.strategyId === activeStrategyId && selections.includes(selectedTagForDrillDown.tag);
                }).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No trades found for this tag</p>
                )}
              </div>
            </div>

            {/* Close button */}
            <button 
              onClick={() => setShowTagModal(false)}
              className="w-full bg-gray-900 text-white py-3 text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
