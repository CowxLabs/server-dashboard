import { memo, useState } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { XCircle, AlertTriangle, Info, Bell } from 'lucide-react'

const sev = {
  critical: { icon: XCircle, color: 'text-[#f87171]', bg: 'bg-[#f87171]/12' },
  warning: { icon: AlertTriangle, color: 'text-[#fb923c]', bg: 'bg-[#fb923c]/12' },
  info: { icon: Info, color: 'text-[#6c8cff]', bg: 'bg-[#6c8cff]/12' },
}

export default memo(function AlertsFeed({ alerts = [] }) {
  const { dark } = useTheme()
  const [gone, setGone] = useState(new Set())
  const [filter, setFilter] = useState('all')
  const vis = alerts.filter(a => !gone.has(a.id) && (filter === 'all' || a.severity === filter))
  const cnt = (s) => alerts.filter(a => !gone.has(a.id) && (s === 'all' || a.severity === s)).length

  return (
    <div className={clsx('rounded-2xl border overflow-hidden animate-fade-in', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-white border-gray-200')}>
      <div className={clsx('px-5 py-4 border-b flex items-center justify-between', dark ? 'border-[#252837]' : 'border-gray-200')}>
        <div className="flex items-center gap-3">
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', dark ? 'bg-[#f87171]/12 text-[#f87171]' : 'bg-red-50 text-red-500')}>
            <Bell size={20} />
          </div>
          <div>
            <h3 className={clsx('font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Alerts</h3>
            <p className={clsx('text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{cnt('all')} active</p>
          </div>
        </div>
        <div className="flex gap-1">
          {['all', 'critical', 'warning', 'info'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={clsx('px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all', filter === s ? (s === 'critical' ? 'bg-[#f87171]/15 text-[#f87171]' : s === 'warning' ? 'bg-[#fb923c]/15 text-[#fb923c]' : s === 'info' ? 'bg-[#6c8cff]/15 text-[#6c8cff]' : dark ? 'bg-white/10 text-[#e0e6ff]' : 'bg-gray-100 text-gray-900') : dark ? 'text-[#5a6180] hover:text-[#a0a8c8]' : 'text-gray-400 hover:text-gray-600')}>
              {s} ({cnt(s)})
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {vis.length === 0 && <div className={clsx('px-5 py-10 text-center text-sm', dark ? 'text-[#5a6180]' : 'text-gray-400')}>No alerts</div>}
        {vis.map((a, i) => {
          const m = sev[a.severity]
          const Icon = m?.icon || Info
          return (
            <div key={a.id} className={clsx('px-5 py-3.5 border-b last:border-0 flex items-start gap-3 transition-colors animate-fade-in', dark ? 'border-[#252837]/50 hover:bg-white/[0.02]' : 'border-gray-100 hover:bg-gray-50')} style={{ animationDelay: `${i * 40}ms` }}>
              <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', m?.bg || 'bg-gray-100')}>
                <Icon size={15} className={m?.color || 'text-gray-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx('text-sm leading-snug', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{a.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={clsx('text-[11px]', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{a.time || a.created_at || ''}</span>
                  <span className={clsx('w-1 h-1 rounded-full', dark ? 'bg-[#5a6180]/30' : 'bg-gray-300')} />
                  <span className={clsx('text-[11px] font-semibold', m?.color || 'text-gray-400')}>{a.service}</span>
                  {a.source && <span className={clsx('text-[10px] px-1.5 py-0.5 rounded', dark ? 'bg-[#252837] text-[#5a6180]' : 'bg-gray-100 text-gray-400')}>{a.source}</span>}
                </div>
              </div>
              <button onClick={() => setGone(p => new Set([...p, a.id]))} className={clsx('shrink-0 p-1.5 rounded-lg transition-colors text-[11px] font-medium', dark ? 'text-[#5a6180] hover:text-[#f87171] hover:bg-[#f87171]/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50')} aria-label="Dismiss">
                Dismiss
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
})
