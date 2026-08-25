import { memo, useState } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { ExternalLink, Star, Link2 } from 'lucide-react'

export default memo(function QuickLinks({ links = [] }) {
  const { dark } = useTheme()
  const [favorites, setFavorites] = useState(['Proxmox', 'Grafana', 'Portainer'])
  const [filter, setFilter] = useState('All')

  const categories = ['All', ...new Set(links.map(l => l.category))]
  const filtered = filter === 'All' ? links : links.filter(l => l.category === filter)

  const toggleFav = (name, e) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', dark ? 'bg-[#facc15]/12 text-[#facc15]' : 'bg-yellow-50 text-yellow-500')}>
            <Link2 size={20} strokeWidth={1.8} />
          </div>
          <h2 className={clsx('text-lg font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Quick Links</h2>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={clsx('px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200', filter === cat ? 'bg-[#6c8cff] text-white shadow-lg shadow-blue-500/20' : dark ? 'bg-[#161822] text-[#5a6180] hover:text-[#a0a8c8] border border-[#252837] hover:border-[#363a4f]' : 'bg-gray-50 text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300')}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5">
        {filtered.map((link, i) => {
          const isFav = favorites.includes(link.name)
          return (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className={clsx('group relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border transition-all duration-300 hover-lift animate-fade-in', dark ? 'bg-[#161822]/80 border-[#252837] hover:border-[#363a4f] hover:bg-[#1c1e2e]/80' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg')} style={{ animationDelay: `${i * 20}ms` }}>
              <button onClick={(e) => toggleFav(link.name, e)} className={clsx('absolute top-3 right-3 transition-all duration-200', isFav ? 'text-[#facc15]' : dark ? 'text-[#5a6180]/30 hover:text-[#5a6180]' : 'text-gray-300 hover:text-gray-400')} aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}>
                <Star size={12} fill={isFav ? 'currentColor' : 'none'} />
              </button>
              <span className="text-3xl">{link.icon}</span>
              <span className={clsx('text-xs font-semibold text-center leading-tight', dark ? 'text-[#a0a8c8]' : 'text-gray-600')}>{link.name}</span>
              <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', dark ? 'bg-[#252837] text-[#5a6180]' : 'bg-gray-100 text-gray-400')}>{link.category}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
})
