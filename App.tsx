import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ScrollText, 
  BarChart2, 
  Settings,
  Bell,
  Search,
  Wifi,
  ChevronDown,
  X,
  Menu,
  Layers,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import StatCard from './components/StatCard';
import TradeTable from './components/TradeTable';
import TradeForm from './components/TradeForm';
import StrategyBuilder from './components/StrategyBuilder';
import AnalyticsView from './components/AnalyticsView';
import DashboardView from './components/DashboardView';
import SettingsView from './components/SettingsView';
import NotesView from './components/NotesView';
import AuthForm from './components/AuthForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { Trade, ViewState, Strategy, SubAccount, StrategyConfig } from './types';

const DEFAULT_STRATEGY: Strategy = {
  id: 'strat-default-sr',
  name: 'SUPPORT AND RESISTANCE',
  startingEquity: 10000,
  layers: {
    layer1: [
      {
        id: 'cat-instrument',
        name: 'INSTRUMENT',
        selectionType: 'single',
        tags: [
          { text: 'NQ', color: '#22c55e' },
          { text: 'ES', color: '#ef4444' }
        ]
      }
    ],
    layer2: [
      {
        id: 'cat-sr-logic',
        name: 'ZONE_IDENTIFIER',
        selectionType: 'multi',
        tags: [
          { text: 'MAJOR_S/R', color: '#8b5cf6' },
          { text: 'MINOR_S/R', color: '#22c55e' },
          { text: 'DYNAMIC_EMA', color: '#3b82f6' },
          { text: 'VBP_POC', color: '#f59e0b' }
        ]
      }
    ],
    layer3: [
      {
        id: 'cat-risk-mgt',
        name: 'RISK_PROTOCOL',
        selectionType: 'single',
        tags: [
          { text: 'FIXED_1%', color: '#10b981' },
          { text: 'SCALED_ENTRY', color: '#22c55e' },
          { text: 'AGGRESSIVE', color: '#f43f5e' }
        ]
      }
    ],
    layer4: [
      {
        id: 'cat-neural-state',
        name: 'PSYCH_INDEX',
        selectionType: 'single',
        tags: [
          { text: 'OPTIMAL_FLOW', color: '#10b981' },
          { text: 'HESITANT', color: '#f59e0b' },
          { text: 'FOMO_IMPULSE', color: '#f43f5e' }
        ]
      }
    ]
  },
  createdAt: new Date().toLocaleDateString()
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, profile, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoadingState, setAuthLoadingState] = useState(false);
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('trades');
    return saved ? JSON.parse(saved) : [];
  });
  const [strategies, setStrategies] = useState<Strategy[]>(() => {
    const saved = localStorage.getItem('strategies_v2');
    return saved ? JSON.parse(saved) : [DEFAULT_STRATEGY];
  });
  const [activeStrategyId, setActiveStrategyId] = useState<string>(() => {
    const saved = localStorage.getItem('activeStrategyId');
    return saved && strategies.find(s => s.id === saved) ? saved : (strategies[0]?.id || 'strat-default-sr');
  });
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [strategyConfigs, setStrategyConfigs] = useState<Record<string, StrategyConfig>>({});

  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false);
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Strategy | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Strategy | null>(null);
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [editWorkspaceEquity, setEditWorkspaceEquity] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceEquity, setNewWorkspaceEquity] = useState('10000');

  useEffect(() => {
    localStorage.setItem('trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('strategies_v2', JSON.stringify(strategies));
  }, [strategies]);

  useEffect(() => {
    localStorage.setItem('activeStrategyId', activeStrategyId);
  }, [activeStrategyId]);

  // Close sidebar on view change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeView]);

  // Load subAccounts from Supabase when user logs in
  useEffect(() => {
    if (user) {
      loadSubAccounts();
    } else {
      setSubAccounts([]);
    }
  }, [user]);

  // Load trades from Supabase when user logs in
  useEffect(() => {
    if (user) {
      loadTrades();
    }
  }, [user]);

  // Realtime subscription for profile changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          console.log('Profile changed:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadSubAccounts() {
    const { data: subAccountsData } = await supabase
      .from('sub_accounts')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: true });
    
    if (subAccountsData && subAccountsData.length > 0) {
      // Load strategy configs for all subaccounts
      const subAccountIds = subAccountsData.map(sa => sa.id);
      const { data: configsData } = await supabase
        .from('strategy_configs')
        .select('*')
        .in('sub_account_id', subAccountIds);

      // Build configs map
      const configsMap: Record<string, StrategyConfig> = {};
      if (configsData) {
        configsData.forEach(config => {
          // Parse layers if it's a string
          const parsedLayers = typeof config.layers === 'string' 
            ? JSON.parse(config.layers) 
            : config.layers;
          configsMap[config.sub_account_id] = {
            ...config,
            layers: parsedLayers
          };
        });
      }
      setStrategyConfigs(configsMap);

      // Convert sub_accounts to strategies format (merge with config layers if exists)
      const convertedStrategies = subAccountsData.map(sa => {
        const config = configsMap[sa.id];
        return {
          id: sa.id,
          name: sa.name,
          startingEquity: sa.starting_equity,
          layers: config?.layers || DEFAULT_STRATEGY.layers,
          createdAt: new Date(sa.created_at).toLocaleDateString()
        };
      });
      setStrategies(convertedStrategies);
      setSubAccounts(subAccountsData);
      
      // Set first workspace as active if none selected
      if (!activeStrategyId || !subAccountsData.find(s => s.id === activeStrategyId)) {
        setActiveStrategyId(subAccountsData[0].id);
      }
    } else {
      // First login - create default workspace
      await createDefaultWorkspace();
    }
  }

  async function createDefaultWorkspace() {
    const { data, error } = await supabase
      .from('sub_accounts')
      .insert({
        user_id: user?.id,
        name: 'SUPPORT AND RESISTANCE',
        starting_equity: 10000,
        timezone: 'UTC'
      })
      .select()
      .single();

    if (data && !error) {
      const freshLayers = {
        layer1: DEFAULT_STRATEGY.layers.layer1,
        layer2: [],
        layer3: [],
        layer4: []
      };

      // Create strategy config in Supabase
      const { data: configData } = await supabase
        .from('strategy_configs')
        .insert({
          sub_account_id: data.id,
          name: data.name,
          layers: freshLayers
        })
        .select()
        .single();

      // Update strategy config state
      if (configData) {
        setStrategyConfigs({ [data.id]: configData });
      }

      const freshStrategy = {
        ...DEFAULT_STRATEGY,
        id: data.id,
        name: data.name,
        startingEquity: data.starting_equity,
        layers: freshLayers
      };
      setStrategies([freshStrategy]);
      setActiveStrategyId(data.id);
      setSubAccounts([data]);
    }
  }

  async function loadTrades() {
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      // Map sub_account_id to strategyId for local state
      const mappedTrades: Trade[] = data.map(t => ({
        id: t.id,
        time: t.time,
        pair: t.pair,
        type: t.type,
        size: t.size,
        entry: t.entry,
        exit: t.exit,
        pnl: t.pnl,
        status: t.status,
        notes: t.notes,
        reflection: t.reflection,
        selections: t.selections,
        screenshots: t.screenshots,
        strategyId: t.sub_account_id
      }));
      setTrades(mappedTrades);
    }
  }

  const handleAuth = async (email: string, password: string, name?: string) => {
    setAuthError(null);
    setAuthLoadingState(true);
    
    const { error } = authMode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, name || 'Trader');
    
    if (error) {
      setAuthError(error.message);
    }
    setAuthLoadingState(false);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400 font-mono text-xs uppercase tracking-widest">Loading...</div>
      </div>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return (
      <AuthForm
        mode={authMode}
        onSubmit={handleAuth}
        onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        loading={authLoadingState}
        error={authError}
      />
    );
  }

  const handleAddTrade = async (newTradeData: Omit<Trade, 'id' | 'status'>) => {
    if (!user || !activeStrategyId) return;

    const newTrade: Trade = {
      ...newTradeData,
      id: `t${Date.now()}`,
      status: newTradeData.pnl >= 0 ? 'gain' : 'loss',
      strategyId: activeStrategyId
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        sub_account_id: activeStrategyId,
        time: newTradeData.time,
        pair: newTradeData.pair,
        type: newTradeData.type,
        size: newTradeData.size,
        entry: newTradeData.entry,
        exit: newTradeData.exit,
        pnl: newTradeData.pnl,
        status: newTrade.status,
        notes: newTradeData.notes,
        reflection: newTradeData.reflection,
        selections: newTradeData.selections,
        screenshots: newTradeData.screenshots
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding trade:', error);
      return;
    }

    if (data) {
      const savedTrade: Trade = {
        id: data.id,
        time: data.time,
        pair: data.pair,
        type: data.type,
        size: data.size,
        entry: data.entry,
        exit: data.exit,
        pnl: data.pnl,
        status: data.status,
        notes: data.notes,
        reflection: data.reflection,
        selections: data.selections,
        screenshots: data.screenshots,
        strategyId: data.sub_account_id
      };
      setTrades([savedTrade, ...trades]);
    }
  };

  const handleUpdateTrade = async (updatedTrade: Trade) => {
    // Update in Supabase
    const { error } = await supabase
      .from('trades')
      .update({
        time: updatedTrade.time,
        pair: updatedTrade.pair,
        type: updatedTrade.type,
        size: updatedTrade.size,
        entry: updatedTrade.entry,
        exit: updatedTrade.exit,
        pnl: updatedTrade.pnl,
        status: updatedTrade.pnl >= 0 ? 'gain' : 'loss',
        notes: updatedTrade.notes,
        reflection: updatedTrade.reflection,
        selections: updatedTrade.selections,
        screenshots: updatedTrade.screenshots
      })
      .eq('id', updatedTrade.id);

    if (error) {
      console.error('Error updating trade:', error);
      return;
    }

    setTrades(trades.map(t => t.id === updatedTrade.id ? {
      ...updatedTrade,
      status: updatedTrade.pnl >= 0 ? 'gain' : 'loss'
    } : t));
  };

  const handleDeleteTrade = async (id: string) => {
    // Delete from Supabase
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting trade:', error);
      return;
    }

    setTrades(trades.filter(t => t.id !== id));
  };

  const handleAddStrategy = (newStrat: Strategy) => {
    setStrategies([...strategies, newStrat]);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName) return;

    // Create in Supabase first
    const { data, error } = await supabase
      .from('sub_accounts')
      .insert({
        user_id: user?.id,
        name: newWorkspaceName,
        starting_equity: parseFloat(newWorkspaceEquity) || 10000,
        timezone: 'UTC'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workspace:', error);
      return;
    }

    if (data) {
      const freshLayers = {
        layer1: DEFAULT_STRATEGY.layers.layer1,  // Keep instrument
        layer2: [],  // Clear
        layer3: [],  // Clear
        layer4: []   // Clear
      };

      // Create strategy config in Supabase
      const { data: configData } = await supabase
        .from('strategy_configs')
        .insert({
          sub_account_id: data.id,
          name: newWorkspaceName,
          layers: freshLayers
        })
        .select()
        .single();

      // Update strategy config state
      if (configData) {
        setStrategyConfigs(prev => ({ ...prev, [data.id]: configData }));
      }
      
      const newModel: Strategy = {
        id: data.id,
        name: newWorkspaceName,
        startingEquity: parseFloat(newWorkspaceEquity) || 10000,
        layers: freshLayers,
        createdAt: new Date().toLocaleDateString()
      };

      handleAddStrategy(newModel);
      setActiveStrategyId(data.id);
      setSubAccounts([...subAccounts, data]);
    }
    
    setNewWorkspaceName('');
    setNewWorkspaceEquity('10000');
    setIsAddingWorkspace(false);
  };

  const handleDeleteStrategy = async (id: string) => {
    // Don't allow deleting if it's the last one
    if (subAccounts.length <= 1) return;
    
    // Delete from Supabase (sub_accounts, strategy_configs - cascade will handle config)
    const { error } = await supabase
      .from('sub_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting workspace:', error);
      return;
    }

    // Update strategy configs state
    const newConfigs = { ...strategyConfigs };
    delete newConfigs[id];
    setStrategyConfigs(newConfigs);

    setStrategies(strategies.filter(s => s.id !== id));
    setTrades(trades.filter(t => t.strategyId !== id));
    setSubAccounts(subAccounts.filter(sa => sa.id !== id));
    
    if (activeStrategyId === id) {
      const remaining = strategies.filter(s => s.id !== id);
      setActiveStrategyId(remaining[0]?.id || subAccounts[0]?.id);
    }
  };

  const handleUpdateStrategy = async (updated: Strategy) => {
    // Update sub_account in Supabase
    const { error } = await supabase
      .from('sub_accounts')
      .update({
        name: updated.name,
        starting_equity: updated.startingEquity
      })
      .eq('id', updated.id);

    if (error) {
      console.error('Error updating workspace:', error);
      return;
    }

    // Also update strategy_config (layers/tags) in Supabase
    // First try to update, if not found then insert
    const { data: existingConfig } = await supabase
      .from('strategy_configs')
      .select('id')
      .eq('sub_account_id', updated.id)
      .single();

    let configError = null;
    
    if (existingConfig) {
      // Update existing config
      const { error } = await supabase
        .from('strategy_configs')
        .update({
          name: updated.name,
          layers: JSON.stringify(updated.layers),
          updated_at: new Date().toISOString()
        })
        .eq('sub_account_id', updated.id);
      configError = error;
    } else {
      // Insert new config
      const { error } = await supabase
        .from('strategy_configs')
        .insert({
          sub_account_id: updated.id,
          name: updated.name,
          layers: JSON.stringify(updated.layers)
        });
      configError = error;
    }

    if (configError) {
      console.error('Error updating strategy config:', configError);
    }

    // Update strategy config state
    const configData = {
      id: updated.id,
      sub_account_id: updated.id,
      name: updated.name,
      layers: updated.layers,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setStrategyConfigs(prev => ({ ...prev, [updated.id]: configData }));

    setStrategies(strategies.map(s => s.id === updated.id ? updated : s));
    
    // Also update in subAccounts state
    setSubAccounts(subAccounts.map(sa => 
      sa.id === updated.id 
        ? { ...sa, name: updated.name, starting_equity: updated.startingEquity }
        : sa
    ));
  };

  const handleUpdateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToEdit) return;
    
    const updated: Strategy = {
      ...workspaceToEdit,
      name: editWorkspaceName,
      startingEquity: parseFloat(editWorkspaceEquity) || workspaceToEdit.startingEquity
    };
    
    handleUpdateStrategy(updated);
    setIsEditingWorkspace(false);
    setWorkspaceToEdit(null);
  };

  // Derived stats
  const activeStrategy = strategies.find(s => s.id === activeStrategyId) || strategies[0];
  const activeSubAccount = subAccounts.find(sa => sa.id === activeStrategyId);
  const filteredTrades = trades.filter(t => t.strategyId === activeStrategyId);
  
  const totalPnLValue = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
  const winCount = filteredTrades.filter(t => t.status === 'gain').length;
  const winRate = filteredTrades.length > 0 ? (winCount / filteredTrades.length * 100).toFixed(1) : '0';
  const totalEquityValue = (activeStrategy?.startingEquity || 10000) + totalPnLValue;
  const totalEquity = totalEquityValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // Default trading rules
  const DEFAULT_RULES = [
    "Wait for 5m candle close for confirmation",
    "No trades 15m before/after high impact news",
    "Max 3 losses per day - hard stop",
    "Risk max 1% per execution",
    "Always set hard stop loss at entry"
  ];

  const handleRulesChange = async (newRules: string[]) => {
    if (!activeStrategyId) return;
    
    const { error } = await supabase
      .from('sub_accounts')
      .update({ rules: newRules })
      .eq('id', activeStrategyId);

    if (!error) {
      setSubAccounts(subAccounts.map(sa => 
        sa.id === activeStrategyId 
          ? { ...sa, rules: newRules }
          : sa
      ));
    }
  };

  const currentRules = activeSubAccount?.rules !== undefined 
    ? activeSubAccount.rules 
    : DEFAULT_RULES;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-screen bg-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar / Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 w-[280px] z-[100] bg-white flex flex-col p-6 transition-transform duration-300 md:relative md:translate-x-0 border-r border-gray-200
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent-gain shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            <div className="text-[13px] tracking-[0.35em] uppercase font-black text-gray-900">
              REFINE TRADE
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-900">
            <X size={20} />
          </button>
        </div>

        {/* Mobile Header Actions in Sidebar */}
        <div className="md:hidden flex items-center gap-3 mb-8 pb-8 border-b border-gray-100">
          <div className="flex-1 flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <Search size={15} className="text-gray-400" />
            <span className="text-[13px] font-mono text-gray-300 uppercase tracking-widest">Search...</span>
          </div>
          <button className="relative p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-400">
            <Bell size={15} />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {/* Mobile Add Trade Button */}
          <div className="md:hidden mb-5">
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-trade-form'));
              }}
              className="w-full bg-gray-900 text-white py-3 rounded-xl text-[13px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
            >
              <Plus size={15} /> New Trade
            </button>
          </div>

          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'log', label: 'Trade Log', icon: ScrollText },
            { id: 'strategy', label: 'Strategy Builder', icon: Layers },
            { id: 'analytics', label: 'Analytics', icon: BarChart2 },
            { id: 'notes', label: 'Notes', icon: FileText },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                onClick={() => setActiveView(item.id as ViewState)}
                className={`
                  px-4 py-2.5 rounded-xl text-sm flex items-center gap-3 cursor-pointer transition-all
                  ${activeView === item.id 
                    ? 'bg-gray-100 text-gray-900 font-semibold' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-medium'
                  }
                `}
              >
                <Icon size={16} className={activeView === item.id ? 'text-gray-800' : 'text-gray-400'} />
                <span>{item.label}</span>
              </div>
            );
          })}

        </nav>

        {/* User info at bottom of sidebar */}
        {profile && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-[11px] font-black text-white uppercase">
                {profile.name?.charAt(0) || 'T'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 truncate">{profile.name || 'Trader'}</p>
                <p className="text-[11px] text-gray-400 truncate">{profile.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col h-full min-h-0 bg-gray-100 relative overflow-hidden">
        
        {/* Header */}
        <header className="flex h-14 md:h-16 items-center justify-between px-4 md:px-8 shrink-0 border-b border-gray-200/80 bg-white/90 backdrop-blur-md z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-gray-900 p-1">
              <Menu size={22} />
            </button>
            <div className="font-mono text-[10px] text-gray-400 tracking-[0.25em] uppercase truncate max-w-[160px] sm:max-w-none">
              {activeView === 'dashboard' ? 'SYSTEM / OVERVIEW' : `SYSTEM / ${activeView.toUpperCase()}`}
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden md:flex items-center gap-4">
               <Search size={16} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
               <Bell size={16} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
            </div>
            <div className="hidden md:block h-4 w-px bg-gray-200"></div>
            
            {/* Profile & Strategy Switcher Dropdown */}
            <div className="relative group">
              <div className="flex items-center gap-2 text-sm cursor-pointer">
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-[11px] font-black text-white uppercase">
                  {profile?.name?.charAt(0) || 'T'}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-[13px] font-semibold text-gray-800 truncate max-w-[110px]">
                    {profile?.name || 'Trader'}
                  </span>
                  <span className="text-[11px] text-gray-400">{activeStrategy?.name || 'Workspace'}</span>
                </div>
                <ChevronDown size={13} className="text-gray-400 transition-transform group-hover:rotate-180" />
              </div>

              {/* Dropdown Menu */}
              <div className="absolute top-full right-0 mt-3 w-72 bg-white border border-gray-100 shadow-card-lg rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-[12px] font-black text-white uppercase">
                      {profile?.name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{profile?.name || 'Trader'}</p>
                      <p className="text-xs text-gray-400">{profile?.email}</p>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Switch Workspace</p>
                </div>
                
                <div className="max-h-56 overflow-y-auto">
                  {strategies.map(s => (
                    <div 
                      key={s.id}
                      className={`group/row px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${activeStrategyId === s.id ? 'bg-green-50' : ''}`}
                    >
                      <div className="flex flex-col flex-1" onClick={() => setActiveStrategyId(s.id)}>
                        <span className={`text-sm font-semibold ${activeStrategyId === s.id ? 'text-accent-gain' : 'text-gray-800'}`}>
                          {s.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          ${(s.startingEquity ?? 10000).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setWorkspaceToEdit(s);
                            setEditWorkspaceName(s.name);
                            setEditWorkspaceEquity((s.startingEquity ?? 10000).toString());
                            setIsEditingWorkspace(true);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-700"
                        >
                          <Edit3 size={12} />
                        </button>
                        {s.id !== 'strat-default-sr' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setWorkspaceToDelete(s);
                              setIsDeletingWorkspace(true);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      {activeStrategyId === s.id && <div className="w-1.5 h-1.5 rounded-full bg-accent-gain"></div>}
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-gray-100 space-y-1">
                  <button 
                    onClick={() => setIsAddingWorkspace(true)}
                    className="w-full text-left px-3 py-2 text-sm text-accent-gain hover:bg-green-50 rounded-lg transition-all flex items-center gap-2 font-medium"
                  >
                    <Plus size={13} /> New Workspace
                  </button>
                  <button 
                    onClick={() => setActiveView('settings')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all font-medium"
                  >
                    Settings
                  </button>
                  <button 
                    onClick={() => signOut()}
                    className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-all font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-5 md:space-y-6 pb-24 md:pb-20">
            {activeView === 'dashboard' && (
              <DashboardView trades={filteredTrades} startingEquity={activeStrategy?.startingEquity || 10000} rules={currentRules} onRulesChange={handleRulesChange} />
            )}
            
            {activeView === 'log' && (
                <div className="animate-slide-up">
                    <TradeTable trades={filteredTrades} strategies={strategies} activeStrategyId={activeStrategyId} onUpdateTrade={handleUpdateTrade} onDeleteTrade={handleDeleteTrade} showTitle={true} />
                </div>
            )}

            {activeView === 'strategy' && (
              <StrategyBuilder 
                strategies={strategies} 
                activeStrategyId={activeStrategyId}
                onUpdateStrategy={handleUpdateStrategy}
              />
            )}

            {activeView === 'analytics' && (
              <AnalyticsView trades={filteredTrades} strategies={strategies} activeStrategyId={activeStrategyId} />
            )}

            {activeView === 'notes' && (
              <NotesView 
                userId={user?.id}
                subAccounts={subAccounts}
                activeStrategyId={activeStrategyId}
                strategies={strategies}
              />
            )}

            {activeView === 'settings' && (
              <SettingsView 
                profile={profile}
                userId={user?.id}
                subAccounts={subAccounts}
                trades={trades}
                onProfileUpdate={(updatedProfile) => {
                  // Profile is updated via AuthContext
                }}
                onSignOut={signOut}
              />
            )}


          </div>
        </main>

        {/* Trade Form Trigger */}
        <TradeForm onAddTrade={handleAddTrade} strategies={strategies} />

        {/* Workspace Edit Modal */}
        {isEditingWorkspace && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsEditingWorkspace(false)} />
            <form onSubmit={handleUpdateWorkspace} className="relative w-full max-w-md bg-white rounded-2xl p-8 space-y-6 shadow-modal animate-slide-up">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-900">Edit Workspace</h3>
                <button type="button" onClick={() => setIsEditingWorkspace(false)} className="text-gray-400 hover:text-gray-700 p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Workspace Name</label>
                  <input 
                    autoFocus
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    value={editWorkspaceName}
                    onChange={(e) => setEditWorkspaceName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Starting Equity ($)</label>
                  <input 
                    type="number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    value={editWorkspaceEquity}
                    onChange={(e) => setEditWorkspaceEquity(e.target.value)}
                  />
                </div>
              </div>
              <button className="w-full bg-gray-900 text-white py-3 text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all">Save Changes</button>
            </form>
          </div>
        )}

        {/* Workspace Add Modal */}
        {isAddingWorkspace && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsAddingWorkspace(false)} />
            <form onSubmit={handleCreateWorkspace} className="relative w-full max-w-md bg-white rounded-2xl p-8 space-y-6 shadow-modal animate-slide-up">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-900">New Workspace</h3>
                <button type="button" onClick={() => setIsAddingWorkspace(false)} className="text-gray-400 hover:text-gray-700 p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Workspace Name</label>
                  <input 
                    autoFocus
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    placeholder="e.g. Scalping Strategy"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Starting Equity ($)</label>
                  <input 
                    type="number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    placeholder="10000"
                    value={newWorkspaceEquity}
                    onChange={(e) => setNewWorkspaceEquity(e.target.value)}
                  />
                </div>
              </div>
              <button className="w-full bg-gray-900 text-white py-3 text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all">Create Workspace</button>
            </form>
          </div>
        )}

        {/* Workspace Delete Confirmation Modal */}
        {isDeletingWorkspace && workspaceToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsDeletingWorkspace(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl p-8 space-y-6 shadow-modal animate-slide-up">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-red-50 flex items-center justify-center rounded-2xl">
                  <AlertTriangle size={28} className="text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">Delete Workspace?</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    This will permanently delete <span className="font-semibold text-gray-700">{workspaceToDelete.name}</span> and all its trade data. This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setIsDeletingWorkspace(false)}
                  className="py-3 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleDeleteStrategy(workspaceToDelete.id);
                    setIsDeletingWorkspace(false);
                  }}
                  className="py-3 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;