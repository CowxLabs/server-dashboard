import { memo, useState, useEffect } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { Cpu, MemoryStick, HardDrive, Wifi, Thermometer, Clock, Globe, Activity } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

function CircularGauge({ value, size = 68, strokeWidth = 5, color }) {
  const { dark } = useTheme()
  const radius = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (Math.min(value, 100) / 100) * circ
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke={dark ? '#252837' : '#e5e7eb'} strokeWidth={strokeWidth} fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="stat-ring" style={{ filter: `drop-shadow(0 0 4px ${color}50)` }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={clsx('text-xs font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{Math.round(value)}%</span>
      </div>
    </div>
  )
}

function MiniChart({ data, dataKey, color }) {
  const { dark } = useTheme()
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip contentStyle={{ background: dark ? '#161822' : '#fff', border: `1px solid ${dark ? '#252837' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11, color: dark ? '#e0e6ff' : '#111827' }} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} fill={`url(#g-${color})`} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function StatCard({ icon: Icon, label, value, subValue, color, colorHex, miniData, delay = 0 }) {
  const { dark } = useTheme()
  return (
    <div className={clsx('rounded-2xl border p-5 transition-all duration-300 hover-lift animate-fade-in group', dark ? 'bg-[#161822]/80 border-[#252837] hover:border-[#363a4f]' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg')} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center', color === 'blue' && (dark ? 'bg-[#6c8cff]/12 text-[#6c8cff]' : 'bg-blue-50 text-blue-500'), color === 'green' && (dark ? 'bg-[#4ade80]/12 text-[#4ade80]' : 'bg-emerald-50 text-emerald-500'), color === 'orange' && (dark ? 'bg-[#fb923c]/12 text-[#fb923c]' : 'bg-orange-50 text-orange-500'), color === 'purple' && (dark ? 'bg-[#a78bfa]/12 text-[#a78bfa]' : 'bg-purple-50 text-purple-500'))}>
            <Icon size={20} strokeWidth={1.8} />
          </div>
          <div>
            <p className={clsx('text-[11px] font-semibold uppercase tracking-wider', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{label}</p>
            <p className={clsx('text-2xl font-bold tracking-tight', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{value}</p>
          </div>
        </div>
        <CircularGauge value={parseFloat(value)} color={colorHex} />
      </div>
      {subValue && <p className={clsx('text-xs mb-2', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{subValue}</p>}
      {miniData && <MiniChart data={miniData} dataKey="usage" color={colorHex} />}
    </div>
  )
}

function InfoPill({ icon: Icon, label, value, color, delay = 0 }) {
  const { dark } = useTheme()
  return (
    <div className={clsx('rounded-2xl border p-4 flex items-center gap-3.5 animate-fade-in hover-lift transition-all duration-300', dark ? 'bg-[#161822]/80 border-[#252837] hover:border-[#363a4f]' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg')} style={{ animationDelay: `${delay}ms` }}>
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color === 'red' && (dark ? 'bg-[#f87171]/12 text-[#f87171]' : 'bg-red-50 text-red-500'), color === 'cyan' && (dark ? 'bg-[#22d3ee]/12 text-[#22d3ee]' : 'bg-cyan-50 text-cyan-500'), color === 'purple' && (dark ? 'bg-[#a78bfa]/12 text-[#a78bfa]' : 'bg-purple-50 text-purple-500'), color === 'green' && (dark ? 'bg-[#4ade80]/12 text-[#4ade80]' : 'bg-emerald-50 text-emerald-500'))}>
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className={clsx('text-[11px] font-semibold uppercase tracking-wider', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{label}</p>
        <p className={clsx('text-lg font-bold tracking-tight truncate', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{value}</p>
      </div>
    </div>
  )
}

function formatUptime(seconds) {
  if (!seconds) return '--'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default memo(function SystemStats({ stats = {}, systemInfo = {} }) {
  const { dark } = useTheme()
  const [cpuHistory, setCpuHistory] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({ t: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`, usage: Math.floor(Math.random() * 40 + 20) }))
  )

  useEffect(() => {
    if (stats.cpu != null) {
      setCpuHistory(prev => {
        const now = new Date()
        const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        return [...prev.slice(-59), { t, usage: stats.cpu }]
      })
    }
  }, [stats.cpu])

  const cpu = stats.cpu ?? 0
  const mem = stats.memory ?? { total: 0, used: 0, percent: 0 }
  const disk = stats.disk ?? { total: 0, used: 0, percent: 0 }
  const net = stats.network ?? { rxSpeed: 0, txSpeed: 0 }
  const temp = stats.temperature ?? '--'
  const loadAvg = stats.loadAverage ?? [0, 0, 0]

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 animate-fade-in">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', dark ? 'bg-[#6c8cff]/12 text-[#6c8cff]' : 'bg-blue-50 text-blue-500')}>
          <Activity size={20} strokeWidth={1.8} />
        </div>
        <div>
          <h2 className={clsx('text-lg font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>System Overview</h2>
          <p className={clsx('text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{systemInfo.hostname || '--'} — {systemInfo.os || systemInfo.platform || '--'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <StatCard icon={Cpu} label="CPU" value={`${cpu.toFixed(1)}%`} subValue={`${systemInfo.cpuModel || '--'} — ${systemInfo.cpuCores || '--'} cores`} color="blue" colorHex="#6c8cff" miniData={cpuHistory} delay={0} />
        <StatCard icon={MemoryStick} label="Memory" value={`${mem.percent.toFixed(1)}%`} subValue={`${mem.used.toFixed(1)} GB / ${mem.total.toFixed(1)} GB`} color="green" colorHex="#4ade80" delay={50} />
        <StatCard icon={HardDrive} label="Disk" value={`${disk.percent.toFixed(1)}%`} subValue={`${disk.used} GB / ${disk.total} GB used`} color="orange" colorHex="#fb923c" delay={100} />
        <StatCard icon={Wifi} label="Network" value={`${(net.rxSpeed / 1024).toFixed(1)} KB/s`} subValue={`RX: ${(net.rxSpeed / 1024).toFixed(1)} KB/s  TX: ${(net.txSpeed / 1024).toFixed(1)} KB/s`} color="purple" colorHex="#a78bfa" delay={150} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoPill icon={Thermometer} label="Temperature" value={temp !== null ? `${temp}°C` : 'N/A'} color="red" delay={200} />
        <InfoPill icon={Clock} label="Uptime" value={formatUptime(systemInfo.uptime)} color="cyan" delay={250} />
        <InfoPill icon={Globe} label="Hostname" value={systemInfo.hostname || '--'} color="purple" delay={300} />
        <InfoPill icon={Activity} label="Load Avg" value={loadAvg.map(l => l.toFixed(2)).join('  ')} color="green" delay={350} />
      </div>
    </div>
  )
})
