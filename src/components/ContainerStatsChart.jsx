import { memo, useState, useEffect } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { X, Cpu, MemoryStick, ArrowUp, ArrowDown } from 'lucide-react'

function ChartTooltip({ active, payload, label, dark }) {
  if (!active || !payload?.length) return null
  return (
    <div className={clsx('px-3 py-2 rounded-xl border shadow-xl text-xs', dark ? 'bg-[#161822] border-[#252837] text-[#e0e6ff]' : 'bg-white border-gray-200 text-gray-900')}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default memo(function ContainerStatsChart({ container, onClose }) {
  const { dark } = useTheme()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [token] = useState(() => localStorage.getItem('dashboard_token'))

  useEffect(() => {
    if (!container?.name) return
    fetch(`/api/container-stats/${container.name}?limit=60`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(raw => {
        const chartData = raw.reverse().map(r => ({
          time: new Date(r.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          cpu: r.cpu || 0,
          memory: r.memory || 0,
          networkRx: (r.network_rx || 0) / 1024,
          networkTx: (r.network_tx || 0) / 1024,
        }))
        setData(chartData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [container?.name, token])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={clsx('relative w-full max-w-3xl max-h-[85vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col animate-scale-in',
        dark ? 'bg-[#111318] border-[#252837]' : 'bg-white border-gray-200'
      )} onClick={e => e.stopPropagation()}>
        <div className={clsx('flex items-center justify-between px-6 py-4 border-b shrink-0', dark ? 'border-[#252837]' : 'border-gray-200')}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{container.icon || '\u{1F4E6}'}</span>
            <div>
              <h2 className={clsx('font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{container.name}</h2>
              <p className={clsx('text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{container.image} — {container.status}</p>
            </div>
          </div>
          <button onClick={onClose} className={clsx('p-2 rounded-xl transition-colors', dark ? 'text-[#5a6180] hover:text-[#a0a8c8] hover:bg-white/[0.05]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={clsx('rounded-xl border p-3', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
              <div className="flex items-center gap-2 mb-1"><Cpu size={14} className="text-[#6c8cff]" /><span className={clsx('text-[10px] uppercase font-semibold', dark ? 'text-[#5a6180]' : 'text-gray-400')}>CPU</span></div>
              <p className={clsx('text-xl font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{(container.cpu || 0).toFixed(1)}%</p>
            </div>
            <div className={clsx('rounded-xl border p-3', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
              <div className="flex items-center gap-2 mb-1"><MemoryStick size={14} className="text-[#a78bfa]" /><span className={clsx('text-[10px] uppercase font-semibold', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Memory</span></div>
              <p className={clsx('text-xl font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{container.memory || 0} MB</p>
            </div>
            <div className={clsx('rounded-xl border p-3', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
              <div className="flex items-center gap-2 mb-1"><ArrowDown size={14} className="text-[#22d3ee]" /><span className={clsx('text-[10px] uppercase font-semibold', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Net RX</span></div>
              <p className={clsx('text-xl font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{((container.networkRx || 0) / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <div className={clsx('rounded-xl border p-3', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
              <div className="flex items-center gap-2 mb-1"><ArrowUp size={14} className="text-[#a78bfa]" /><span className={clsx('text-[10px] uppercase font-semibold', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Net TX</span></div>
              <p className={clsx('text-xl font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{((container.networkTx || 0) / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          </div>

          {loading ? (
            <div className={clsx('h-60 rounded-xl animate-pulse', dark ? 'bg-[#161822]' : 'bg-gray-100')} />
          ) : data.length > 0 ? (
            <>
              <div>
                <h3 className={clsx('text-sm font-semibold mb-3', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>CPU Usage</h3>
                <div className={clsx('rounded-xl border p-4', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={data}>
                      <defs><linearGradient id="cpuG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6c8cff" stopOpacity={0.3} /><stop offset="100%" stopColor="#6c8cff" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#252837' : '#f1f5f9'} vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: dark ? '#5a6180' : '#94a3b8' }} axisLine={false} tickLine={false} interval={9} />
                      <YAxis tick={{ fontSize: 10, fill: dark ? '#5a6180' : '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip dark={dark} />} />
                      <Area type="monotone" dataKey="cpu" stroke="#6c8cff" strokeWidth={2} fill="url(#cpuG)" name="CPU %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h3 className={clsx('text-sm font-semibold mb-3', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Memory Usage</h3>
                <div className={clsx('rounded-xl border p-4', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={data}>
                      <defs><linearGradient id="memG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} /><stop offset="100%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#252837' : '#f1f5f9'} vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: dark ? '#5a6180' : '#94a3b8' }} axisLine={false} tickLine={false} interval={9} />
                      <YAxis tick={{ fontSize: 10, fill: dark ? '#5a6180' : '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip dark={dark} />} />
                      <Area type="monotone" dataKey="memory" stroke="#a78bfa" strokeWidth={2} fill="url(#memG)" name="Memory MB" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className={clsx('text-center py-8', dark ? 'text-[#5a6180]' : 'text-gray-400')}>No historical data yet. Stats are collected every 5 seconds.</div>
          )}
        </div>
      </div>
    </div>
  )
})
