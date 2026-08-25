import { memo, useState, useEffect } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { HardDrive, MemoryStick, Database, RefreshCw } from 'lucide-react'

function StorageBar({ percent, color = 'blue' }) {
  const { dark } = useTheme()
  const getColor = (pct) => {
    if (pct > 90) return 'from-red-500 to-red-400'
    if (pct > 75) return 'from-amber-500 to-amber-400'
    if (color === 'green') return 'from-emerald-500 to-emerald-400'
    if (color === 'purple') return 'from-purple-500 to-purple-400'
    return 'from-blue-500 to-blue-400'
  }
  return (
    <div className={clsx('w-full h-3 rounded-full overflow-hidden', dark ? 'bg-[#252837]' : 'bg-gray-100')}>
      <div className={clsx('h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out', getColor(percent))} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  )
}

export default memo(function StorageView() {
  const { dark } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token] = useState(() => localStorage.getItem('dashboard_token'))

  const fetchData = () => {
    setLoading(true)
    fetch('/api/storage', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [token])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', dark ? 'bg-[#fb923c]/12 text-[#fb923c]' : 'bg-orange-50 text-orange-500')}>
            <HardDrive size={20} />
          </div>
          <div>
            <h2 className={clsx('text-lg font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Storage</h2>
            <p className={clsx('text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{data?.disks?.length || 0} drives</p>
          </div>
        </div>
        <button onClick={fetchData} className={clsx('p-2 rounded-xl transition-colors', dark ? 'text-[#5a6180] hover:text-[#a0a8c8] hover:bg-white/[0.05]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className={clsx('rounded-2xl border p-6 h-40 animate-pulse', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-white border-gray-200')} />)}
        </div>
      )}

      {data?.memory && (
        <div className={clsx('rounded-2xl border p-6', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-white border-gray-200')}>
          <div className="flex items-center gap-3 mb-4">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', dark ? 'bg-[#a78bfa]/12 text-[#a78bfa]' : 'bg-purple-50 text-purple-500')}>
              <MemoryStick size={20} />
            </div>
            <div>
              <h3 className={clsx('font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Memory (RAM)</h3>
              <p className={clsx('text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{data.memory.used} GB / {data.memory.total} GB</p>
            </div>
            <div className="ml-auto text-right">
              <span className={clsx('text-2xl font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{data.memory.percent}%</span>
            </div>
          </div>
          <StorageBar percent={data.memory.percent} color="purple" />
          <div className="flex justify-between mt-2">
            <span className={clsx('text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Used: {data.memory.used} GB</span>
            <span className={clsx('text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Free: {data.memory.free} GB</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.disks?.map((disk, i) => (
          <div key={i} className={clsx('rounded-2xl border p-6 transition-all hover-lift', dark ? 'bg-[#161822]/80 border-[#252837] hover:border-[#363a4f]' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg')}>
            <div className="flex items-center gap-3 mb-4">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', dark ? 'bg-[#6c8cff]/12 text-[#6c8cff]' : 'bg-blue-50 text-blue-500')}>
                <Database size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={clsx('font-bold text-sm truncate', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{disk.device}</h3>
                <p className={clsx('text-xs truncate', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{disk.mount}</p>
              </div>
              <span className={clsx(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                disk.percent > 90 ? 'bg-red-500/12 text-red-400' :
                disk.percent > 75 ? 'bg-amber-500/12 text-amber-400' :
                'bg-emerald-500/12 text-emerald-400'
              )}>
                {disk.type}
              </span>
            </div>

            <div className="flex items-end justify-between mb-3">
              <span className={clsx('text-3xl font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{disk.percent}%</span>
              <span className={clsx('text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{disk.used} / {disk.total} GB</span>
            </div>

            <StorageBar percent={disk.percent} />

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t" style={{ borderColor: dark ? '#25283740' : '#f1f5f9' }}>
              <div className="text-center">
                <p className={clsx('text-[10px] uppercase font-semibold', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Total</p>
                <p className={clsx('text-sm font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{disk.total} GB</p>
              </div>
              <div className="text-center">
                <p className={clsx('text-[10px] uppercase font-semibold', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Used</p>
                <p className={clsx('text-sm font-bold text-[#fb923c]')}>{disk.used} GB</p>
              </div>
              <div className="text-center">
                <p className={clsx('text-[10px] uppercase font-semibold', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Free</p>
                <p className={clsx('text-sm font-bold text-[#4ade80]')}>{disk.free} GB</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data?.disks?.length === 0 && !loading && (
        <div className={clsx('text-center py-12', dark ? 'text-[#5a6180]' : 'text-gray-400')}>
          <HardDrive size={40} className="mx-auto mb-3 opacity-50" />
          <p>No storage devices detected</p>
        </div>
      )}
    </div>
  )
})
