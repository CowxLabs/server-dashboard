import { useState, useCallback } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage({ onLogin }) {
  const { dark } = useTheme()
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      localStorage.setItem('dashboard_token', data.token)
      onLogin(data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [password, onLogin])

  return (
    <div className={clsx('min-h-screen flex items-center justify-center p-6', dark ? 'bg-[#0a0b10]' : 'bg-[#f8fafc]')}>
      <div className={clsx('w-full max-w-sm animate-scale-in')}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#6c8cff] to-[#a78bfa] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
            SD
          </div>
          <h1 className={clsx('text-2xl font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Server Dashboard</h1>
          <p className={clsx('text-sm mt-1', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Enter password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className={clsx('rounded-2xl border p-6', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-white border-gray-200 shadow-lg')}>
          <label className={clsx('block text-xs font-semibold uppercase tracking-wider mb-2', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Password</label>
          <div className="relative mb-4">
            <Lock size={16} className={clsx('absolute left-3 top-1/2 -translate-y-1/2', dark ? 'text-[#5a6180]' : 'text-gray-400')} />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              className={clsx('w-full pl-10 pr-10 py-3 rounded-xl border text-sm outline-none transition-all', dark ? 'bg-[#252837] border-[#363a4f] text-[#e0e6ff] placeholder-[#5a6180] focus:border-[#6c8cff]' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400')}
            />
            <button type="button" onClick={() => setShowPw(s => !s)} className={clsx('absolute right-3 top-1/2 -translate-y-1/2', dark ? 'text-[#5a6180] hover:text-[#a0a8c8]' : 'text-gray-400 hover:text-gray-600')}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className="text-sm text-[#f87171] mb-3">{error}</p>}

          <button type="submit" disabled={loading || !password.trim()} className={clsx('w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200', loading || !password.trim() ? 'bg-[#6c8cff]/50 cursor-not-allowed' : 'bg-gradient-to-r from-[#6c8cff] to-[#a78bfa] hover:from-[#5a7aee] hover:to-[#9680e8] shadow-lg shadow-blue-500/20 active:scale-[0.98]')}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={clsx('text-center text-xs mt-4', dark ? 'text-[#5a6180]' : 'text-gray-400')}>
          Default password: <code className={clsx('px-1.5 py-0.5 rounded', dark ? 'bg-[#252837]' : 'bg-gray-100')}>admin</code>
        </p>
      </div>
    </div>
  )
}
