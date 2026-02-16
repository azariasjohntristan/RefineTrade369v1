import React, { useState } from 'react';
import { analyzeTradingPerformance } from '../services/geminiService';
import { Trade } from '../types';
import { Loader2, Send, Bot } from 'lucide-react';

interface AIAnalystProps {
  trades: Trade[];
}

const AIAnalyst: React.FC<AIAnalystProps> = ({ trades }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    const result = await analyzeTradingPerformance(trades, query);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
      {/* Input Section */}
      <div className="lg:col-span-4 bg-slate-800 border border-structural-border p-6 flex flex-col h-fit">
        <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm uppercase tracking-wider font-semibold">
            <Bot className="w-4 h-4 text-accent-gain" />
            <span>Strategy Analyst</span>
        </div>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          The AI analyst has access to your recent trade executions. Ask for a critique on your sizing, risk management, or specific execution patterns.
        </p>
        
        <textarea 
          className="w-full bg-slate-900 border border-structural-border rounded p-3 text-sm text-slate-200 focus:outline-none focus:border-slate-600 mb-4 font-mono h-32 resize-none"
          placeholder="E.g., Review my losing trades on XAU/USD. Am I sizing too heavy?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        
        <button 
          onClick={handleAnalyze}
          disabled={loading || !query}
          className="bg-slate-200 text-slate-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm py-3 px-4 rounded flex items-center justify-center gap-2 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>Run Analysis</span>
        </button>
      </div>

      {/* Output Section */}
      <div className="lg:col-span-8 bg-slate-800 border border-structural-border p-8 min-h-[400px] relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />
        
        {!response && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600">
            <Bot className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-mono uppercase tracking-widest">Awaiting Input Protocol</p>
          </div>
        )}

        {loading && (
            <div className="h-full flex flex-col items-center justify-center">
                <div className="flex items-center gap-1">
                    <div className="w-1 h-8 bg-accent-gain animate-[pulse_0.6s_infinite]"></div>
                    <div className="w-1 h-12 bg-accent-gain animate-[pulse_0.6s_0.2s_infinite]"></div>
                    <div className="w-1 h-6 bg-accent-gain animate-[pulse_0.6s_0.4s_infinite]"></div>
                </div>
                <p className="mt-4 text-xs font-mono text-accent-gain uppercase tracking-widest animate-pulse">Processing Neural Handshake...</p>
            </div>
        )}

        {response && (
          <div className="relative z-10 animate-slide-up">
            <h3 className="text-sm font-mono text-accent-gain mb-6 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-gain rounded-full"></span>
              Analysis Output
            </h3>
            <div className="prose prose-invert prose-sm max-w-none font-sans leading-relaxed text-slate-300">
              {response.split('\n').map((line, i) => (
                <p key={i} className={`mb-2 ${line.startsWith('-') ? 'pl-4' : ''}`}>
                    {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalyst;