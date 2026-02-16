import React, { useState, useEffect } from 'react';
import { Trade, Strategy, Category } from '../types';
import { Plus, X, ChevronDown, Check, Calendar, Brain, Clock, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';

interface TradeFormProps {
  onAddTrade: (trade: Omit<Trade, 'id' | 'status'>) => void;
  strategies: Strategy[];
}

const TradeForm: React.FC<TradeFormProps> = ({ onAddTrade, strategies }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dateValue: new Date().toISOString().split('T')[0],
    pair: '',
    type: 'LONG' as 'LONG' | 'SHORT',
    size: '',
    entry: '',
    exit: '',
    pnl: '',
    strategyId: '',
    selections: {} as Record<string, string[]>,
    reflection: '',
  });

  // Keep strategy selection in sync and ensure it reflects updates from the StrategyBuilder
  useEffect(() => {
    if (!formData.strategyId && strategies.length > 0) {
      setFormData(prev => ({ ...prev, strategyId: strategies[0].id }));
    }
  }, [strategies, formData.strategyId]);

  // Always find the latest strategy object from the prop to ensure new tags/categories are reflected
  const selectedStrategy = strategies.find(s => s.id === formData.strategyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pnl) return;

    onAddTrade({
      time: new Date(formData.dateValue).toISOString(),
      pair: formData.pair.toUpperCase() || '---',
      type: formData.type,
      size: formData.size || '1.0 Lot',
      entry: parseFloat(formData.entry) || 0,
      exit: parseFloat(formData.exit) || 0,
      pnl: parseFloat(formData.pnl) || 0,
      strategyId: formData.strategyId,
      selections: formData.selections,
      reflection: formData.reflection
    });

    setFormData(prev => ({
      ...prev,
      dateValue: new Date().toISOString().split('T')[0],
      pair: '',
      type: 'LONG',
      size: '',
      entry: '',
      exit: '',
      pnl: '',
      selections: {},
      reflection: '',
    }));
    setIsOpen(false);
  };

  const toggleTag = (catId: string, tagText: string, mode: 'single' | 'multi') => {
    const current = formData.selections[catId] || [];
    let next: string[] = [];

    if (mode === 'single') {
      next = [tagText];
      setOpenDropdownId(null);
    } else {
      if (current.includes(tagText)) {
        next = current.filter(t => t !== tagText);
      } else {
        next = [...current, tagText];
      }
    }

    setFormData({ ...formData, selections: { ...formData.selections, [catId]: next } });
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="pt-4 mb-6">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{title}</span>
    </div>
  );

  const CategoryInput: React.FC<{ cat: Category }> = ({ cat }) => {
    const isDropdownOpen = openDropdownId === cat.id;
    const selections = formData.selections[cat.id] || [];

    return (
      <div className="space-y-2 flex-1 min-w-[200px] relative">
        <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{cat.name}</label>
        <div 
          onClick={() => setOpenDropdownId(isDropdownOpen ? null : cat.id)}
          className={`w-full bg-slate-900 border border-slate-800/80 p-3.5 flex flex-wrap gap-2 min-h-[48px] cursor-pointer transition-all hover:bg-slate-800/40 ${
            isDropdownOpen ? 'border-accent-gain' : 'hover:border-slate-700'
          }`}
        >
          {selections.length > 0 ? (
            selections.map(t => (
              <span key={t} className="bg-slate-800 text-slate-100 px-2.5 py-1 text-[10px] font-mono border border-slate-700 uppercase">
                {t}
              </span>
            ))
          ) : (
            <span className="text-slate-700 text-[10px] font-mono uppercase">---</span>
          )}
          <ChevronDown className={`absolute right-4 top-[38px] transition-transform ${isDropdownOpen ? 'rotate-180 text-accent-gain' : 'text-slate-700'}`} size={14} />
        </div>
        
        {isDropdownOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-slate-800 border border-slate-700 shadow-2xl z-[150] p-1.5 space-y-1">
            {cat.tags.map(tag => {
              const isSelected = selections.includes(tag.text);
              return (
                <button
                  key={tag.text}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTag(cat.id, tag.text, cat.selectionType);
                  }}
                  className={`w-full text-left px-4 py-3 text-[10px] font-mono transition-colors flex justify-between items-center uppercase ${
                    isSelected ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:bg-slate-700/50'
                  }`}
                >
                  {tag.text}
                  {isSelected && <Check size={12} className="text-accent-gain" />}
                </button>
              );
            })}
            {cat.tags.length === 0 && <div className="p-4 text-[10px] text-slate-600 italic font-mono text-center uppercase">No Nodes Available</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-white text-slate-900 rounded-sm shadow-2xl flex items-center justify-center z-50 transition-all active:scale-95 group"
      >
        <Plus size={36} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => setOpenDropdownId(null)}>
          <div className="absolute inset-0 bg-transparent backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-5xl bg-slate-900/95 backdrop-blur-md border border-white/5 shadow-2xl animate-slide-up flex flex-col max-h-[95vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-10 flex justify-between items-start">
              <div>
                <h3 className="text-[13px] font-black text-slate-100 uppercase tracking-[0.5em] mb-4">INITIALIZE EXECUTION LOG</h3>
                <div className="flex items-center gap-3">
                  <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Active_Model:</div>
                  <select 
                    className="bg-transparent border-none text-[10px] font-mono text-slate-400 uppercase tracking-widest outline-none cursor-pointer hover:text-white"
                    value={formData.strategyId}
                    onChange={(e) => setFormData({...formData, strategyId: e.target.value, selections: {}})}
                  >
                    {strategies.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-white transition-colors p-2">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-12 pt-0 space-y-12 custom-scrollbar">
              
              {/* Layer 01: Identity */}
              <div className="space-y-6">
                <SectionHeader title="LAYER_01 // IDENTITY" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Execution Date */}
                  <div className="space-y-2">
                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Execution Date</label>
                    <div className="relative group/date">
                      <input 
                        type="date"
                        className="w-full bg-slate-900 border border-slate-800 p-4 text-[11px] font-mono text-slate-200 outline-none focus:border-accent-gain cursor-pointer uppercase appearance-none"
                        value={formData.dateValue}
                        onChange={e => setFormData({...formData, dateValue: e.target.value})}
                      />
                      <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 group-hover/date:text-accent-gain pointer-events-none" />
                    </div>
                  </div>

                  {/* Trade Type Selection */}
                  <div className="space-y-2">
                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Trade Type</label>
                    <div className="grid grid-cols-2 h-[52px] border border-slate-800 bg-slate-900 overflow-hidden">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'LONG'})}
                        className={`flex items-center justify-center gap-2 text-[10px] font-mono transition-all uppercase tracking-widest ${
                          formData.type === 'LONG' 
                            ? 'bg-slate-200 text-slate-950 font-black' 
                            : 'text-slate-600 hover:bg-slate-800/50'
                        }`}
                      >
                        <TrendingUp size={14} className={formData.type === 'LONG' ? 'text-accent-gain' : 'text-slate-700'} />
                        Long
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'SHORT'})}
                        className={`flex items-center justify-center gap-2 text-[10px] font-mono transition-all uppercase tracking-widest border-l border-slate-800 ${
                          formData.type === 'SHORT' 
                            ? 'bg-slate-200 text-slate-950 font-black' 
                            : 'text-slate-600 hover:bg-slate-800/50'
                        }`}
                      >
                        <TrendingDown size={14} className={formData.type === 'SHORT' ? 'text-accent-loss' : 'text-slate-700'} />
                        Short
                      </button>
                    </div>
                  </div>

                  {selectedStrategy?.layers.layer1.map(cat => <CategoryInput key={cat.id} cat={cat} />)}
                  
                  {!selectedStrategy?.layers.layer1.length && selectedStrategy && (
                    <div className="md:col-span-1 lg:col-span-1 py-4 text-center border border-dashed border-slate-800/50 flex items-center justify-center">
                       <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">No Identity Nodes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Layer 02: Strategy & Logic */}
              <div className="space-y-6">
                <SectionHeader title="LAYER_02 // STRATEGY & LOGIC" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {selectedStrategy?.layers.layer2.map(cat => <CategoryInput key={cat.id} cat={cat} />)}
                  {!selectedStrategy?.layers.layer2.length && (
                    <div className="col-span-full py-6 text-center border border-dashed border-slate-800/50">
                       <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">NO LOGIC PARAMETERS CONFIGURED</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Layer 03: Temporal & Risk */}
              <div className="space-y-6">
                <SectionHeader title="LAYER_03 // TEMPORAL & RISK" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {selectedStrategy?.layers.layer3.map(cat => <CategoryInput key={cat.id} cat={cat} />)}
                  {!selectedStrategy?.layers.layer3.length && (
                    <div className="col-span-full py-6 text-center border border-dashed border-slate-800/50">
                       <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">NO TEMPORAL PARAMETERS CONFIGURED</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Layer 04: Reflection */}
              <div className="space-y-8">
                <SectionHeader title="LAYER_04 // REFLECTION" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">NET P&L ($)</label>
                    <input 
                      type="number"
                      step="any"
                      className="w-full bg-slate-900 border border-slate-800 p-5 text-[15px] font-black font-mono text-slate-100 outline-none focus:border-slate-700"
                      value={formData.pnl}
                      onChange={e => setFormData({...formData, pnl: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  {selectedStrategy?.layers.layer4.map(cat => <CategoryInput key={cat.id} cat={cat} />)}
                  <div className="col-span-full space-y-3">
                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">NEURAL REFLECTION</label>
                    <textarea 
                      className="w-full bg-slate-900 border border-slate-800 p-6 text-[11px] font-mono text-slate-300 outline-none focus:border-slate-700 min-h-[180px] resize-none leading-relaxed"
                      placeholder="LOG INTERNAL STATE AND TACTICAL REFINEMENTS..."
                      value={formData.reflection}
                      onChange={e => setFormData({...formData, reflection: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pb-16 pt-10">
                <button 
                  type="submit"
                  className="w-full bg-white text-slate-950 py-7 text-[11px] font-black uppercase tracking-[0.6em] transition-all hover:bg-slate-100 active:scale-[0.98] shadow-2xl"
                >
                  COMMIT_EXECUTION_RECORD
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TradeForm;