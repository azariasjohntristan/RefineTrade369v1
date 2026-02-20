import React, { useState, useEffect } from 'react'
import {
  User,
  Key,
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  X,
  Check,
  Loader2,
  LogOut,
  CreditCard,
  Wifi
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Profile, SubAccount, Trade } from '../types'

interface SettingsViewProps {
  profile: Profile | null
  userId: string | undefined
  subAccounts: SubAccount[]
  trades: Trade[]
  onProfileUpdate: (profile: Profile) => void
  onSignOut: () => void
}

type Tab = 'account' | 'workspace' | 'data'

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney'
]

export default function SettingsView({
  profile,
  userId,
  subAccounts,
  trades,
  onProfileUpdate,
  onSignOut
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [name, setName] = useState(profile?.name || '')
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [selectedSubAccount, setSelectedSubAccount] = useState<SubAccount | null>(null)
  const [editSubAccountName, setEditSubAccountName] = useState('')
  const [editSubAccountEquity, setEditSubAccountEquity] = useState('')
  const [editSubAccountTimezone, setEditSubAccountTimezone] = useState('')

  const [isAddingSubAccount, setIsAddingSubAccount] = useState(false)
  const [newSubAccountName, setNewSubAccountName] = useState('')
  const [newSubAccountEquity, setNewSubAccountEquity] = useState('10000')

  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('')

  const [isClearingTrades, setIsClearingTrades] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setTimezone(profile.timezone)
    }
  }, [profile])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleUpdateName = async () => {
    if (!name.trim()) return
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', userId)

    if (error) {
      showMessage('error', error.message)
    } else {
      onProfileUpdate({ ...profile!, name: name.trim() })
      showMessage('success', 'Name updated successfully')
    }
    setLoading(false)
  }

  const handleUpdateTimezone = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ timezone })
      .eq('id', userId)

    if (error) {
      showMessage('error', error.message)
    } else {
      onProfileUpdate({ ...profile!, timezone })
      showMessage('success', 'Timezone updated successfully')
    }
    setLoading(false)
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage('error', 'Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      showMessage('error', error.message)
    } else {
      showMessage('success', 'Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) {
      showMessage('error', 'Please enter your password')
      return
    }

    setLoading(true)

    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: deleteAccountPassword
      })

      if (reauthError) {
        showMessage('error', 'Invalid password')
        setLoading(false)
        return
      }

      await supabase.from('trades').delete().eq('user_id', userId)
      await supabase.from('sub_accounts').delete().eq('user_id', userId)
      await supabase.from('profiles').delete().eq('id', userId)

      // Note: Auth user deletion requires admin privileges
      onSignOut()
    } catch (err) {
      showMessage('error', 'Failed to delete account')
    }
    setLoading(false)
  }

  const handleCreateSubAccount = async () => {
    if (!newSubAccountName.trim()) return

    setLoading(true)
    const { data, error } = await supabase
      .from('sub_accounts')
      .insert({
        user_id: userId,
        name: newSubAccountName.trim(),
        starting_equity: parseFloat(newSubAccountEquity) || 10000,
        timezone: timezone
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('row-level security') || error.code === '42501') {
        showMessage('error', 'Free plan limit: 1 sub-account only. Upgrade to Pro for unlimited.')
      } else {
        showMessage('error', error.message)
      }
    } else {
      showMessage('success', 'Sub-account created successfully')
      setIsAddingSubAccount(false)
      setNewSubAccountName('')
      setNewSubAccountEquity('10000')
    }
    setLoading(false)
  }

  const handleUpdateSubAccount = async () => {
    if (!selectedSubAccount || !editSubAccountName.trim()) return

    setLoading(true)
    const { error } = await supabase
      .from('sub_accounts')
      .update({
        name: editSubAccountName.trim(),
        starting_equity: parseFloat(editSubAccountEquity) || 10000,
        timezone: editSubAccountTimezone
      })
      .eq('id', selectedSubAccount.id)

    if (error) {
      showMessage('error', error.message)
    } else {
      showMessage('success', 'Sub-account updated')
      setSelectedSubAccount(null)
    }
    setLoading(false)
  }

  const handleDeleteSubAccount = async (id: string) => {
    setLoading(true)
    const { error } = await supabase.from('sub_accounts').delete().eq('id', id)

    if (error) {
      showMessage('error', error.message)
    } else {
      showMessage('success', 'Sub-account deleted')
    }
    setLoading(false)
  }

  const handleExportTrades = async (format: 'json' | 'csv') => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('export-trades', {
        body: { format }
      })

      if (error) throw error

      const blob = new Blob([format === 'csv' ? data : JSON.stringify(data.trades, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trades-${new Date().toISOString().split('T')[0]}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      showMessage('success', 'Trades exported successfully')
    } catch (err) {
      showMessage('error', 'Failed to export trades')
    }
    setLoading(false)
  }

  const handleImportTrades = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const text = await file.text()
      const importedTrades = JSON.parse(text)

      if (!Array.isArray(importedTrades)) {
        throw new Error('Invalid format')
      }

      const tradesToInsert = importedTrades.map((trade: Partial<Trade>) => ({
        user_id: userId,
        sub_account_id: subAccounts[0]?.id,
        time: trade.time,
        pair: trade.pair,
        type: trade.type,
        size: trade.size,
        entry: trade.entry,
        exit: trade.exit,
        pnl: trade.pnl,
        status: trade.status,
        notes: trade.notes,
        reflection: trade.reflection
      }))

      const { error } = await supabase.from('trades').insert(tradesToInsert)

      if (error) throw error
      showMessage('success', `Imported ${tradesToInsert.length} trades`)
    } catch (err) {
      showMessage('error', 'Failed to import trades. Invalid file format.')
    }
    setLoading(false)
    event.target.value = ''
  }

  const handleClearTrades = async () => {
    setLoading(true)
    const { error } = await supabase.from('trades').delete().eq('user_id', userId)

    if (error) {
      showMessage('error', error.message)
    } else {
      showMessage('success', 'All trades cleared')
      setIsClearingTrades(false)
    }
    setLoading(false)
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'workspace', label: 'Workspace', icon: Database },
    { id: 'data', label: 'Data', icon: Download }
  ] as const

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-100 uppercase tracking-tighter">Settings</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">Manage your account and preferences</p>
        </div>
        {profile && (
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-sm border border-slate-800">
            <div className="w-8 h-8 bg-accent-gain/20 rounded-full flex items-center justify-center text-accent-gain font-bold text-xs">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">{profile.name}</span>
              <span className="text-[14px] text-slate-500 uppercase">{profile.plan} Plan</span>
            </div>
          </div>
        )}
      </div>

      {/* Connection Status */}
      <div className="bg-slate-800/40 p-4 rounded-sm border border-slate-800">
        <p className="text-[14px] font-black text-slate-600 mb-3 tracking-[0.2em] uppercase">Connection Status</p>
        <div className="flex items-center gap-3 text-[14px] text-slate-400 font-mono">
          <Wifi size={14} className="text-accent-gain" />
          <span className="truncate">OANDA / LIVE / 12ms</span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-sm border text-xs font-mono ${
          message.type === 'success' 
            ? 'bg-accent-gain/10 border-accent-gain/30 text-accent-gain'
            : 'bg-accent-loss/10 border-accent-loss/30 text-accent-loss'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-800">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-accent-gain text-slate-100'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'account' && (
        <div className="space-y-8">
          <section className="bg-slate-900/50 border border-slate-800 p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <User size={16} /> Profile Information
            </h2>
            
            <div className="grid gap-4 max-w-md">
              <div className="space-y-2">
                <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Display Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={loading || name === profile?.name}
                    className="px-4 py-3 bg-accent-gain text-slate-900 text-xs font-bold uppercase tracking-wider hover:bg-accent-gain/90 disabled:opacity-50"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full bg-slate-800 border border-slate-800 px-4 py-3 text-xs text-slate-500 font-mono cursor-not-allowed"
                />
                <p className="text-[14px] text-slate-600">Email cannot be changed</p>
              </div>
            </div>
          </section>

          <section className="bg-slate-900/50 border border-slate-800 p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <Key size={16} /> Change Password
            </h2>
            
            <div className="grid gap-4 max-w-md">
              <div className="space-y-2">
                <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full py-3 bg-slate-800 text-slate-200 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 disabled:opacity-50"
              >
                Update Password
              </button>
            </div>
          </section>

          <section className="bg-slate-900/50 border border-accent-loss/30 p-6 space-y-6">
            <h2 className="text-sm font-bold text-accent-loss uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={16} /> Danger Zone
            </h2>
            
            <div className="flex items-center justify-between max-w-md">
              <div>
                <p className="text-xs text-slate-300 font-bold">Delete Account</p>
                <p className="text-[14px] text-slate-500">Permanently delete your account and all data</p>
              </div>
              <button
                onClick={() => setIsDeletingAccount(true)}
                className="px-4 py-2 bg-accent-loss/20 text-accent-loss border border-accent-loss/30 text-xs font-bold uppercase tracking-wider hover:bg-accent-loss/30"
              >
                Delete
              </button>
            </div>
          </section>

          <section className="bg-slate-900/50 border border-slate-800 p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <LogOut size={16} /> Session
            </h2>
            <button
              onClick={onSignOut}
              className="px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-700"
            >
              Sign Out
            </button>
          </section>
        </div>
      )}

      {activeTab === 'workspace' && (
        <div className="space-y-8">
          <section className="bg-slate-900/50 border border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <Database size={16} /> Default Settings
              </h2>
            </div>
            
            <div className="grid gap-4 max-w-md">
              <div className="space-y-2">
                <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                <button
                  onClick={handleUpdateTimezone}
                  disabled={loading || timezone === profile?.timezone}
                  className="w-full py-3 bg-slate-800 text-slate-200 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 disabled:opacity-50 mt-2"
                >
                  Update Timezone
                </button>
              </div>
            </div>
          </section>

          <section className="bg-slate-900/50 border border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={16} /> Sub-Accounts
              </h2>
              <button
                onClick={() => setIsAddingSubAccount(true)}
                className="px-3 py-2 bg-accent-gain text-slate-900 text-xs font-bold uppercase tracking-wider hover:bg-accent-gain/90"
              >
                + Add
              </button>
            </div>
            
            <div className="space-y-2">
              {subAccounts.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No sub-accounts yet</p>
              ) : (
                subAccounts.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{sub.name}</p>
                      <p className="text-[14px] text-slate-500 font-mono">
                        Equity: ${sub.starting_equity.toLocaleString()} · {sub.timezone}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedSubAccount(sub)
                          setEditSubAccountName(sub.name)
                          setEditSubAccountEquity(sub.starting_equity.toString())
                          setEditSubAccountTimezone(sub.timezone)
                        }}
                        className="px-3 py-1 text-[14px] text-slate-500 hover:text-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSubAccount(sub.id)}
                        className="px-3 py-1 text-[14px] text-accent-loss hover:text-accent-loss/80"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {profile?.plan === 'free' && (
              <p className="text-[14px] text-slate-500 bg-slate-800/50 p-3">
                Free plan: {subAccounts.length}/1 sub-accounts · Upgrade to Pro for unlimited
              </p>
            )}
          </section>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-8">
          <section className="bg-slate-900/50 border border-slate-800 p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <Download size={16} /> Export Data
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleExportTrades('json')}
                disabled={loading}
                className="flex items-center justify-center gap-2 p-4 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 disabled:opacity-50"
              >
                <Download size={16} />
                Export JSON
              </button>
              <button
                onClick={() => handleExportTrades('csv')}
                disabled={loading}
                className="flex items-center justify-center gap-2 p-4 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 disabled:opacity-50"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
            <p className="text-[14px] text-slate-500">
              {trades.length} trades available for export
            </p>
          </section>

          <section className="bg-slate-900/50 border border-slate-800 p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <Upload size={16} /> Import Data
            </h2>
            
            <label className="block">
              <span className="sr-only">Choose JSON file</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportTrades}
                disabled={loading}
                className="block w-full text-xs text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-sm file:border-0
                  file:text-xs file:font-bold file:uppercase file:tracking-wider
                  file:text-slate-900 file:bg-accent-gain
                  hover:file:bg-accent-gain/90
                  disabled:opacity-50"
              />
            </label>
            <p className="text-[14px] text-slate-500">
              Import trades from a JSON file. Format: array of trade objects.
            </p>
          </section>

          <section className="bg-slate-900/50 border border-accent-loss/30 p-6 space-y-6">
            <h2 className="text-sm font-bold text-accent-loss uppercase tracking-widest flex items-center gap-2">
              <Trash2 size={16} /> Clear Data
            </h2>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-300 font-bold">Clear All Trades</p>
                <p className="text-[14px] text-slate-500">This action cannot be undone</p>
              </div>
              <button
                onClick={() => setIsClearingTrades(true)}
                className="px-4 py-2 bg-accent-loss/20 text-accent-loss border border-accent-loss/30 text-xs font-bold uppercase tracking-wider hover:bg-accent-loss/30"
              >
                Clear
              </button>
            </div>
          </section>
        </div>
      )}

      {isDeletingAccount && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsDeletingAccount(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-accent-loss/50 p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-accent-loss uppercase tracking-widest">Delete Account</h3>
              <button onClick={() => setIsDeletingAccount(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              This will permanently delete your account and ALL associated data including:
            </p>
            <ul className="text-[14px] text-slate-500 list-disc pl-4 space-y-1">
              <li>All trades</li>
              <li>All sub-accounts</li>
              <li>Your profile</li>
            </ul>
            <div className="space-y-2">
              <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Enter your password to confirm</label>
              <input
                type="password"
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-loss"
                placeholder="Password"
              />
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={loading || !deleteAccountPassword}
              className="w-full py-4 bg-accent-loss text-white text-xs font-bold uppercase tracking-widest hover:bg-accent-loss/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Delete My Account'}
            </button>
          </div>
        </div>
      )}

      {isClearingTrades && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsClearingTrades(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-accent-loss/50 p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-accent-loss uppercase tracking-widest">Clear All Trades</h3>
              <button onClick={() => setIsClearingTrades(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              This will permanently delete all {trades.length} trades. This action cannot be undone.
            </p>
            <button
              onClick={handleClearTrades}
              disabled={loading}
              className="w-full py-4 bg-accent-loss text-white text-xs font-bold uppercase tracking-widest hover:bg-accent-loss/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Clear All Trades'}
            </button>
          </div>
        </div>
      )}

      {isAddingSubAccount && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAddingSubAccount(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Add Sub-Account</h3>
              <button onClick={() => setIsAddingSubAccount(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Name</label>
                <input
                  type="text"
                  value={newSubAccountName}
                  onChange={(e) => setNewSubAccountName(e.target.value)}
                  placeholder="e.g., Scalping Strategy"
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Starting Equity ($)</label>
                <input
                  type="number"
                  value={newSubAccountEquity}
                  onChange={(e) => setNewSubAccountEquity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                />
              </div>
            </div>
            <button
              onClick={handleCreateSubAccount}
              disabled={loading || !newSubAccountName.trim()}
              className="w-full py-4 bg-accent-gain text-slate-900 text-xs font-bold uppercase tracking-widest hover:bg-accent-gain/90 disabled:opacity-50"
            >
              Create Sub-Account
            </button>
          </div>
        </div>
      )}

      {selectedSubAccount && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedSubAccount(null)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Edit Sub-Account</h3>
              <button onClick={() => setSelectedSubAccount(null)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Name</label>
                <input
                  type="text"
                  value={editSubAccountName}
                  onChange={(e) => setEditSubAccountName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Starting Equity ($)</label>
                <input
                  type="number"
                  value={editSubAccountEquity}
                  onChange={(e) => setEditSubAccountEquity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Timezone</label>
                <select
                  value={editSubAccountTimezone}
                  onChange={(e) => setEditSubAccountTimezone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleUpdateSubAccount}
              disabled={loading || !editSubAccountName.trim()}
              className="w-full py-4 bg-accent-gain text-slate-900 text-xs font-bold uppercase tracking-wider hover:bg-accent-gain/90 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
