import { memo, useState, useEffect } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { ExternalLink, CheckCircle2 } from 'lucide-react'

function HeartbeatBar({ data, dark }) {
  if (!data?.length) return null
  return (
    <div className="flex gap-[2px] items-end h-6">
      {data.map((v, i) => (
        <div key={i} className={clsx('w-[3px] rounded-full transition-all duration-500', v === 1 ? (dark ? 'bg-[#4ade80]/70' : 'bg-emerald-400') : (dark ? 'bg-[#f87171]/70' : 'bg-red-400'))} style={{ height: v === 1 ? `${50 + Math.random() * 50}%` : '100%' }} />
      ))}
    </div>
  )
}

function LatencySparkline({ data, dark }) {
  if (!data?.length) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const h = 20, w = 80
  const points = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke={dark ? '#6c8cff' : '#3b82f6'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatusDot({ status }) {
  return (
    <div className="relative shrink-0">
      <div className={clsx('w-2.5 h-2.5 rounded-full', status === 'healthy' && 'bg-[#4ade80]', status === 'warning' && 'bg-[#fb923c]', status === 'degraded' && 'bg-[#f87171]')} />
      {status === 'healthy' && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-pulse-dot" />}
    </div>
  )
}

export default memo(function ServiceCards({ services = [], onServiceClick, onContainerClick }) {
  const { dark } = useTheme()
  const [hovered, setHovered] = useState(null)
  const healthy = services.filter(s => s.status === 'healthy').length

  return (
    <div>
      <div className="flex items-center justify-between mb-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', dark ? 'bg-[#4ade80]/12 text-[#4ade80]' : 'bg-emerald-50 text-emerald-500')}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h2 className={clsx('text-lg font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Services</h2>
            <p className={clsx('text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{healthy}/{services.length} healthy</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {services.map((svc, i) => (
          <a key={svc.id} href={svc.url} target="_blank" rel="noopener noreferrer"
            onMouseEnter={() => setHovered(svc.id)} onMouseLeave={() => setHovered(null)}
            onClick={(e) => { e.preventDefault(); onServiceClick?.(svc) }}
            className={clsx('group rounded-2xl border p-4 transition-all duration-300 cursor-pointer animate-fade-in hover-lift block', dark ? 'bg-[#161822]/80 border-[#252837] hover:border-[#363a4f] hover:bg-[#1c1e2e]/80' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg', hovered === svc.id && 'scale-[1.01]')} style={{ animationDelay: `${i * 30}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{svc.icon}</span>
                <div className="min-w-0">
                  <h3 className={clsx('font-semibold text-sm truncate', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{svc.name}</h3>
                  <p className={clsx('text-[11px] truncate', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{svc.type}</p>
                </div>
              </div>
              <StatusDot status={svc.status} />
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className={clsx('text-[11px] px-2 py-0.5 rounded-full font-semibold', svc.status === 'healthy' && 'bg-[#4ade80]/12 text-[#4ade80]', svc.status === 'warning' && 'bg-[#fb923c]/12 text-[#fb923c]', svc.status === 'degraded' && 'bg-[#f87171]/12 text-[#f87171]')}>
                {svc.status === 'healthy' ? 'Healthy' : svc.status === 'warning' ? 'Warning' : 'Degraded'}
              </span>
              <div className="flex items-center gap-2">
                <LatencySparkline data={svc.latencyHistory} dark={dark} />
                <span className={clsx('text-[11px] font-mono', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{svc.responseTime}ms</span>
              </div>
            </div>
            <HeartbeatBar data={svc.heartbeat} dark={dark} />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed" style={{ borderColor: dark ? '#25283740' : '#e5e7eb40' }}>
              <span className={clsx('text-[11px]', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Uptime: <span className="font-semibold">{svc.uptime || '--'}%</span></span>
              <ExternalLink size={13} className={clsx('opacity-0 group-hover:opacity-100 transition-opacity', dark ? 'text-[#6c8cff]' : 'text-blue-500')} />
            </div>
          </a>
        ))}
      </div>
    </div>
  )
})
