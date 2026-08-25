import { memo } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { Shield, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

export default memo(function StatusOverview({ services = [] }) {
  const { dark } = useTheme()
  const healthy = services.filter(s => s.status === 'healthy').length
  const warning = services.filter(s => s.status === 'warning').length
  const degraded = services.filter(s => s.status === 'degraded' || s.status === 'down').length
  const total = services.length || 1
  const score = total > 0 ? Math.round((healthy / total) * 100) : 0

  const scoreColor = score >= 95 ? '#4ade80' : score >= 80 ? '#fb923c' : '#f87171'
  const radius = 52
  const strokeWidth = 6
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ

  return (
    <div className={clsx('rounded-2xl border p-6 animate-fade-in', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-white border-gray-200')}>
      <div className="flex items-center gap-3 mb-5">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', dark ? 'bg-[#4ade80]/12 text-[#4ade80]' : 'bg-emerald-50 text-emerald-500')}>
          <Shield size={20} />
        </div>
        <h3 className={clsx('font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>System Health</h3>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
          <svg width={120} height={120} className="-rotate-90">
            <circle cx={60} cy={60} r={radius} stroke={dark ? '#252837' : '#f1f5f9'} strokeWidth={strokeWidth} fill="none" />
            <circle cx={60} cy={60} r={radius} stroke={scoreColor} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="stat-ring" style={{ filter: `drop-shadow(0 0 8px ${scoreColor}50)` }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={clsx('text-3xl font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{score}</span>
            <span className={clsx('text-[10px] font-semibold uppercase', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Score</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#4ade80]" /><span className={clsx('text-sm', dark ? 'text-[#a0a8c8]' : 'text-gray-600')}>Healthy</span></div>
            <span className={clsx('text-sm font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{healthy}/{total}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><AlertTriangle size={14} className="text-[#fb923c]" /><span className={clsx('text-sm', dark ? 'text-[#a0a8c8]' : 'text-gray-600')}>Warning</span></div>
            <span className={clsx('text-sm font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{warning}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><XCircle size={14} className="text-[#f87171]" /><span className={clsx('text-sm', dark ? 'text-[#a0a8c8]' : 'text-gray-600')}>Degraded</span></div>
            <span className={clsx('text-sm font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{degraded}</span>
          </div>
          <div className={clsx('w-full h-2 rounded-full overflow-hidden mt-2', dark ? 'bg-[#252837]' : 'bg-gray-100')}>
            <div className="h-full rounded-full bg-gradient-to-r from-[#4ade80] to-[#22d3ee] transition-all duration-1000" style={{ width: `${(healthy / total) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
})
