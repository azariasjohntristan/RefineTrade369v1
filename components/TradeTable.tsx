import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trade, Strategy, Category } from '../types';
import { Eye, Edit3, Trash2, X, AlertTriangle, Check, ChevronDown, Calendar, TrendingUp, TrendingDown, Layers, Brain, Target, Activity, Camera } from 'lucide-react';

interface TradeTableProps {
  trades: Trade[];
  strategies: Strategy[];
  currentActiveStrategyId?: string;
  onUpdateTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
  showTitle?: boolean;
}

const SectionHeader = ({ title }: { title: string }) => (
  <div className="pt-2 mb-4 border-b border-slate-800 pb-2">
    <span className="text-[14px] font-black text-slate-500 uppercase tracking-[0.3em]">{title}</span>
  </div>
);

const TradeTable: React.FC<TradeTableProps> = ({ trades, strategies, currentActiveStrategyId, onUpdateTrade, onDeleteTrade, showTitle }) => {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'delete' | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current active strategy for filtering and display
  const currentActiveStrategy = strategies.find(s => s.id === currentActiveStrategyId);

  const [editFormData, setEditFormData] = useState<Partial<Trade>>({});

  const handleOpenModal = (trade: Trade, type: 'view' | 'edit' | 'delete') => {
    setSelectedTrade(trade);
    setModalType(type);
    if (type === 'edit') {
      setEditFormData({
        ...trade,
        time: new Date(trade.time).toISOString().split('T')[0],
        screenshots: trade.screenshots || []
      });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedTrade(null);
    setOpenDropdownId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData(prev => ({
          ...prev,
          screenshots: [...(prev.screenshots || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeScreenshot = (idx: number) => {
    setEditFormData(prev => ({
      ...prev,
      screenshots: (prev.screenshots || []).filter((_, i) => i !== idx)
    }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTrade && editFormData) {
      onUpdateTrade({
        ...selectedTrade,
        ...editFormData,
        time: new Date(editFormData.time as string).toISOString()
      } as Trade);
      closeModal();
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedTrade) {
      onDeleteTrade(selectedTrade.id);
      closeModal();
    }
  };

  const toggleTagInEdit = (catId: string, tagText: string, mode: 'single' | 'multi') => {
    const current = (editFormData.selections || {})[catId] || [];
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

    setEditFormData({ 
      ...editFormData, 
      selections: { ...(editFormData.selections || {}), [catId]: next } 
    });
  };

  // Strategy used when editing a trade (based on trade's strategyId)
  const editStrategy = strategies.find(s => s.id === editFormData.strategyId);
  const instrumentCat = editStrategy?.layers.layer1.find(c => c.name === 'INSTRUMENT');

  // Helper to get category name from trade's strategy for view modal
  const getCategoryName = (catId: string): string => {
    const tradeStrategy = strategies.find(s => s.id === selectedTrade?.strategyId);
    if (!tradeStrategy) return catId.split('-').pop()?.replace('_', ' ') || catId;
    
    const allCategories = [
      ...tradeStrategy.layers.layer1,
      ...tradeStrategy.layers.layer2,
      ...tradeStrategy.layers.layer3,
      ...tradeStrategy.layers.layer4
    ];
    const category = allCategories.find(c => c.id === catId);
    return category?.name || catId.split('-').pop()?.replace('_', ' ') || catId;
  };

  // Helper to get tag color from trade's strategy
  const getTagColor = (catId: string, tagText: string): string => {
    const tradeStrategy = strategies.find(s => s.id === selectedTrade?.strategyId);
    if (!tradeStrategy) return '#64748b';
    
    const allCategories = [
      ...tradeStrategy.layers.layer1,
      ...tradeStrategy.layers.layer2,
      ...tradeStrategy.layers.layer3,
      ...tradeStrategy.layers.layer4
    ];
    const category = allCategories.find(c => c.id === catId);
    const tag = category?.tags.find(t => t.text === tagText);
    return tag?.color || '#64748b';
  };

  const CategoryDropdown: React.FC<{ cat: Category }> = ({ cat }) => {
    const isDropdownOpen = openDropdownId === cat.id;
    const selections = (editFormData.selections || {})[cat.id] || [];

    return (
      <div className="space-y-1.5 flex-1 min-w-[180px] relative">
        <label className="text-[13px] text-slate-500 uppercase font-black tracking-widest">{cat.name}</label>
        <div 
          onClick={() => setOpenDropdownId(isDropdownOpen ? null : cat.id)}
          className={`w-full bg-slate-900 border border-slate-800 p-2.5 flex flex-wrap gap-1.5 min-h-[42px] cursor-pointer transition-all hover:bg-slate-800/40 ${
            isDropdownOpen ? 'border-accent-gain' : 'hover:border-slate-700'
          }`}
        >
          {selections.length > 0 ? (
            selections.map(t => (
              <span key={t} className="bg-slate-800 text-slate-100 px-2 py-0.5 text-[14px] font-mono border border-slate-700 uppercase">
                {t}
              </span>
            ))
          ) : (
            <span className="text-slate-700 text-[14px] font-mono uppercase">---</span>
          )}
          <ChevronDown className={`absolute right-3 top-[32px] transition-transform ${isDropdownOpen ? 'rotate-180 text-accent-gain' : 'text-slate-700'}`} size={12} />
        </div>
        
        {isDropdownOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-slate-800 border border-slate-700 shadow-2xl z-[200] p-1 space-y-0.5 max-h-[200px] overflow-y-auto custom-scrollbar">
            {cat.tags.map(tag => {
              const isSelected = selections.includes(tag.text);
              return (
                <button
                  key={tag.text}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTagInEdit(cat.id, tag.text, cat.selectionType);
                  }}
                  className={`w-full text-left px-3 py-2 text-[14px] font-mono transition-colors flex justify-between items-center uppercase ${
                    isSelected ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:bg-slate-700/50'
                  }`}
                >
                  {tag.text}
                  {isSelected && <Check size={10} className="text-accent-gain" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full ${!showTitle ? 'border-t-2 border-slate-700' : ''} animate-slide-up`} style={{ animationDelay: '0.4s' }}>
      {showTitle && (
        <div className="pb-8 md:pb-10">
          <h2 className="text-4xl md:text-5xl font-black text-slate-100 uppercase tracking-tighter">Performance Log</h2>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {trades.map((trade, idx) => (
          <div 
            key={trade.id} 
            className="bg-slate-800/40 border border-slate-800 p-4 rounded-sm space-y-4 animate-slide-up cursor-pointer hover:border-slate-700 transition-colors"
            onClick={() => handleOpenModal(trade, 'view')}
            style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="text-[14px] font-mono text-slate-500 uppercase">
                  {new Date(trade.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-slate-200 px-2 py-1 text-[14px] font-mono border border-slate-800 uppercase">
                    {trade.pair}
                  </span>
                  <span className={`font-black text-[14px] ${trade.type === 'LONG' ? 'text-accent-gain' : 'text-accent-loss'}`}>
                    {trade.type}
                  </span>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-sm font-bold text-14px ${
                trade.pnl >= 0 
                  ? 'bg-accent-gain/5 text-accent-gain border border-accent-gain/10' 
                  : 'bg-accent-loss/5 text-accent-loss border border-accent-loss/10'
              }`}>
                {trade.pnl > 0 ? '+' : ''}{trade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-2 border-t border-slate-800/50">
              <button onClick={(e) => { e.stopPropagation(); handleOpenModal(trade, 'view'); }} className="flex items-center gap-2 text-[14px] font-bold text-slate-500 uppercase tracking-widest"><Eye size={14} /> View</button>
              <button onClick={(e) => { e.stopPropagation(); handleOpenModal(trade, 'edit'); }} className="flex items-center gap-2 text-[14px] font-bold text-slate-500 uppercase tracking-widest"><Edit3 size={14} /> Edit</button>
              <button onClick={(e) => { e.stopPropagation(); handleOpenModal(trade, 'delete'); }} className="flex items-center gap-2 text-[14px] font-bold text-accent-loss uppercase tracking-widest"><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Compact Card View */}
      <div className="hidden md:block">
        {/* Column Header - Sticky */}
        <div className="sticky top-0 z-10 bg-[#0c0d0e] flex items-center justify-between gap-4 px-3 py-2 border-b border-slate-800/50 mb-3">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Date</span>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Instrument</span>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Type</span>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">PnL</span>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider w-[60px] text-right">Actions</span>
        </div>
        
        {/* Trade Cards */}
        <div className="space-y-3">
          {trades.map((trade, idx) => (
          <div 
            key={trade.id} 
            className="bg-slate-800/30 border border-slate-800/60 p-3 rounded-sm flex items-center justify-between gap-4 animate-slide-up cursor-pointer hover:bg-slate-800/50 hover:border-slate-700 transition-all"
            onClick={() => handleOpenModal(trade, 'view')}
            style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
          >
            <div className="text-[11px] font-mono text-slate-500 uppercase whitespace-nowrap">
              {new Date(trade.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              <span className="text-slate-600 ml-1">{new Date(trade.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
            </div>
            
            <span className="bg-slate-900 text-slate-200 px-2 py-1 text-[11px] font-mono border border-slate-800 uppercase">
              {trade.pair}
            </span>
            
            <span className={`font-black text-[11px] ${trade.type === 'LONG' ? 'text-accent-gain' : 'text-accent-loss'}`}>
              {trade.type}
            </span>
            
            <div className={`px-2 py-1 rounded font-bold text-[11px] ${
              trade.pnl >= 0 
                ? 'bg-accent-gain/5 text-accent-gain border border-accent-gain/10' 
                : 'bg-accent-loss/5 text-accent-loss border border-accent-loss/10'
            }`}>
              {trade.pnl > 0 ? '+' : ''}{trade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
            
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => handleOpenModal(trade, 'edit')} className="p-1.5 text-slate-500 hover:text-accent-gain hover:bg-slate-800 rounded-sm" title="Edit Log"><Edit3 size={14} /></button>
              <button onClick={() => handleOpenModal(trade, 'delete')} className="p-1.5 text-slate-500 hover:text-accent-loss hover:bg-slate-800 rounded-sm" title="Delete Record"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* --- View Modal --- */}
      {modalType === 'view' && selectedTrade && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md" onClick={closeModal} />
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 p-8 space-y-6 animate-slide-up shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-800 pb-6">
              <div>
                <h3 className="text-3xl font-black text-slate-100 uppercase tracking-tight mb-2">Execution Profile: {selectedTrade.id}</h3>
                <div className="flex items-center gap-3 text-[14px] font-mono text-slate-500 uppercase tracking-widest">
                  <span>{new Date(selectedTrade.time).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })}</span>
                  <span className="text-slate-700">-</span>
                  <span className={selectedTrade.type === 'LONG' ? 'text-accent-gain' : 'text-accent-loss'}>{selectedTrade.type}</span>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-500 hover:text-white transition-colors p-2"><X size={28} /></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[14px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Activity size={12} className="text-slate-700" /> Identity & Performance
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-800/40 p-3 border border-slate-700/50">
                      <span className="text-[13px] font-mono text-slate-600 uppercase block mb-1">Instrument</span>
                      <span className="text-14px font-bold text-slate-200">{selectedTrade.pair}</span>
                    </div>
                    <div className="bg-slate-800/40 p-3 border border-slate-700/50">
                      <span className="text-[13px] font-mono text-slate-600 uppercase block mb-1">Net Result</span>
                      <span className={`text-14px font-black ${selectedTrade.pnl >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                        {selectedTrade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </span>
                    </div>
                    <div className="bg-slate-800/40 p-3 border border-slate-700/50">
                      <span className="text-[13px] font-mono text-slate-600 uppercase block mb-1">Status</span>
                      <span className={`text-[14px] font-black uppercase tracking-widest ${selectedTrade.status === 'gain' ? 'text-accent-gain' : 'text-accent-loss'}`}>
                        {selectedTrade.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[14px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Layers size={12} className="text-slate-700" /> Structural Context
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedTrade.selections).map(([catId, tags]) => (
                      <div key={catId} className="space-y-1">
                        <div className="text-[12px] text-slate-600 font-mono uppercase tracking-tighter">{getCategoryName(catId)}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(tags as string[]).map(tag => (
                            <span 
                              key={tag} 
                              className="bg-slate-800 text-slate-100 px-2 py-1 text-[13px] font-mono border border-slate-700 uppercase"
                              style={{ borderLeftColor: getTagColor(catId, tag) }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[14px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Brain size={12} className="text-slate-700" /> Neural Reflection
                  </h4>
                  <div className="bg-slate-800/40 border border-slate-700/50 p-6 min-h-[120px] text-[14px] font-mono text-slate-400 leading-relaxed uppercase whitespace-pre-wrap">
                    {selectedTrade.reflection || 'NO NEURAL TRACE RECORDED FOR THIS SESSION.'}
                  </div>
                </div>

                {selectedTrade.screenshots && selectedTrade.screenshots.length > 0 && (
                  <div>
                    <h4 className="text-[14px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Camera size={12} className="text-slate-700" /> Visual Traces
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedTrade.screenshots.map((src, i) => (
                        <div 
                          key={i} 
                          onClick={() => setFullScreenImage(src)}
                          className="aspect-video bg-slate-950 border border-slate-800 overflow-hidden cursor-zoom-in group relative"
                        >
                          <img src={src} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt={`Trace ${i}`} />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/40">
                            <Eye size={20} className="text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- Edit Modal --- */}
      {modalType === 'edit' && selectedTrade && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={() => setOpenDropdownId(null)}>
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md" onClick={closeModal} />
          <form onSubmit={handleEditSubmit} onClick={e => e.stopPropagation()} className="relative w-full max-w-6xl bg-slate-900 border border-white/5 shadow-2xl animate-slide-up flex flex-col max-h-[92vh] overflow-hidden">
            
            <div className="px-8 py-6 flex justify-between items-start shrink-0 border-b border-white/5">
              <div>
                <h3 className="text-[14px] font-black text-slate-100 uppercase tracking-[0.4em] mb-2">RECONFIGURE EXECUTION LOG</h3>
                <div className="text-[13px] font-mono text-slate-600 uppercase tracking-widest">RECORD_ID: {selectedTrade.id}</div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="text-[13px] font-mono text-slate-600 uppercase tracking-widest">Active_Model:</div>
                  <select 
                    className="bg-transparent border-none text-[14px] font-mono text-slate-400 uppercase tracking-widest outline-none cursor-pointer hover:text-white"
                    value={editFormData.strategyId || ''}
                    onChange={(e) => setEditFormData({...editFormData, strategyId: e.target.value, selections: {}})}
                  >
                    {strategies.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="button" onClick={closeModal} className="text-slate-600 hover:text-white transition-colors p-1">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6 custom-scrollbar">
              
              {/* Layer 01: Identity */}
              <div className="space-y-4">
                <SectionHeader title="LAYER_01 // IDENTITY" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] text-slate-500 uppercase font-black tracking-widest">Execution Date</label>
                    <div className="relative group/date">
                      <input 
                        type="date"
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 text-[14px] font-mono text-slate-200 outline-none focus:border-accent-gain cursor-pointer uppercase appearance-none"
                        value={editFormData.time as string}
                        onChange={e => setEditFormData({...editFormData, time: e.target.value})}
                      />
                      <Calendar size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] text-slate-500 uppercase font-black tracking-widest">Trade Type</label>
                    <div className="grid grid-cols-2 h-[42px] border border-slate-800 bg-slate-900 overflow-hidden">
                      <button 
                        type="button"
                        onClick={() => setEditFormData({...editFormData, type: 'LONG'})}
                        className={`flex items-center justify-center gap-1.5 text-[14px] font-mono transition-all uppercase tracking-widest ${
                          editFormData.type === 'LONG' ? 'bg-slate-200 text-slate-950 font-black' : 'text-slate-600 hover:bg-slate-800/50'
                        }`}
                      >
                        <TrendingUp size={12} /> Long
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditFormData({...editFormData, type: 'SHORT'})}
                        className={`flex items-center justify-center gap-1.5 text-[14px] font-mono transition-all uppercase tracking-widest border-l border-slate-800 ${
                          editFormData.type === 'SHORT' ? 'bg-slate-200 text-slate-950 font-black' : 'text-slate-600 hover:bg-slate-800/50'
                        }`}
                      >
                        <TrendingDown size={12} /> Short
                      </button>
                    </div>
                  </div>

                  {/* Instrument Selection */}
                  <div className="space-y-1.5 flex-1 relative">
                    <label className="text-[13px] text-slate-500 uppercase font-black tracking-widest">Instrument</label>
                    <div 
                      onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === 'pair-edit' ? null : 'pair-edit'); }}
                      className={`w-full bg-slate-900 border border-slate-800 p-2.5 flex items-center justify-between min-h-[42px] cursor-pointer transition-all hover:bg-slate-800/40 ${
                        openDropdownId === 'pair-edit' ? 'border-accent-gain' : 'hover:border-slate-700'
                      }`}
                    >
                      <span className={`text-[14px] font-mono uppercase ${editFormData.pair ? 'text-slate-200' : 'text-slate-700'}`}>
                        {editFormData.pair || 'SELECT_INSTRUMENT'}
                      </span>
                      <ChevronDown className={`transition-transform ${openDropdownId === 'pair-edit' ? 'rotate-180 text-accent-gain' : 'text-slate-700'}`} size={12} />
                    </div>
                    
                    {openDropdownId === 'pair-edit' && instrumentCat && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-slate-800 border border-slate-700 shadow-2xl z-[200] p-1 space-y-0.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                        {instrumentCat.tags.map(tag => (
                          <button
                            key={tag.text}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditFormData({
                                ...editFormData, 
                                pair: tag.text,
                                selections: { ...(editFormData.selections || {}), [instrumentCat.id]: [tag.text] }
                              });
                              setOpenDropdownId(null);
                            }}
                            className={`w-full text-left px-3 py-2 text-[14px] font-mono transition-colors flex justify-between items-center uppercase ${
                              editFormData.pair === tag.text ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:bg-slate-700/50'
                            }`}
                          >
                            {tag.text}
                            {editFormData.pair === tag.text && <Check size={10} className="text-accent-gain" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {editStrategy?.layers.layer1.map(cat => (
                    cat.name !== 'INSTRUMENT' && <CategoryDropdown key={cat.id} cat={cat} />
                  ))}
                </div>
              </div>

              {/* Layer 02: Strategy & Logic */}
              <div className="space-y-4">
                <SectionHeader title="LAYER_02 // STRATEGY & LOGIC" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {editStrategy?.layers.layer2.map(cat => <CategoryDropdown key={cat.id} cat={cat} />)}
                </div>
              </div>

              {/* Layer 03: Temporal & Risk */}
              <div className="space-y-4">
                <SectionHeader title="LAYER_03 // TEMPORAL & RISK" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {editStrategy?.layers.layer3.map(cat => <CategoryDropdown key={cat.id} cat={cat} />)}
                </div>
              </div>

              {/* Layer 04: Reflection */}
              <div className="space-y-4">
                <SectionHeader title="LAYER_04 // REFLECTION" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[13px] text-slate-500 uppercase font-black tracking-widest">NET P&L ($)</label>
                    <input 
                      type="number" step="any"
                      className="w-full bg-slate-900 border border-slate-800 p-3.5 text-[16px] font-black font-mono text-slate-100 outline-none focus:border-accent-gain"
                      value={editFormData.pnl}
                      onChange={e => setEditFormData({...editFormData, pnl: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {editStrategy?.layers.layer4.map(cat => <CategoryDropdown key={cat.id} cat={cat} />)}
                  </div>
                  <div className="col-span-full space-y-2">
                    <label className="text-[13px] text-slate-500 uppercase font-black tracking-widest">NEURAL REFLECTION</label>
                    <textarea 
                      className="w-full bg-slate-900 border border-slate-800 p-4 text-[14px] font-mono text-slate-300 outline-none focus:border-slate-700 min-h-[100px] resize-none leading-relaxed uppercase"
                      value={editFormData.reflection}
                      onChange={e => setEditFormData({...editFormData, reflection: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Layer 05: Visual Assets */}
              <div className="space-y-4">
                <SectionHeader title="LAYER_05 // VISUAL ASSETS" />
                <div className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 bg-slate-900 border border-dashed border-slate-800 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-accent-gain/40 hover:bg-slate-800/40 transition-all group"
                  >
                    <Camera size={14} className="text-slate-600 group-hover:text-accent-gain" />
                    <span className="text-[13px] font-mono text-slate-600 uppercase tracking-widest">UPDATE_EXECUTION_SCREENSHOTS</span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>

                  {editFormData.screenshots && editFormData.screenshots.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {editFormData.screenshots.map((src, idx) => (
                        <div key={idx} className="relative aspect-video bg-slate-950 border border-slate-800 group/item overflow-hidden">
                          <img src={src} className="w-full h-full object-cover opacity-70 group-hover/item:opacity-100 transition-opacity" alt={`Trace ${idx}`} />
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeScreenshot(idx); }}
                            className="absolute top-1 right-1 p-1 bg-slate-950/80 text-slate-500 hover:text-accent-loss opacity-0 group-hover/item:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pb-8 pt-4">
                <button 
                  type="submit"
                  className="w-full bg-white text-slate-950 py-5 text-[14px] font-black uppercase tracking-[0.5em] transition-all hover:bg-slate-100 active:scale-[0.98] shadow-2xl"
                >
                  UPDATE_EXECUTION_CONTEXT
                </button>
              </div>

            </div>
          </form>
        </div>,
        document.body
      )}

      {/* --- Delete Modal --- */}
      {modalType === 'delete' && selectedTrade && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 p-10 space-y-8 animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-accent-loss/10 border border-accent-loss/20 flex items-center justify-center rounded-full">
                <AlertTriangle size={32} className="text-accent-loss" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-100 uppercase tracking-widest">Purge Log Record?</h3>
                <p className="text-[14px] text-slate-500 font-mono uppercase tracking-tighter leading-relaxed">
                  You are about to permanently delete record <span className="text-slate-300 font-bold">"{selectedTrade.id}"</span>. This action will disrupt neural historical accuracy.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={closeModal}
                className="py-4 bg-slate-800 text-slate-400 text-[14px] font-bold uppercase tracking-widest hover:bg-slate-700 hover:text-slate-100 transition-all border border-slate-700"
              >
                Abort_Action
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="py-4 bg-accent-loss/80 text-white text-[14px] font-bold uppercase tracking-widest hover:bg-accent-loss transition-all shadow-xl"
              >
                Confirm_Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- Full Screen Image Modal --- */}
      {fullScreenImage && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500" 
          onClick={() => setFullScreenImage(null)}
        >
          <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-[10001] pointer-events-none">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-sm pointer-events-auto">
              <span className="text-[14px] font-mono text-white/70 uppercase tracking-[0.2em]">Visual_Trace_Immersive_View</span>
            </div>
            <button 
              className="text-white/40 hover:text-white transition-all pointer-events-auto bg-white/5 p-3 rounded-full border border-white/10 backdrop-blur-md hover:scale-110 active:scale-95"
              onClick={() => setFullScreenImage(null)}
            >
              <X size={32} />
            </button>
          </div>
          
          <div className="w-full h-full flex items-center justify-center p-4 md:p-12" onClick={e => e.stopPropagation()}>
            <img 
              src={fullScreenImage} 
              className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-slide-up" 
              alt="Full Screen Trace" 
              style={{ animationDuration: '0.6s' }}
            />
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full z-[10001] animate-in slide-in-from-bottom-4 duration-700">
            <p className="text-[14px] font-mono text-white/50 uppercase tracking-widest">Click anywhere to exit immersive mode</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TradeTable;