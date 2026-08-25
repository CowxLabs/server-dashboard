import { memo, useState, useMemo } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${units[i]}`
}

function formatUptime(sec) {
  if (!sec) return '--'
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  if (d > 0) return `${d}d ${h}h`
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default memo(function ContainerList({ containers = [] }) {
  const { dark } = useTheme()
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [filter, setFilter] = useState('')

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    let list = [...containers]
    if (filter) list = list.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()) || c.image.toLowerCase().includes(filter.toLowerCase()))
    list.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv)) : (av || 0) - (bv || 0)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [containers, sortKey, sortDir, filter])

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="opacity-30" />
    return sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  }

  const thCls = clsx('px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:opacity-80 transition-opacity', dark ? 'text-[#5a6180]' : 'text-gray-400')

  return (
    <div className={clsx('rounded-2xl border overflow-hidden animate-fade-in', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-white border-gray-200')}>
      <div className={clsx('px-5 py-4 border-b flex items-center justify-between gap-4', dark ? 'border-[#252837]' : 'border-gray-200')}>
        <div>
          <h3 className={clsx('font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Docker Containers</h3>
          <p className={clsx('text-xs mt-0.5', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{sorted.length} containers</p>
        </div>
        <input type="text" placeholder="Filter..." value={filter} onChange={e => setFilter(e.target.value)} className={clsx('w-40 px-3 py-1.5 rounded-xl text-xs outline-none transition-all', dark ? 'bg-[#252837] text-[#e0e6ff] placeholder-[#5a6180] focus:ring-1 focus:ring-[#6c8cff]/30' : 'bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-blue-300 border border-gray-200')} aria-label="Filter containers" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={dark ? 'bg-[#111318]' : 'bg-gray-50'}>
              <th className={thCls} onClick={() => toggleSort('name')}><span className="flex items-center gap-1.5">Container <SortIcon col="name" /></span></th>
              <th className={clsx(thCls, 'hidden md:table-cell')} onClick={() => toggleSort('image')}><span className="flex items-center gap-1.5">Image <SortIcon col="image" /></span></th>
              <th className={thCls}>Status</th>
              <th className={clsx(thCls, 'text-right')} onClick={() => toggleSort('cpu')}><span className="flex items-center gap-1.5 justify-end">CPU <SortIcon col="cpu" /></span></th>
              <th className={clsx(thCls, 'text-right')} onClick={() => toggleSort('memory')}><span className="flex items-center gap-1.5 justify-end">Memory <SortIcon col="memory" /></span></th>
              <th className={clsx(thCls, 'hidden lg:table-cell')}>Ports</th>
              <th className={clsx(thCls, 'hidden lg:table-cell')} onClick={() => toggleSort('uptime')}><span className="flex items-center gap-1.5">Uptime <SortIcon col="uptime" /></span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id || c.name} className={clsx('border-t transition-colors', dark ? 'border-[#252837]/50 hover:bg-white/[0.02]' : 'border-gray-100 hover:bg-gray-50')}>
                <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className={clsx('w-2 h-2 rounded-full', c.status === 'running' ? 'bg-[#4ade80]' : 'bg-[#f87171]')} /><span className={clsx('font-semibold text-sm', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{c.name}</span></div></td>
                <td className={clsx('px-4 py-3 font-mono text-xs hidden md:table-cell', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{c.image}</td>
                <td className="px-4 py-3"><span className={clsx('text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize', c.status === 'running' ? 'bg-[#4ade80]/12 text-[#4ade80]' : 'bg-[#f87171]/12 text-[#f87171]')}>{c.status}</span></td>
                <td className={clsx('px-4 py-3 text-right font-mono text-xs', c.cpu > 5 ? 'text-[#fb923c] font-semibold' : dark ? 'text-[#a0a8c8]' : 'text-gray-600')}>{(c.cpu || 0).toFixed(1)}%</td>
                <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-2"><div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: dark ? '#252837' : '#f1f5f9' }}><div className={clsx('h-full rounded-full transition-all duration-500', (c.memory || 0) / (c.maxMemory || 1) > 0.8 ? 'bg-[#fb923c]' : 'bg-[#6c8cff]')} style={{ width: `${Math.min(((c.memory || 0) / (c.maxMemory || 1)) * 100, 100)}%` }} /></div><span className={clsx('font-mono text-xs', dark ? 'text-[#a0a8c8]' : 'text-gray-600')}>{c.memory >= 1024 ? `${(c.memory / 1024).toFixed(1)}G` : `${c.memory}M`}</span></div></td>
                <td className={clsx('px-4 py-3 font-mono text-xs hidden lg:table-cell', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{c.ports || '--'}</td>
                <td className={clsx('px-4 py-3 text-xs hidden lg:table-cell', dark ? 'text-[#a0a8c8]' : 'text-gray-600')}>{formatUptime(c.uptime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})
