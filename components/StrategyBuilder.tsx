import React, { useState, useRef, useEffect } from 'react';
import { Strategy, Category, Tag } from '../types';
import { Plus, Trash2, Settings2, X, Hash, Layers, ChevronDown, Edit3, Check, AlertTriangle, Info } from 'lucide-react';

interface StrategyBuilderProps {
  strategies: Strategy[];
  activeStrategyId: string;
  onUpdateStrategy: (strategy: Strategy) => void;
}

const COLOR_OPTIONS = [
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#64748b'  // Slate
];

const StrategyParameters: React.FC<StrategyBuilderProps> = ({ strategies, activeStrategyId, onUpdateStrategy }) => {
  const [isAddingCategory, setIsAddingCategory] = useState<{ layer: keyof Strategy['layers'] } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);

  const activeStrategy = strategies.find(s => s.id === activeStrategyId);

  const handleAddCategory = () => {
    if (!activeStrategy) {
      setCategoryModalError("INITIALIZATION_FAILED: NO_ACTIVE_STRATEGY_MODEL. PLEASE CREATE A MODEL FIRST.");
      return;
    }
    
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setCategoryModalError("VALIDATION_ERROR: CATEGORY_IDENTIFIER_REQUIRED.");
      return;
    }

    if (trimmedName.length < 2) {
      setCategoryModalError("VALIDATION_ERROR: IDENTIFIER_TOO_SHORT. MINIMUM 2 CHARACTERS.");
      return;
    }

    if (!isAddingCategory) return;

    const nameUpper = trimmedName.toUpperCase();
    
    // Check for duplicates across all layers
    const allCategories = [
      ...activeStrategy.layers.layer1,
      ...activeStrategy.layers.layer2,
      ...activeStrategy.layers.layer3,
      ...activeStrategy.layers.layer4
    ];
    
    const isDuplicate = allCategories.some(cat => cat.name === nameUpper);
    
    if (isDuplicate) {
      setCategoryModalError(`DUPLICATE_ERROR: CATEGORY "${nameUpper}" ALREADY EXISTS IN THIS MODEL.`);
      return;
    }

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: nameUpper,
      tags: [],
      selectionType: 'single'
    };
    const updated = { ...activeStrategy };
    updated.layers[isAddingCategory.layer].push(newCat);
    onUpdateStrategy(updated);
    setNewCategoryName('');
    setIsAddingCategory(null);
    setCategoryModalError(null);
  };

  const handleAddTag = (layerKey: keyof Strategy['layers'], categoryId: string, tagText: string, color: string) => {
    if (!activeStrategy || !tagText) return;
    const updated = { ...activeStrategy };
    const cat = updated.layers[layerKey].find(c => c.id === categoryId);
    if (cat) {
      cat.tags.push({ text: tagText.toUpperCase(), color });
      onUpdateStrategy(updated);
    }
  };

  const removeTag = (layerKey: keyof Strategy['layers'], categoryId: string, tagIdx: number) => {
    if (!activeStrategy) return;
    const updated = { ...activeStrategy };
    const cat = updated.layers[layerKey].find(c => c.id === categoryId);
    if (cat) {
      cat.tags.splice(tagIdx, 1);
      onUpdateStrategy(updated);
    }
  };

  const toggleSelectionType = (layerKey: keyof Strategy['layers'], categoryId: string) => {
    if (!activeStrategy) return;
    const updated = { ...activeStrategy };
    const cat = updated.layers[layerKey].find(c => c.id === categoryId);
    if (cat) {
      cat.selectionType = cat.selectionType === 'single' ? 'multi' : 'single';
      onUpdateStrategy(updated);
    }
  };

  const removeCategory = (layerKey: keyof Strategy['layers'], categoryId: string) => {
    if (!activeStrategy) return;
    const updated = { ...activeStrategy };
    updated.layers[layerKey] = updated.layers[layerKey].filter(c => c.id !== categoryId);
    onUpdateStrategy(updated);
  };

  const LayerSection = ({ title, desc, layerKey }: { title: string, desc: string, layerKey: keyof Strategy['layers'] }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 bg-slate-800 border border-slate-700 flex items-center justify-center rounded-sm shrink-0">
          <Layers size={16} className="text-accent-gain" />
        </div>
        <div>
          <h3 className="text-[clamp(0.875rem,2.5vw,1rem)] font-bold text-slate-200 tracking-[0.2em] uppercase">{title}</h3>
          <p className="text-[clamp(0.5rem,1.5vw,0.625rem)] text-slate-600 font-mono uppercase tracking-tighter mt-0.5">{desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {activeStrategy?.layers[layerKey].map((cat) => (
          <div key={cat.id} className="bg-slate-800/40 border border-slate-700/50 p-5 md:p-6 rounded-sm flex flex-col group min-h-[220px] md:min-h-[240px] relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[clamp(0.6875rem,2vw,0.75rem)] font-bold text-slate-300 uppercase tracking-widest">{cat.name}</span>
                  <button 
                    onClick={() => toggleSelectionType(layerKey, cat.id)} 
                    className="text-[7px] md:text-[8px] bg-slate-700 px-1.5 py-0.5 border border-slate-600 rounded-sm text-slate-400 hover:text-slate-200 uppercase font-bold tracking-tighter"
                  >
                    {cat.selectionType}
                  </button>
                </div>
                <div className="text-[clamp(0.5rem,1.5vw,0.5625rem)] text-slate-600 font-mono uppercase tracking-tighter">Active_Identifier_Index</div>
              </div>
              {cat.name !== 'INSTRUMENT' && (
                <button onClick={() => removeCategory(layerKey, cat.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-accent-loss">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-wrap gap-2 content-start mb-6">
              {cat.tags.map((tag, tIdx) => (
                <div key={tIdx} className="bg-slate-900 px-3 py-1.5 flex items-center gap-2.5 border-l-2 shadow-sm" style={{ borderLeftColor: tag.color }}>
                  <span className="text-[clamp(0.5625rem,1.8vw,0.625rem)] font-mono text-slate-200 uppercase">{tag.text}</span>
                  <button onClick={() => removeTag(layerKey, cat.id, tIdx)} className="text-slate-600 hover:text-white transition-colors">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {cat.tags.length === 0 && <div className="text-[9px] md:text-[10px] text-slate-700 font-mono italic p-3 border border-dashed border-slate-700/50 w-full text-center uppercase">Empty_Node</div>}
            </div>

            <div className="mt-auto space-y-4 pt-4 border-t border-slate-700/30">
              <div className="flex bg-slate-900 border border-slate-700">
                <input 
                  className="flex-1 bg-transparent px-3 py-2.5 text-[clamp(0.625rem,2vw,0.6875rem)] text-slate-300 font-mono outline-none placeholder:text-slate-700"
                  placeholder="ADD PARAMETER..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      const color = input.getAttribute('data-active-color') || COLOR_OPTIONS[0];
                      handleAddTag(layerKey, cat.id, input.value, color);
                      input.value = '';
                    }
                  }}
                />
                <button 
                  className="w-10 h-10 md:w-11 md:h-11 bg-slate-200 text-slate-900 flex items-center justify-center hover:bg-white transition-colors shrink-0 border-l border-slate-700"
                  onClick={(e) => {
                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                    const color = input.getAttribute('data-active-color') || COLOR_OPTIONS[0];
                    handleAddTag(layerKey, cat.id, input.value, color);
                    input.value = '';
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button 
                    key={c}
                    className="w-4 h-4 rounded-full hover:scale-125 transition-transform"
                    style={{ backgroundColor: c }}
                    onClick={(e) => {
                      const input = (e.currentTarget.parentElement?.previousSibling as HTMLElement).querySelector('input');
                      if (input) input.setAttribute('data-active-color', c);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={() => { setCategoryModalError(null); setIsAddingCategory({ layer: layerKey }); }}
          className="bg-slate-800/10 border border-dashed border-slate-700/50 rounded-sm flex flex-col items-center justify-center gap-4 p-10 md:p-12 text-slate-600 hover:text-slate-300 hover:border-slate-500 transition-all group"
        >
          <div className="w-12 h-12 rounded-full border border-slate-700/50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <span className="text-[clamp(0.6875rem,2vw,0.75rem)] font-bold uppercase tracking-widest">Initialize_Node</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-8 md:space-y-12 pb-32 animate-slide-up">
        {/* Header Area */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-slate-800 pb-8 md:pb-10">
          <div>
            <h2 className="text-[clamp(1.875rem,5vw,3rem)] font-extrabold text-slate-100 tracking-tight mb-3 uppercase">Customize_Tags</h2>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[clamp(0.5rem,1.8vw,0.6875rem)] font-mono text-slate-500 uppercase tracking-widest">
              <span>STRATEGY PARAMETER INDEX</span>
              <span className="text-slate-700 hidden sm:inline">•</span>
              <span className="text-slate-300">{activeStrategy?.name || 'NULL'}</span>
            </div>
          </div>
        </div>

        {/* Layers Container */}
        <div className="space-y-12 md:space-y-20">
          <LayerSection 
            title="Layer_01 // Identity" 
            desc="Define instrument IDs and core asset identifiers." 
            layerKey="layer1" 
          />
          <LayerSection 
            title="Layer_02 // Strategy & Logic" 
            desc="Establish market bias, execution engines, and confluence signatures." 
            layerKey="layer2" 
          />
          <LayerSection 
            title="Layer_03 // Temporal & Risk" 
            desc="Set time window constraints and risk management parameters." 
            layerKey="layer3" 
          />
          <LayerSection 
            title="Layer_04 // Reflection" 
            desc="Post-execution data points and neural state tracking." 
            layerKey="layer4" 
          />
        </div>
      </div>

      {isAddingCategory && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-transparent backdrop-blur-sm" onClick={() => { setIsAddingCategory(null); setCategoryModalError(null); }} />
          <div className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-md border border-slate-800 p-8 space-y-8 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-100 uppercase tracking-widest">
                  <Layers size={16} className="text-accent-gain" />
                  Establish_Neural_Category
                </div>
                <div className="text-[9px] text-slate-500 font-mono uppercase tracking-tighter">
                  Layer: {isAddingCategory.layer} // Neural Node Initialization
                </div>
              </div>
              <button onClick={() => { setIsAddingCategory(null); setCategoryModalError(null); }} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>

            {categoryModalError && (
              <div className="bg-accent-loss/10 border border-accent-loss/30 p-4 flex gap-3 animate-slide-up">
                <AlertTriangle size={16} className="text-accent-loss shrink-0" />
                <p className="text-[9px] font-mono text-accent-loss leading-relaxed uppercase font-bold">
                  {categoryModalError}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Category Identifier</label>
              <input 
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 p-5 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                placeholder="E.G. LIQUIDITY_TYPE"
                value={newCategoryName}
                onChange={(e) => { setNewCategoryName(e.target.value); setCategoryModalError(null); }}
              />
            </div>

            <div className="bg-slate-850 p-4 border border-slate-800/50 flex gap-4">
              <div className="w-10 h-10 border border-amber-500/30 bg-amber-500/5 flex items-center justify-center shrink-0">
                <Hash size={16} className="text-amber-500" />
              </div>
              <p className="text-[9px] text-slate-500 font-mono leading-relaxed uppercase">
                Nodes initialized here will manifest as functional input layers within your execution logs.
              </p>
            </div>

            <button 
              onClick={handleAddCategory}
              className="w-full bg-slate-100 text-slate-900 py-6 text-[11px] font-extrabold uppercase tracking-widest hover:bg-white transition-all shadow-xl"
            >
              Commit_Category_Node
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StrategyParameters;