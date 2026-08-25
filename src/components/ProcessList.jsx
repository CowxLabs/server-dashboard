import { memo, useState, useMemo } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { processes } from '../data/mockData'
import { Terminal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export default memo(function ProcessList() {
  const { dark } = useTheme()
  const [sortKey, setSortKey] = useState('cpu')
  const [sortDir, setSortDir] = useState('desc')

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = useMemo(() => {
    return [...processes].sort((a, b) => {
      const cmp = typeof a[sortKey] === 'string' ? a[sortKey].localeCompare(b[sortKey]) : a[sortKey] - b[sortKey]
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [sortKey, sortDir])

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ArrowUpDown size={11} className="opacity-30" />
    return sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
  }

  const thCls = clsx('px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:opacity-80 transition-opacity', dark ? 'text-[#5a6180]' : 'text-gray-400')

  return (
    <div className={clsx('rounded-2xl border overflow-hidden animate-fade-in', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-white border-gray-200')}>
      <div className={clsx('px-5 py-4 border-b flex items-center gap-3', dark ? 'border-[#252837]' : 'border-gray-200')}>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', dark ? 'bg-[#a78bfa]/12 text-[#a78bfa]' : 'bg-purple-50 text-purple-500')}>
          <Terminal size={20} />
        </div>
        <div>
          <h3 className={clsx('font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Top Processes</h3>
          <p className={clsx('text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{sorted.length} running</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={dark ? 'bg-[#111318]' : 'bg-gray-50'}>
              <th className={thCls} onClick={() => toggleSort('name')}><span className="flex items-center gap-1.5">Process <SortIcon col="name" /></span></th>
              <th className={thCls} onClick={() => toggleSort('user')}><span className="flex items-center gap-1.5">User <SortIcon col="user" /></span></th>
              <th className={clsx(thCls, 'text-right')} onClick={() => toggleSort('cpu')}><span className="flex items-center gap-1.5 justify-end">CPU <SortIcon col="cpu" /></span></th>
              <th className={clsx(thCls, 'text-right')} onClick={() => toggleSort('memory')}><span className="flex items-center gap-1.5 justify-end">Memory <SortIcon col="memory" /></span></th>
              <th className={clsx(thCls, 'text-right hidden md:table-cell')} onClick={() => toggleSort('threads')}><span className="flex items-center gap-1.5 justify-end">Threads <SortIcon col="threads" /></span></th>
              <th className={thCls}>PID</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.pid} className={clsx('border-t transition-colors', dark ? 'border-[#252837]/50 hover:bg-white/[0.02]' : 'border-gray-100 hover:bg-gray-50')}>
                <td className="px-4 py-2.5"><span className={clsx('font-semibold text-xs', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{p.name}</span></td>
                <td className={clsx('px-4 py-2.5 text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{p.user}</td>
                <td className="px-4 py-2.5 text-right"><span className={clsx('font-mono text-xs px-2 py-0.5 rounded-md', p.cpu > 3 ? 'bg-[#fb923c]/12 text-[#fb923c] font-semibold' : dark ? 'text-[#a0a8c8]' : 'text-gray-600')}>{p.cpu}%</span></td>
                <td className="px-4 py-2.5 text-right"><span className={clsx('font-mono text-xs', dark ? 'text-[#a0a8c8]' : 'text-gray-600')}>{p.memory >= 1024 ? `${(p.memory / 1024).toFixed(1)} GB` : `${p.memory} MB`}</span></td>
                <td className={clsx('px-4 py-2.5 text-right font-mono text-xs hidden md:table-cell', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{p.threads}</td>
                <td className={clsx('px-4 py-2.5 font-mono text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{p.pid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})
