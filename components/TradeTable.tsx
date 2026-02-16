import React from 'react';
import { Trade } from '../types';

interface TradeTableProps {
  trades: Trade[];
}

const TradeTable: React.FC<TradeTableProps> = ({ trades }) => {
  return (
    <div className="w-full border-t-2 border-slate-700 animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr>
              <th className="py-6 px-4 text-slate-500 font-normal uppercase tracking-wider text-[0.7rem] border-b border-structural-border">Timestamp</th>
              <th className="py-6 px-4 text-slate-500 font-normal uppercase tracking-wider text-[0.7rem] border-b border-structural-border">Structural context</th>
              <th className="py-6 px-4 text-slate-500 font-normal uppercase tracking-wider text-[0.7rem] border-b border-structural-border">Type</th>
              <th className="py-6 px-4 text-slate-500 font-normal uppercase tracking-wider text-[0.7rem] border-b border-structural-border">Neural Reflection</th>
              <th className="py-6 px-4 text-slate-500 font-normal uppercase tracking-wider text-[0.7rem] border-b border-structural-border">Entry/Exit</th>
              <th className="py-6 px-4 text-slate-500 font-normal uppercase tracking-wider text-[0.7rem] border-b border-structural-border">PnL</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, idx) => (
              <tr 
                key={trade.id} 
                className="hover:bg-white/[0.02] transition-colors duration-300 group align-top"
                style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
              >
                <td className="py-6 px-4 border-b border-structural-border text-slate-500 font-mono text-[10px] whitespace-nowrap">
                  {new Date(trade.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                  <div className="text-[9px] text-slate-700 mt-1">{new Date(trade.time).toLocaleTimeString('en-US', { hour12: false })}</div>
                </td>
                <td className="py-6 px-4 border-b border-structural-border">
                  <div className="flex flex-col gap-2">
                    <span className="bg-slate-800 w-fit px-2 py-1 rounded-sm text-slate-200 font-bold text-[10px] font-mono border border-slate-700 uppercase tracking-tighter">
                      {trade.pair}
                    </span>
                    <div className="flex flex-wrap gap-1 max-w-[240px]">
                      {(Object.entries(trade.selections || {}) as [string, string[]][]).map(([catId, tags]) => 
                        tags.map((tag, tIdx) => (
                          <span 
                            key={`${catId}-${tIdx}`} 
                            className="text-[8px] font-mono text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter bg-slate-850/30"
                          >
                            {tag}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </td>
                <td className={`py-6 px-4 border-b border-structural-border font-black text-xs ${trade.type === 'LONG' ? 'text-accent-gain' : 'text-accent-loss'}`}>
                  {trade.type}
                </td>
                <td className="py-6 px-4 border-b border-structural-border min-w-[200px] max-w-[300px]">
                  <p className="text-[10px] font-mono text-slate-400 italic leading-relaxed line-clamp-3 uppercase tracking-tight">
                    {trade.reflection || "NO REFLECTION LOGGED"}
                  </p>
                </td>
                <td className="py-6 px-4 border-b border-structural-border font-mono text-[10px] text-slate-400 leading-relaxed whitespace-nowrap">
                  <span className="text-slate-600 mr-2 uppercase tracking-tighter">IN:</span>{trade.entry.toFixed(2)}<br/>
                  <span className="text-slate-600 mr-2 uppercase tracking-tighter">OUT:</span>{trade.exit.toFixed(2)}
                </td>
                <td className="py-6 px-4 border-b border-structural-border font-mono text-right">
                  <div className={`px-3 py-1.5 rounded-sm font-bold text-xs inline-block ${
                    trade.pnl >= 0 
                      ? 'bg-accent-gain/5 text-accent-gain border border-accent-gain/10' 
                      : 'bg-accent-loss/5 text-accent-loss border border-accent-loss/10'
                  }`}>
                    {trade.pnl > 0 ? '+' : ''}{trade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {trades.length === 0 && (
          <div className="py-20 text-center border-b border-structural-border">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.4em]">Awaiting Initial Neural Commitment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeTable;