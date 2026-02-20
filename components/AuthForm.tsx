import React, { useState } from 'react'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

interface AuthFormProps {
  mode: 'login' | 'register'
  onSubmit: (email: string, password: string, name?: string) => Promise<void>
  onSwitchMode: () => void
  loading: boolean
  error: string | null
}

export default function AuthForm({ mode, onSubmit, onSwitchMode, loading, error }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(email, password, name)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-accent-gain shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
            <div className="text-[14px] tracking-[0.4em] uppercase font-black text-slate-100">
              REFINE TRADE
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-100 uppercase tracking-wider">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-2">
            {mode === 'login' ? 'Sign in to your trading journal' : 'Start tracking your trades today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <div className="space-y-2">
              <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required={mode === 'register'}
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[14px] text-slate-500 uppercase font-bold tracking-widest">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-accent-gain pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-accent-loss/10 border border-accent-loss/30 rounded-sm">
              <AlertCircle size={16} className="text-accent-loss" />
              <p className="text-xs text-accent-loss font-mono">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-gain text-slate-900 py-4 text-xs font-bold uppercase tracking-widest hover:bg-accent-gain/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={onSwitchMode} className="text-accent-gain hover:underline">Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={onSwitchMode} className="text-accent-gain hover:underline">Sign in</button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
