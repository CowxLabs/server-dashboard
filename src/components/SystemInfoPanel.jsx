import { memo, useState, useEffect } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { Cpu, MemoryStick, HardDrive, Wifi, Globe, Server, RefreshCw, X } from 'lucide-react'

export default memo(function SystemInfoPanel({ onClose }) {
  const { dark } = useTheme()
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token] = useState(() => localStorage.getItem('dashboard_token'))

  const fetchData = () => {
    setLoading(true)
    fetch('/api/system/full', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setInfo)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [token])

  const Row = ({ label, value, mono }) => (
    <div className="flex items-center justify-between py-2 border-b border-dashed" style={{ borderColor: dark ? '#25283740' : '#f1f5f9' }}>
      <span className={clsx('text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{label}</span>
      <span className={clsx('text-xs font-medium', mono && 'font-mono', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{value || '--'}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={clsx('relative w-full max-w-2xl max-h-[85vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col animate-scale-in',
        dark ? 'bg-[#111318] border-[#252837]' : 'bg-white border-gray-200'
      )} onClick={e => e.stopPropagation()}>
        <div className={clsx('flex items-center justify-between px-6 py-4 border-b shrink-0', dark ? 'border-[#252837]' : 'border-gray-200')}>
          <div className="flex items-center gap-3">
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', dark ? 'bg-[#6c8cff]/12 text-[#6c8cff]' : 'bg-blue-50 text-blue-500')}>
              <Server size={18} />
            </div>
            <h2 className={clsx('font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>System Information</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className={clsx('p-2 rounded-xl transition-colors', dark ? 'text-[#5a6180] hover:text-[#a0a8c8] hover:bg-white/[0.05]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className={clsx('p-2 rounded-xl transition-colors', dark ? 'text-[#5a6180] hover:text-[#a0a8c8] hover:bg-white/[0.05]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && !info ? (
            <div className="space-y-3">{[1,2,3,4,5,6].map(i => <div key={i} className={clsx('h-10 rounded-xl animate-pulse', dark ? 'bg-[#161822]' : 'bg-gray-100')} />)}</div>
          ) : info ? (
            <>
              <div>
                <h3 className={clsx('text-sm font-semibold mb-3', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>General</h3>
                <div className={clsx('rounded-xl border p-4', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
                  <Row label="Hostname" value={info.hostname} />
                  <Row label="Operating System" value={info.os} />
                  <Row label="Platform" value={info.platform} />
                  <Row label="Architecture" value={info.arch} />
                  <Row label="Kernel" value={info.kernel} />
                  <Row label="Uptime" value={info.uptime ? `${Math.floor(info.uptime / 86400)}d ${Math.floor((info.uptime % 86400) / 3600)}h ${Math.floor((info.uptime % 3600) / 60)}m` : '--'} />
                  <Row label="Load Average" value={info.loadAverage?.join(' / ')} mono />
                </div>
              </div>

              <div>
                <h3 className={clsx('text-sm font-semibold mb-3', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>CPU</h3>
                <div className={clsx('rounded-xl border p-4', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
                  <Row label="Model" value={info.cpuModel} />
                  <Row label="Cores" value={info.cpuCores} />
                  <Row label="Frequency" value={info.cpuFrequency} />
                </div>
              </div>

              {info.memoryDetail && (
                <div>
                  <h3 className={clsx('text-sm font-semibold mb-3', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Memory Detail</h3>
                  <div className={clsx('rounded-xl border p-4', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
                    <Row label="Total" value={`${(info.memoryDetail.total / 1073741824).toFixed(1)} GB`} />
                    <Row label="Used" value={`${(info.memoryDetail.used / 1073741824).toFixed(1)} GB`} />
                    <Row label="Free" value={`${(info.memoryDetail.free / 1073741824).toFixed(1)} GB`} />
                    <Row label="Available" value={`${(info.memoryDetail.available / 1073741824).toFixed(1)} GB`} />
                    <Row label="Buffers" value={`${(info.memoryDetail.buffers / 1073741824).toFixed(1)} GB`} />
                  </div>
                </div>
              )}

              {info.interfaces && Object.keys(info.interfaces).length > 0 && (
                <div>
                  <h3 className={clsx('text-sm font-semibold mb-3', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Network Interfaces</h3>
                  <div className="space-y-2">
                    {Object.entries(info.interfaces).map(([name, addrs]) => (
                      <div key={name} className={clsx('rounded-xl border p-4', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-gray-50 border-gray-200')}>
                        <div className="flex items-center gap-2 mb-2">
                          <Wifi size={14} className="text-[#22d3ee]" />
                          <span className={clsx('text-sm font-semibold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{name}</span>
                        </div>
                        {addrs.map((a, i) => (
                          <div key={i} className="ml-6">
                            <Row label="IP" value={a.address} mono />
                            <Row label="Netmask" value={a.netmask} mono />
                            <Row label="MAC" value={a.mac} mono />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={clsx('text-center py-8', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Failed to load system info</div>
          )}
        </div>
      </div>
    </div>
  )
})
