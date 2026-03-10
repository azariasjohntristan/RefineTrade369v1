import React, { useState, useRef, useEffect } from 'react';
import { Strategy, Category, Tag } from '../types';
import { Plus, Trash2, Settings2, X, Hash, Layers, ChevronDown, Edit3, Check, AlertTriangle, Info } from 'lucide-react';

interface StrategyBuilderProps {
  strategies: Strategy[];
  activeStrategyId: string;
  onUpdateStrategy: (strategy: Strategy) => void;
}

const COLOR_OPTIONS = [
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#64748b'  // Slate
];

const StrategyParameters: React.FC<StrategyBuilderProps> = ({ strategies, activeStrategyId, onUpdateStrategy }) => {
  const [isAddingCategory, setIsAddingCategory] = useState<{ layer: keyof Strategy['layers'] } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ layer: keyof Strategy['layers'], categoryId: string, name: string } | null>(null);

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

  const handleEditCategory = () => {
    if (!activeStrategy || !editingCategory) return;
    
    const trimmedName = editingCategory.name.trim();
    if (!trimmedName) {
      setCategoryModalError("VALIDATION_ERROR: CATEGORY_IDENTIFIER_REQUIRED.");
      return;
    }

    if (trimmedName.length < 2) {
      setCategoryModalError("VALIDATION_ERROR: IDENTIFIER_TOO_SHORT. MINIMUM 2 CHARACTERS.");
      return;
    }

    const nameUpper = trimmedName.toUpperCase();
    
    // Check for duplicates across all layers (excluding current category)
    const allCategories = [
      ...activeStrategy.layers.layer1,
      ...activeStrategy.layers.layer2,
      ...activeStrategy.layers.layer3,
      ...activeStrategy.layers.layer4
    ];
    
    const isDuplicate = allCategories.some(cat => cat.name === nameUpper && cat.id !== editingCategory.categoryId);
    
    if (isDuplicate) {
      setCategoryModalError(`DUPLICATE_ERROR: CATEGORY "${nameUpper}" ALREADY EXISTS IN THIS MODEL.`);
      return;
    }

    const updated = { ...activeStrategy };
    const cat = updated.layers[editingCategory.layer].find(c => c.id === editingCategory.categoryId);
    if (cat) {
      cat.name = nameUpper;
      onUpdateStrategy(updated);
    }
    setEditingCategory(null);
    setCategoryModalError(null);
  };

  const LayerSection = ({ title, desc, layerKey }: { title: string, desc: string, layerKey: keyof Strategy['layers'] }) => (
    <div className="space-y-5">
      {/* Layer Header Card */}
      <div className="bg-white rounded-2xl shadow-card p-5 hover:scale-[1.02] hover:shadow-xl hover:border hover:border-gray-200 transition-all duration-200 cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
            <Layers size={16} className="text-gray-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
            <p className="text-[11px] text-gray-500 font-mono uppercase tracking-wider mt-0.5">{desc}</p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {activeStrategy?.layers[layerKey].map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl shadow-card p-5 flex flex-col group min-h-[240px] relative hover:scale-[1.02] hover:shadow-xl hover:border hover:border-gray-200 transition-all duration-200 cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">{cat.name}</span>
                  <button 
                    onClick={() => toggleSelectionType(layerKey, cat.id)} 
                    className="text-[10px] bg-gray-100 rounded-md px-2 py-0.5 text-gray-500 hover:text-gray-700 uppercase font-semibold tracking-wider"
                  >
                    {cat.selectionType}
                  </button>
                </div>
                <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Parameter Index</div>
              </div>
              {cat.name !== 'INSTRUMENT' && (
                <div className="flex gap-1">
                  <button 
                    onClick={() => setEditingCategory({ layer: layerKey, categoryId: cat.id, name: cat.name })} 
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => removeCategory(layerKey, cat.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-wrap gap-2 content-start mb-4">
              {cat.tags.map((tag, tIdx) => (
                <div key={tIdx} className="px-3 py-1.5 flex items-center gap-2 rounded-md" 
                  style={{ backgroundColor: `${tag.color}15`, border: `1px solid ${tag.color}30` }}>
                  <span className="text-[11px] font-medium" style={{ color: tag.color }}>{tag.text}</span>
                  <button onClick={() => removeTag(layerKey, cat.id, tIdx)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {cat.tags.length === 0 && <div className="text-xs text-gray-400 font-mono italic p-4 border border-dashed border-gray-200 w-full text-center uppercase rounded-lg">Empty</div>}
            </div>

            <div className="mt-auto space-y-3 pt-3 border-t border-gray-100">
              <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <input 
                  className="flex-1 bg-transparent px-3 py-2.5 text-xs text-gray-700 font-medium outline-none placeholder:text-gray-400"
                  placeholder="Add parameter..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      const color = input.getAttribute('data-active-color') || COLOR_OPTIONS[0];
                      handleAddTag(layerKey, cat.id, input.value, color);
                      input.value = '';
                      input.focus();
                    }
                  }}
                />
                <button 
                  className="w-10 h-10 bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0 border-l border-gray-200"
                  onClick={(e) => {
                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                    const color = input.getAttribute('data-active-color') || COLOR_OPTIONS[0];
                    handleAddTag(layerKey, cat.id, input.value, color);
                    input.value = '';
                    input.focus();
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map(c => (
                  <button 
                    key={c}
                    className="w-4 h-4 rounded-full hover:scale-125 transition-transform ring-2 ring-transparent hover:ring-gray-200"
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

        {/* Add Category Button */}
        <button 
          onClick={() => { setCategoryModalError(null); setIsAddingCategory({ layer: layerKey }); }}
          className="bg-white rounded-2xl shadow-card p-5 flex flex-col items-center justify-center gap-3 min-h-[240px] text-gray-400 hover:text-gray-600 hover:shadow-card-lg hover:scale-[1.02] hover:border hover:border-gray-200 transition-all duration-200 group border-2 border-dashed border-gray-200 hover:border-gray-300"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={20} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Add Category</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-8 pb-20 animate-slide-up">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-[14px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-1">CORE_TERMINAL_V4 // ED-230934</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">STRATEGY BUILDER</h2>
          </div>
          <div className="text-right">
            <p className="text-[14px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
              ACTIVE STRATEGY <Settings2 size={10} className="text-accent-gain" />
            </p>
            <p className="text-3xl font-black text-gray-900 tracking-tight">{activeStrategy?.name || 'NULL'}</p>
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsAddingCategory(null); setCategoryModalError(null); }} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-modal p-6 space-y-5 animate-slide-up">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider">
                  <Layers size={14} className="text-gray-500" />
                  Establish Neural Category
                </div>
                <div className="text-[11px] text-gray-400 font-mono uppercase tracking-wider">
                  Layer {isAddingCategory.layer.replace('layer', '')} // Neural Node Initialization
                </div>
              </div>
              <button onClick={() => { setIsAddingCategory(null); setCategoryModalError(null); }} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>

            {categoryModalError && (
              <div className="bg-red-50 border border-red-100 p-4 flex gap-3 rounded-xl animate-slide-up">
                <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-mono text-red-500 leading-relaxed font-semibold">
                  {categoryModalError}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Category Identifier</label>
              <input 
                autoFocus
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 font-medium outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                placeholder="E.G. LIQUIDITY_TYPE"
                value={newCategoryName}
                onChange={(e) => { setNewCategoryName(e.target.value); setCategoryModalError(null); }}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl flex gap-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                <Hash size={14} className="text-amber-500" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Nodes initialized here will manifest as functional input layers within your execution logs.
              </p>
            </div>

            <button 
              onClick={handleAddCategory}
              className="w-full bg-gray-900 text-white py-3.5 text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all"
            >
              Commit Category Node
            </button>
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setEditingCategory(null); setCategoryModalError(null); }} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-modal p-6 space-y-5 animate-slide-up">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider">
                  <Edit3 size={14} className="text-gray-500" />
                  Edit Neural Category
                </div>
                <div className="text-[11px] text-gray-400 font-mono uppercase tracking-wider">
                  Layer {editingCategory.layer.replace('layer', '')} // Neural Node Modification
                </div>
              </div>
              <button onClick={() => { setEditingCategory(null); setCategoryModalError(null); }} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>

            {categoryModalError && (
              <div className="bg-red-50 border border-red-100 p-4 flex gap-3 rounded-xl animate-slide-up">
                <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-mono text-red-500 leading-relaxed font-semibold">
                  {categoryModalError}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Category Identifier</label>
              <input 
                autoFocus
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 font-medium outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                placeholder="E.G. LIQUIDITY_TYPE"
                value={editingCategory.name}
                onChange={(e) => { setEditingCategory({ ...editingCategory, name: e.target.value }); setCategoryModalError(null); }}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl flex gap-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                <Hash size={14} className="text-amber-500" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Nodes initialized here will manifest as functional input layers within your execution logs.
              </p>
            </div>

            <button 
              onClick={handleEditCategory}
              className="w-full bg-gray-900 text-white py-3.5 text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StrategyParameters;