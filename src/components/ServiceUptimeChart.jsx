import { memo, useState, useEffect } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { X, Clock, CheckCircle2, AlertTriangle, Activity } from 'lucide-react'

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

export default memo(function ServiceUptimeChart({ service, onClose }) {
  const { dark } = useTheme()
  const [hours, setHours] = useState(24)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [token] = useState(() => localStorage.getItem('dashboard_token'))

  useEffect(() => {
    if (!service?.id) return
    setLoading(true)
    fetch(`/api/uptime/${service.id}?hours=${hours}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(raw => {
        const chartData = raw.map(r => ({
          time: new Date(r.checked_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
          latency: r.response_ms || 0,
          status: r.status === 'healthy' ? 1 : 0,
        }))
        setData(chartData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [service?.id, hours, token])

  const totalChecks = data.length
  const healthyChecks = data.filter(d => d.status === 1).length
  const uptime = totalChecks > 0 ? ((healthyChecks / totalChecks) * 100).toFixed(2) : '--'
  const avgLatency = totalChecks > 0 ? Math.round(data.reduce((a, b) => a + b.latency, 0) / totalChecks) : '--'
  const maxLatency = totalChecks > 0 ? Math.max(...data.map(d => d.latency)) : '--'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={clsx('relative w-full max-w-3xl max-h-[85vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col animate-scale-in',
        dark ? 'bg-[#111318] border-[#252837]' : 'bg-white border-gray-200'
      )} onClick={e => e.stopPropagation()}>
        <div className={clsx('flex items-center justify-between px-6 py-4 border-b shrink-0', dark ? 'border-[#252837]' : 'border-gray-200')}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{service.icon}</span>
            <div>
              <h2 className={clsx('font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{service.name}</h2>
              <p className={clsx('text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{service.type} — {service.url}</p>
            </div>
          </div>
          <button onClick={onClose} className={clsx('p-2 rounded-xl transition-colors', dark ? 'text-[#5a6180] hover:text-[#a0a8c8] hover:bg-white/[0.05]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex gap-2">
            {[24, 168, 720].map(h => (
              <button key={h} onClick={() => setHours(h)} className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', hours === h ? 'bg-[#6c8cff] text-white' : dark ? 'bg-[#161822] text-[#5a6180] hover:text-[#a0a8c8] border border-[#252837]' : 'bg-gray-100 text-gray-400 hover:text-gray-600 border border-gray-200')}>
                {h === 24 ? '24h' : h === 168 ? '7d' : '30d'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className={clsx('rounded-xl border p-4 text-center', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
              <CheckCircle2 size={18} className="mx-auto mb-1 text-[#4ade80]" />
              <p className={clsx('text-2xl font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{uptime}%</p>
              <p className={clsx('text-[10px] uppercase font-semibold', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Uptime</p>
            </div>
            <div className={clsx('rounded-xl border p-4 text-center', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
              <Clock size={18} className="mx-auto mb-1 text-[#6c8cff]" />
              <p className={clsx('text-2xl font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{avgLatency}<span className="text-sm">ms</span></p>
              <p className={clsx('text-[10px] uppercase font-semibold', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Avg Latency</p>
            </div>
            <div className={clsx('rounded-xl border p-4 text-center', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
              <Activity size={18} className="mx-auto mb-1 text-[#fb923c]" />
              <p className={clsx('text-2xl font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{maxLatency}<span className="text-sm">ms</span></p>
              <p className={clsx('text-[10px] uppercase font-semibold', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Max Latency</p>
            </div>
          </div>

          {loading ? (
            <div className={clsx('h-60 rounded-xl animate-pulse', dark ? 'bg-[#161822]' : 'bg-gray-100')} />
          ) : data.length > 0 ? (
            <>
              <div>
                <h3 className={clsx('text-sm font-semibold mb-3', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Response Latency</h3>
                <div className={clsx('rounded-xl border p-4', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data}>
                      <defs><linearGradient id="latG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6c8cff" stopOpacity={0.3} /><stop offset="100%" stopColor="#6c8cff" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#252837' : '#f1f5f9'} vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: dark ? '#5a6180' : '#94a3b8' }} axisLine={false} tickLine={false} interval={Math.floor(data.length / 8)} />
                      <YAxis tick={{ fontSize: 10, fill: dark ? '#5a6180' : '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip dark={dark} />} />
                      <ReferenceLine y={parseInt(avgLatency) || 0} stroke={dark ? '#5a6180' : '#94a3b8'} strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="latency" stroke="#6c8cff" strokeWidth={2} fill="url(#latG)" name="Latency (ms)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className={clsx('text-sm font-semibold mb-3', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Status History</h3>
                <div className={clsx('rounded-xl border p-4', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={data}>
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={[0, 1]} />
                      <Tooltip content={<ChartTooltip dark={dark} />} />
                      <Bar dataKey="status" name="Status" fill="#4ade80" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-between mt-2">
                    <span className={clsx('text-[10px]', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Green = healthy, Empty = down</span>
                    <span className={clsx('text-[10px]', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{totalChecks} checks</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={clsx('text-center py-8', dark ? 'text-[#5a6180]' : 'text-gray-400')}>No data for this time range</div>
          )}
        </div>
      </div>
    </div>
  )
})
