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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-2 h-2 rounded-full bg-accent-gain shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            <div className="text-[12px] tracking-[0.4em] uppercase font-black text-gray-900">
              REFINE TRADE
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {mode === 'login' ? 'Sign in to your trading journal' : 'Start tracking your trades today'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required={mode === 'register'}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-all mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Please wait...
                </>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button type="button" onClick={onSwitchMode} className="text-accent-gain font-semibold hover:underline">Sign up</button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={onSwitchMode} className="text-accent-gain font-semibold hover:underline">Sign in</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
