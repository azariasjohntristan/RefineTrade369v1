import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trade, Strategy, Category } from '../types';
import { Plus, X, ChevronDown, Check, Calendar, Brain, Clock, ShieldCheck, TrendingUp, TrendingDown, Camera, Image as ImageIcon } from 'lucide-react';

interface TradeFormProps {
  onAddTrade: (trade: Omit<Trade, 'id' | 'status'>) => void;
  strategies: Strategy[];
}

const TradeForm: React.FC<TradeFormProps> = ({ onAddTrade, strategies }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-trade-form', handleOpen);
    return () => window.removeEventListener('open-trade-form', handleOpen);
  }, []);

  useEffect(() => {
    if (!formData.strategyId && strategies.length > 0) {
      setFormData(prev => ({ ...prev, strategyId: strategies[0].id }));
    }
  }, [strategies, formData.strategyId]);

  const selectedStrategy = strategies.find(s => s.id === formData.strategyId);
  const instrumentCat = selectedStrategy?.layers.layer1.find(c => c.name === 'INSTRUMENT');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshots(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeScreenshot = (idx: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== idx));
  };

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
      reflection: formData.reflection,
      screenshots: screenshots
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
    setScreenshots([]);
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
    <div className="mb-4 border-b border-gray-100 pb-2">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.25em]">{title}</span>
    </div>
  );

  const CategoryInput: React.FC<{ cat: Category }> = ({ cat }) => {
    const isDropdownOpen = openDropdownId === cat.id;
    const selections = formData.selections[cat.id] || [];

    return (
      <div className="space-y-1.5 flex-1 min-w-[180px] relative">
        <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{cat.name}</label>
        <div
          onClick={() => setOpenDropdownId(isDropdownOpen ? null : cat.id)}
          className={`w-full bg-gray-50 border rounded-xl p-2.5 flex flex-wrap gap-1.5 min-h-[42px] cursor-pointer transition-all ${isDropdownOpen ? 'border-gray-400 ring-2 ring-gray-100' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          {selections.length > 0 ? (
            selections.map(t => {
              const tagObj = cat.tags.find(tag => tag.text === t);
              const tagColor = tagObj?.color || '#64748b';
              return (
                <span 
                  key={t} 
                  style={{ 
                    backgroundColor: `${tagColor}15`,
                    color: tagColor,
                    borderColor: `${tagColor}30`
                  }}
                  className="px-2 py-0.5 text-[12px] font-medium border rounded-md"
                >
                  {t}
                </span>
              );
            })
          ) : (
            <span className="text-gray-400 text-[12px]">Select...</span>
          )}
          <ChevronDown className={`absolute right-3 top-[34px] transition-transform ${isDropdownOpen ? 'rotate-180 text-gray-600' : 'text-gray-400'}`} size={12} />
        </div>

        {isDropdownOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 shadow-card-lg rounded-xl z-[150] p-1.5 space-y-0.5 max-h-[200px] overflow-y-auto">
            {cat.tags.map(tag => {
              const isSelected = selections.includes(tag.text);
              const tagColor = tag.color || '#64748b';
              return (
                <button
                  key={tag.text}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTag(cat.id, tag.text, cat.selectionType);
                  }}
                  className={`w-full text-left px-3 py-2 text-[12px] font-medium rounded-lg transition-colors flex justify-between items-center ${isSelected ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: tagColor }}
                    />
                    {tag.text}
                  </span>
                  {isSelected && <Check size={11} style={{ color: tagColor }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex fixed bottom-8 right-8 w-14 h-14 bg-gray-900 text-white rounded-2xl shadow-premium-lg items-center justify-center z-50 transition-all hover:scale-105 hover:bg-gray-800 active:scale-95 group"
      >
        <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => setOpenDropdownId(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-modal animate-slide-up flex flex-col max-h-[95vh] overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="px-7 py-5 flex justify-between items-start shrink-0 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Log a Trade</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-400">Strategy:</span>
                  <select
                    className="text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-gray-400"
                    value={formData.strategyId}
                    onChange={(e) => setFormData({ ...formData, strategyId: e.target.value, selections: {} })}
                  >
                    {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-5 space-y-6">

              {/* Identity */}
              <div className="space-y-3">
                <SectionHeader title="Identity" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Trade Date</label>
                    <input
                      type="date"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 cursor-pointer"
                      value={formData.dateValue}
                      onChange={e => setFormData({ ...formData, dateValue: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Trade Type</label>
                    <div className="grid grid-cols-2 h-[42px] border border-gray-200 bg-gray-50 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'LONG' })}
                        className={`flex items-center justify-center gap-1.5 text-sm font-medium transition-all ${formData.type === 'LONG' ? 'bg-accent-gain/10 text-accent-gain font-semibold' : 'text-gray-500 hover:bg-gray-100'
                          }`}
                      >
                        <TrendingUp size={12} /> Long
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'SHORT' })}
                        className={`flex items-center justify-center gap-1.5 text-sm font-medium transition-all border-l border-gray-200 ${formData.type === 'SHORT' ? 'bg-accent-loss/10 text-accent-loss font-semibold' : 'text-gray-500 hover:bg-gray-100'
                          }`}
                      >
                        <TrendingDown size={12} /> Short
                      </button>
                    </div>
                  </div>

                  {/* Instrument */}
                  <div className="space-y-1.5 flex-1 relative">
                    <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Instrument</label>
                    <div
                      onClick={() => setOpenDropdownId(openDropdownId === 'pair-select' ? null : 'pair-select')}
                      className={`w-full bg-gray-50 border rounded-xl p-2.5 flex items-center justify-between min-h-[42px] cursor-pointer transition-all ${openDropdownId === 'pair-select' ? 'border-gray-400 ring-2 ring-gray-100' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <span className={`text-sm font-medium ${formData.pair ? 'text-gray-700' : 'text-gray-400'}`}>
                        {formData.pair || 'Select instrument'}
                      </span>
                      <ChevronDown className={`transition-transform ${openDropdownId === 'pair-select' ? 'rotate-180 text-gray-600' : 'text-gray-400'}`} size={12} />
                    </div>

                    {openDropdownId === 'pair-select' && instrumentCat && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 shadow-card-lg rounded-xl z-[150] p-1.5 space-y-0.5 max-h-[200px] overflow-y-auto">
                        {instrumentCat.tags.map(tag => {
                          const tagColor = tag.color || '#64748b';
                          return (
                            <button
                              key={tag.text}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData({ ...formData, pair: tag.text, selections: { ...formData.selections, [instrumentCat.id]: [tag.text] } });
                                setOpenDropdownId(null);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex justify-between items-center ${formData.pair === tag.text ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                              <span className="flex items-center gap-2">
                                <span 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: tagColor }}
                                />
                                {tag.text}
                              </span>
                              {formData.pair === tag.text && <Check size={11} style={{ color: tagColor }} />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedStrategy?.layers.layer1.map(cat => (
                    cat.name !== 'INSTRUMENT' && <CategoryInput key={cat.id} cat={cat} />
                  ))}
                </div>
              </div>

              {/* Strategy & Logic */}
              <div className="space-y-3">
                <SectionHeader title="Strategy & Logic" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {selectedStrategy?.layers.layer2.map(cat => <CategoryInput key={cat.id} cat={cat} />)}
                </div>
              </div>

              {/* Temporal & Risk */}
              <div className="space-y-3">
                <SectionHeader title="Temporal & Risk" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {selectedStrategy?.layers.layer3.map(cat => <CategoryInput key={cat.id} cat={cat} />)}
                </div>
              </div>

              {/* Reflection */}
              <div className="space-y-3">
                <SectionHeader title="Reflection" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Net P&L ($)</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg font-bold text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                      value={formData.pnl}
                      onChange={e => setFormData({ ...formData, pnl: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  {selectedStrategy?.layers.layer4.map(cat => <CategoryInput key={cat.id} cat={cat} />)}
                  <div className="col-span-full space-y-1.5">
                    <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Notes / Reflection</label>
                    <textarea
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 min-h-[90px] resize-none leading-relaxed"
                      placeholder="Add your trade notes and reflection..."
                      value={formData.reflection}
                      onChange={e => setFormData({ ...formData, reflection: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Screenshots */}
              <div className="space-y-3">
                <SectionHeader title="Screenshots" />
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-20 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gray-400 hover:bg-gray-100 transition-all group"
                  >
                    <Camera size={14} className="text-gray-400 group-hover:text-gray-600" />
                    <span className="text-xs text-gray-400 group-hover:text-gray-600">Click to upload screenshots</span>
                    <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                  </div>

                  {screenshots.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {screenshots.map((src, idx) => (
                        <div key={idx} className="relative aspect-video bg-gray-100 rounded-xl group/item overflow-hidden">
                          <img src={src} className="w-full h-full object-cover" alt={`Screenshot ${idx}`} />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeScreenshot(idx); }}
                            className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-gray-500 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity shadow-sm"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pb-4 pt-2">
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-3.5 text-sm font-semibold rounded-xl hover:bg-gray-800 active:scale-[0.99] transition-all"
                >
                  Save Trade
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default TradeForm;