import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Trade, Strategy, Category } from '../types';
import { Eye, Edit3, Trash2, X, AlertTriangle, Check, ChevronDown, Calendar, TrendingUp, TrendingDown, Layers, Brain, Target, Activity, Camera, Grid, List } from 'lucide-react';

interface TradeTableProps {
  trades: Trade[];
  strategies: Strategy[];
  currentActiveStrategyId?: string;
  onUpdateTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
  showTitle?: boolean;
}

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">{title}</span>
  </div>
);

const TradeTable: React.FC<TradeTableProps> = ({ trades, strategies, currentActiveStrategyId, onUpdateTrade, onDeleteTrade, showTitle }) => {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'delete' | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
  const [tradeFilter, setTradeFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current active strategy for filtering and display
  const currentActiveStrategy = strategies.find(s => s.id === currentActiveStrategyId);

  // Filter trades based on tradeFilter
  const filteredTrades = useMemo(() => {
    if (tradeFilter === 'all') return trades;
    if (tradeFilter === 'wins') return trades.filter(t => t.pnl > 0);
    if (tradeFilter === 'losses') return trades.filter(t => t.pnl < 0);
    return trades;
  }, [trades, tradeFilter]);

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

  // Helper to get selections grouped by layer for view modal
  const getSelectionsByLayer = () => {
    if (!selectedTrade) return { layer1: [], layer2: [], layer3: [], layer4: [] };
    
    const tradeStrategy = strategies.find(s => s.id === selectedTrade.strategyId);
    if (!tradeStrategy) return { layer1: [], layer2: [], layer3: [], layer4: [] };

    const layerCategories = {
      layer1: tradeStrategy.layers.layer1.filter(c => c.name !== 'INSTRUMENT'),
      layer2: tradeStrategy.layers.layer2,
      layer3: tradeStrategy.layers.layer3,
      layer4: tradeStrategy.layers.layer4
    };

    const result: Record<string, { catId: string; catName: string; tags: string[] }[]> = {
      layer1: [],
      layer2: [],
      layer3: [],
      layer4: []
    };

    Object.entries(selectedTrade.selections).forEach(([catId, tags]) => {
      const layerKey = Object.keys(layerCategories).find(layer => 
        layerCategories[layer as keyof typeof layerCategories].some(c => c.id === catId)
      );
      if (layerKey) {
        const category = layerCategories[layerKey as keyof typeof layerCategories].find(c => c.id === catId);
        if (category) {
          result[layerKey].push({ catId, catName: category.name, tags: tags as string[] });
        }
      }
    });

    return result;
  };

  const selectionsByLayer = getSelectionsByLayer();

  const CategoryDropdown: React.FC<{ cat: Category }> = ({ cat }) => {
    const isDropdownOpen = openDropdownId === cat.id;
    const selections = (editFormData.selections || {})[cat.id] || [];

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
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 shadow-card-lg rounded-xl z-[200] p-1.5 space-y-0.5 max-h-[200px] overflow-y-auto">
            {cat.tags.map(tag => {
              const isSelected = selections.includes(tag.text);
              const tagColor = tag.color || '#64748b';
              return (
                <button
                  key={tag.text}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTagInEdit(cat.id, tag.text, cat.selectionType);
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
    <div className="w-full animate-slide-up pb-20">
      {showTitle && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <p className="text-[14px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-1">CORE_TERMINAL_V4 // ED-230934</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">PERFORMANCE LOG</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[14px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
                TOTAL EXECUTIONS <Activity size={10} className="text-accent-gain" />
              </p>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{filteredTrades.length}</p>
            </div>
            {/* Trade All/Wins/Losses */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTradeFilter('all')}
                className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all ${tradeFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                All
              </button>
              <button
                onClick={() => setTradeFilter('wins')}
                className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all ${tradeFilter === 'wins' ? 'bg-white shadow-sm text-accent-gain' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Wins
              </button>
              <button
                onClick={() => setTradeFilter('losses')}
                className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all ${tradeFilter === 'losses' ? 'bg-white shadow-sm text-accent-loss' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Losses
              </button>
            </div>
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                title="List View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('gallery')}
                className={`p-2 rounded-md transition-all ${viewMode === 'gallery' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                title="Gallery View"
              >
                <Grid size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Mode */}
      {viewMode === 'gallery' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Grid size={14} className="text-gray-400" />
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">Gallery Mode</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTrades.map((trade, idx) => (
              <div
                key={trade.id}
                className="relative h-[180px] rounded-2xl overflow-hidden hover:scale-[1.02] hover:shadow-xl transition-all duration-200 group"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* Clickable area - opens view modal */}
                <div 
                  className="absolute inset-0 cursor-pointer z-10"
                  onClick={() => handleOpenModal(trade, 'view')}
                >
                  {trade.screenshots && trade.screenshots.length > 0 ? (
                    <img 
                      src={trade.screenshots[0]} 
                      alt="Trade screenshot" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center">
                      <Camera size={24} className="text-gray-400 mb-2" />
                      <span className="text-[10px] font-mono text-gray-400 uppercase">No Screenshots</span>
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  {/* Info at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-white/90 text-gray-900 px-2 py-0.5 text-[10px] font-semibold rounded uppercase">
                          {trade.pair}
                        </span>
                        <span className={`text-[9px] font-bold uppercase ${trade.type === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.type}
                        </span>
                      </div>
                      <span className={`text-[12px] font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.pnl > 0 ? '+' : ''}{trade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </span>
                    </div>
                    <div className="text-[9px] text-gray-300 mt-1">
                      {new Date(trade.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                {/* Edit/Delete buttons - top right, separate from clickable area */}
                <div className="absolute top-2 right-2 flex gap-1 z-20">
                  <button 
                    onClick={() => handleOpenModal(trade, 'edit')}
                    className="p-1.5 bg-white/90 rounded-lg text-gray-600 hover:text-gray-900 shadow-sm"
                    title="Edit"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button 
                    onClick={() => handleOpenModal(trade, 'delete')}
                    className="p-1.5 bg-white/90 rounded-lg text-gray-600 hover:text-red-600 shadow-sm"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredTrades.map((trade, idx) => (
          <div
            key={trade.id}
            className="bg-white rounded-2xl shadow-card p-5 space-y-4 animate-slide-up cursor-pointer hover:shadow-card-lg transition-all"
            onClick={() => handleOpenModal(trade, 'view')}
            style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                  {new Date(trade.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 text-[12px] font-semibold rounded-lg uppercase">
                    {trade.pair}
                  </span>
                  <span className={`font-bold text-[12px] ${trade.type === 'LONG' ? 'text-accent-gain' : 'text-accent-loss'}`}>
                    {trade.type}
                  </span>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-lg font-bold text-[14px] ${trade.pnl >= 0
                  ? 'bg-accent-gain/5 text-accent-gain border border-accent-gain/10'
                  : 'bg-accent-loss/5 text-accent-loss border border-accent-loss/10'
                }`}>
                {trade.pnl > 0 ? '+' : ''}{trade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={(e) => { e.stopPropagation(); handleOpenModal(trade, 'view'); }} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-widest hover:text-gray-700"><Eye size={12} /> View</button>
              <button onClick={(e) => { e.stopPropagation(); handleOpenModal(trade, 'edit'); }} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-widest hover:text-gray-700"><Edit3 size={12} /> Edit</button>
              <button onClick={(e) => { e.stopPropagation(); handleOpenModal(trade, 'delete'); }} className="flex items-center gap-1.5 text-[11px] font-medium text-accent-loss uppercase tracking-widest hover:text-red-600"><Trash2 size={12} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Card View */}
      <div className="hidden md:block">
        {/* Trade Cards */}
        <div className="grid gap-4">
          {filteredTrades.map((trade, idx) => (
            <div
              key={trade.id}
              className="bg-white rounded-2xl shadow-card p-5 flex items-center justify-between gap-4 animate-slide-up cursor-pointer hover:shadow-card-lg transition-all"
              onClick={() => handleOpenModal(trade, 'view')}
              style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider whitespace-nowrap min-w-[90px]">
                  {new Date(trade.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  <span className="text-gray-400 ml-1">{new Date(trade.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                </div>

                <span className="bg-gray-100 text-gray-700 px-3 py-1.5 text-[11px] font-semibold rounded-lg uppercase min-w-[80px] text-center">
                  {trade.pair}
                </span>

                <span className={`font-bold text-[11px] uppercase min-w-[50px] ${trade.type === 'LONG' ? 'text-accent-gain' : 'text-accent-loss'}`}>
                  {trade.type}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className={`px-3 py-1.5 rounded-lg font-bold text-[13px] ${trade.pnl >= 0
                    ? 'bg-accent-gain/5 text-accent-gain border border-accent-gain/10'
                    : 'bg-accent-loss/5 text-accent-loss border border-accent-loss/10'
                  }`}>
                  {trade.pnl > 0 ? '+' : ''}{trade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </div>

                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleOpenModal(trade, 'edit')} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Edit Log"><Edit3 size={14} /></button>
                  <button onClick={() => handleOpenModal(trade, 'delete')} className="p-2 text-gray-400 hover:text-accent-loss hover:bg-gray-100 rounded-lg transition-colors" title="Delete Record"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
        </>
      )}

      {/* --- View Modal --- */}
      {modalType === 'view' && selectedTrade && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-modal p-8 space-y-6 animate-slide-up overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-gray-100 pb-5">
              <div>
                <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mb-1">{new Date(selectedTrade.time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</p>
                <h3 className="text-2xl font-bold text-gray-900">{selectedTrade.pair} <span className={selectedTrade.type === 'LONG' ? 'text-accent-gain' : 'text-accent-loss'}>{selectedTrade.type}</span></h3>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>

            {/* Screenshots - moved to top */}
            {selectedTrade.screenshots && selectedTrade.screenshots.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card p-6 -mx-2">
                <div className="flex items-center gap-2 mb-5">
                  <Camera size={14} className="text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-700">Screenshots</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {selectedTrade.screenshots.map((src, i) => (
                    <div key={i} onClick={() => setFullScreenImage(src)} className="aspect-video bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in group relative">
                      <img src={src} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" alt={`Screenshot ${i}`} />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                        <Eye size={18} className="text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Activity size={14} className="text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-700">Performance</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                    <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Instrument</span>
                    <span className="text-sm font-semibold text-gray-800">{selectedTrade.pair}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                    <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Net P&L</span>
                    <span className={`text-sm font-bold ${selectedTrade.pnl >= 0 ? 'text-accent-gain' : 'text-accent-loss'}`}>
                      {selectedTrade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Status</span>
                    <span className={`text-sm font-bold uppercase ${selectedTrade.status === 'gain' ? 'text-accent-gain' : 'text-accent-loss'}`}>{selectedTrade.status}</span>
                  </div>
                </div>
              </div>

              {/* Layer 1: Identity */}
              {selectionsByLayer.layer1.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers size={12} className="text-gray-400" />
                    <h4 className="text-[11px] font-mono font-semibold text-gray-500 uppercase tracking-wider">Layer 1: Identity</h4>
                  </div>
                  <div className="space-y-2.5">
                    {selectionsByLayer.layer1.map(({ catId, catName, tags }) => (
                      <div key={catId} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{catName}</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {tags.map(tag => {
                            const tagColor = getTagColor(catId, tag);
                            return (
                              <span 
                                key={tag} 
                                style={{ 
                                  backgroundColor: `${tagColor}15`,
                                  color: tagColor
                                }}
                                className="px-2 py-0.5 text-[11px] font-medium rounded-md"
                              >{tag}</span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Layer 2: Strategy & Logic */}
              {selectionsByLayer.layer2.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers size={12} className="text-gray-400" />
                    <h4 className="text-[11px] font-mono font-semibold text-gray-500 uppercase tracking-wider">Layer 2: Strategy & Logic</h4>
                  </div>
                  <div className="space-y-2.5">
                    {selectionsByLayer.layer2.map(({ catId, catName, tags }) => (
                      <div key={catId} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{catName}</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {tags.map(tag => {
                            const tagColor = getTagColor(catId, tag);
                            return (
                              <span 
                                key={tag} 
                                style={{ 
                                  backgroundColor: `${tagColor}15`,
                                  color: tagColor
                                }}
                                className="px-2 py-0.5 text-[11px] font-medium rounded-md"
                              >{tag}</span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Layer 3: Temporal & Risk */}
              {selectionsByLayer.layer3.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers size={12} className="text-gray-400" />
                    <h4 className="text-[11px] font-mono font-semibold text-gray-500 uppercase tracking-wider">Layer 3: Temporal & Risk</h4>
                  </div>
                  <div className="space-y-2.5">
                    {selectionsByLayer.layer3.map(({ catId, catName, tags }) => (
                      <div key={catId} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{catName}</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {tags.map(tag => {
                            const tagColor = getTagColor(catId, tag);
                            return (
                              <span 
                                key={tag} 
                                style={{ 
                                  backgroundColor: `${tagColor}15`,
                                  color: tagColor
                                }}
                                className="px-2 py-0.5 text-[11px] font-medium rounded-md"
                              >{tag}</span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Layer 4: Outcome */}
              {selectionsByLayer.layer4.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers size={12} className="text-gray-400" />
                    <h4 className="text-[11px] font-mono font-semibold text-gray-500 uppercase tracking-wider">Layer 4: Outcome</h4>
                  </div>
                  <div className="space-y-2.5">
                    {selectionsByLayer.layer4.map(({ catId, catName, tags }) => (
                      <div key={catId} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{catName}</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {tags.map(tag => {
                            const tagColor = getTagColor(catId, tag);
                            return (
                              <span 
                                key={tag} 
                                style={{ 
                                  backgroundColor: `${tagColor}15`,
                                  color: tagColor
                                }}
                                className="px-2 py-0.5 text-[11px] font-medium rounded-md"
                              >{tag}</span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-card p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-5">
                  <Brain size={14} className="text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-700">Reflection</h4>
                </div>
                <div className="text-sm text-gray-600 leading-relaxed">
                  {selectedTrade.reflection || 'No reflection recorded for this trade.'}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- Edit Modal --- */}
      {modalType === 'edit' && selectedTrade && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={() => setOpenDropdownId(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <form onSubmit={handleEditSubmit} onClick={e => e.stopPropagation()} className="relative w-full max-w-5xl bg-white rounded-2xl shadow-modal animate-slide-up flex flex-col max-h-[92vh] overflow-hidden">

            {/* Header */}
            <div className="px-7 py-5 flex justify-between items-start shrink-0 border-b border-gray-100">
              <div>
                <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mb-0.5">Record: {selectedTrade.id.slice(0, 8)}...</p>
                <h3 className="text-xl font-bold text-gray-900">Edit Trade Log</h3>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-gray-400">Strategy:</span>
                  <select
                    className="text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-gray-400"
                    value={editFormData.strategyId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, strategyId: e.target.value, selections: {} })}
                  >
                    {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-5 space-y-6">

              {/* Screenshots - moved to top */}
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

                  {editFormData.screenshots && editFormData.screenshots.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {editFormData.screenshots.map((src, idx) => (
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

              {/* Identity */}
              <div className="space-y-3">
                <SectionHeader title="Identity" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Trade Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 cursor-pointer"
                        value={editFormData.time as string}
                        onChange={e => setEditFormData({ ...editFormData, time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Trade Type</label>
                    <div className="grid grid-cols-2 h-[42px] border border-gray-200 bg-gray-50 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, type: 'LONG' })}
                        className={`flex items-center justify-center gap-1.5 text-sm font-medium transition-all ${editFormData.type === 'LONG' ? 'bg-accent-gain/10 text-accent-gain font-semibold' : 'text-gray-500 hover:bg-gray-100'
                          }`}
                      >
                        <TrendingUp size={12} /> Long
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, type: 'SHORT' })}
                        className={`flex items-center justify-center gap-1.5 text-sm font-medium transition-all border-l border-gray-200 ${editFormData.type === 'SHORT' ? 'bg-accent-loss/10 text-accent-loss font-semibold' : 'text-gray-500 hover:bg-gray-100'
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
                      onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === 'pair-edit' ? null : 'pair-edit'); }}
                      className={`w-full bg-gray-50 border rounded-xl p-2.5 flex items-center justify-between min-h-[42px] cursor-pointer transition-all ${openDropdownId === 'pair-edit' ? 'border-gray-400 ring-2 ring-gray-100' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <span className={`text-sm font-medium ${editFormData.pair ? 'text-gray-700' : 'text-gray-400'}`}>
                        {editFormData.pair || 'Select instrument'}
                      </span>
                      <ChevronDown className={`transition-transform ${openDropdownId === 'pair-edit' ? 'rotate-180 text-gray-600' : 'text-gray-400'}`} size={12} />
                    </div>

                    {openDropdownId === 'pair-edit' && instrumentCat && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 shadow-card-lg rounded-xl z-[200] p-1.5 space-y-0.5 max-h-[180px] overflow-y-auto">
                        {instrumentCat.tags.map(tag => (
                          <button
                            key={tag.text}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditFormData({ ...editFormData, pair: tag.text, selections: { ...(editFormData.selections || {}), [instrumentCat.id]: [tag.text] } });
                              setOpenDropdownId(null);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex justify-between items-center ${editFormData.pair === tag.text ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                              }`}
                          >
                            {tag.text}
                            {editFormData.pair === tag.text && <Check size={11} className="text-accent-gain" />}
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

              {/* Strategy & Logic */}
              <div className="space-y-3">
                <SectionHeader title="Strategy & Logic" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {editStrategy?.layers.layer2.map(cat => <CategoryDropdown key={cat.id} cat={cat} />)}
                </div>
              </div>

              {/* Temporal & Risk */}
              <div className="space-y-3">
                <SectionHeader title="Temporal & Risk" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {editStrategy?.layers.layer3.map(cat => <CategoryDropdown key={cat.id} cat={cat} />)}
                </div>
              </div>

              {/* Reflection */}
              <div className="space-y-3">
                <SectionHeader title="Reflection" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Net P&L ($)</label>
                    <input
                      type="number" step="any"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg font-bold text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                      value={editFormData.pnl}
                      onChange={e => setEditFormData({ ...editFormData, pnl: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {editStrategy?.layers.layer4.map(cat => <CategoryDropdown key={cat.id} cat={cat} />)}
                  </div>
                  <div className="col-span-full space-y-1.5">
                    <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Notes / Reflection</label>
                    <textarea
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 min-h-[90px] resize-none leading-relaxed"
                      value={editFormData.reflection}
                      onChange={e => setEditFormData({ ...editFormData, reflection: e.target.value })}
                      placeholder="Add your trade reflection..."
                    />
                  </div>
                </div>
              </div>

              <div className="pb-4 pt-2">
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-3.5 text-sm font-semibold rounded-xl hover:bg-gray-800 active:scale-[0.99] transition-all"
                >
                  Save Changes
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-modal p-8 space-y-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 flex items-center justify-center rounded-2xl">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">Delete Trade?</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  This will permanently remove this trade record. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={closeModal}
                className="py-3.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="py-3.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all"
              >
                Delete
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