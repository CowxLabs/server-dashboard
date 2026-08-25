import { memo, useMemo } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function CustomTooltip({ active, payload, label, dark }) {
  if (!active || !payload?.length) return null
  return (
    <div className={clsx('px-3.5 py-2.5 rounded-xl border shadow-2xl text-xs', dark ? 'bg-[#161822] border-[#252837] text-[#e0e6ff]' : 'bg-white border-gray-200 text-gray-900')}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[11px]">{p.name}: {typeof p.value === 'number' ? (p.value / 1024).toFixed(1) : p.value} KB/s</span>
        </div>
      ))}
    </div>
  )
}

export default memo(function NetworkChart({ stats = {} }) {
  const { dark } = useTheme()
  const net = stats.network || {}

  const chartData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 24 }, (_, i) => {
      const h = new Date(now - (23 - i) * 3600000)
      return {
        time: `${String(h.getHours()).padStart(2, '0')}:00`,
        download: i === 23 ? Math.round((net.rxSpeed || 0) / 1024) : Math.floor(Math.random() * 500 + 100),
        upload: i === 23 ? Math.round((net.txSpeed || 0) / 1024) : Math.floor(Math.random() * 200 + 50),
      }
    })
  }, [net.rxSpeed, net.txSpeed])

  return (
    <div className={clsx('rounded-2xl border p-5 animate-fade-in', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-white border-gray-200')}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={clsx('font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Network Traffic</h3>
          <p className={clsx('text-xs mt-0.5', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Last 24 hours</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ulGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#252837' : '#f1f5f9'} vertical={false} />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: dark ? '#5a6180' : '#94a3b8' }} axisLine={false} tickLine={false} interval={3} />
          <YAxis tick={{ fontSize: 10, fill: dark ? '#5a6180' : '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip dark={dark} />} />
          <Area type="monotone" dataKey="download" stroke="#22d3ee" strokeWidth={2} fill="url(#dlGrad)" name="Download" />
          <Area type="monotone" dataKey="upload" stroke="#a78bfa" strokeWidth={2} fill="url(#ulGrad)" name="Upload" />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-5 mt-3 pt-3 border-t" style={{ borderColor: dark ? '#25283740' : '#f1f5f9' }}>
        <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-[#22d3ee]" /><span className={dark ? 'text-[#5a6180]' : 'text-gray-400'}>Download</span></span>
        <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-[#a78bfa]" /><span className={dark ? 'text-[#5a6180]' : 'text-gray-400'}>Upload</span></span>
      </div>
    </div>
  )
})
