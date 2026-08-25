import { memo, useState, useEffect, useRef, useCallback } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { Search, Server, Link2, Container, ArrowRight } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function SearchPalette({ onNavigate, onClose, onOpenServiceManager }) {
  const { dark } = useTheme()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ services: [], quickLinks: [] })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const [token] = useState(() => localStorage.getItem('dashboard_token'))

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!query.trim()) { setResults({ services: [], quickLinks: [] }); return }
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(setResults)
        .catch(() => {})
    }, 200)
    return () => clearTimeout(timer)
  }, [query, token])

  useEffect(() => { setSelectedIndex(0) }, [results])

  const allResults = [
    ...results.services.map(s => ({ type: 'service', id: s.id, name: s.name, sub: s.type, icon: s.icon || '🔌' })),
    ...results.quickLinks.map(l => ({ type: 'link', id: l.url, name: l.name, sub: l.category, icon: l.icon || '🔗' })),
  ]

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allResults.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault()
      const r = allResults[selectedIndex]
      if (r.type === 'link') window.open(r.id, '_blank')
      else { onNavigate('services') }
      onClose()
    } else if (e.key === 'Escape') onClose()
  }, [allResults, selectedIndex, onNavigate, onClose])

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={clsx('relative w-full max-w-lg mx-4 rounded-2xl border shadow-2xl overflow-hidden animate-scale-in',
        dark ? 'bg-[#111318]/95 border-[#252837]/80 backdrop-blur-xl' : 'bg-white/95 border-gray-200/80 backdrop-blur-xl'
      )} onClick={e => e.stopPropagation()}>
        <div className={clsx('flex items-center gap-3 px-5 border-b', dark ? 'border-[#252837]' : 'border-gray-200')}>
          <Search size={18} className={dark ? 'text-[#5a6180]' : 'text-gray-400'} />
          <input ref={inputRef} type="text" placeholder="Search services, links, containers..."
            value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            className={clsx('flex-1 py-4 bg-transparent outline-none text-base', dark ? 'text-[#e0e6ff] placeholder-[#5a6180]' : 'text-gray-900 placeholder-gray-400')} />
          <kbd className={clsx('text-xs px-2 py-1 rounded-lg border font-mono', dark ? 'border-[#252837] text-[#5a6180] bg-[#161822]' : 'border-gray-200 text-gray-400 bg-gray-50')}>ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2" role="listbox">
          {!query.trim() && (
            <div className={clsx('px-5 py-8 text-center text-sm', dark ? 'text-[#5a6180]' : 'text-gray-400')}>
              Type to search services, quick links, and more...
            </div>
          )}
          {query.trim() && allResults.length === 0 && (
            <div className={clsx('px-5 py-8 text-center text-sm', dark ? 'text-[#5a6180]' : 'text-gray-400')}>No results found</div>
          )}
          {allResults.map((r, i) => (
            <button key={`${r.type}-${r.id}`} role="option" aria-selected={i === selectedIndex}
              className={clsx('w-full flex items-center gap-3 px-5 py-3 text-left transition-colors duration-100',
                i === selectedIndex ? (dark ? 'bg-[#6c8cff]/12 text-[#6c8cff]' : 'bg-blue-50 text-blue-600') : (dark ? 'text-[#a0a8c8] hover:bg-white/[0.03]' : 'text-gray-700 hover:bg-gray-50')
              )}
              onClick={() => { if (r.type === 'link') window.open(r.id, '_blank'); else onNavigate('services'); onClose() }}
              onMouseEnter={() => setSelectedIndex(i)}>
              <span className="text-lg">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{r.name}</span>
                <span className={clsx('ml-2 text-[11px]', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{r.sub}</span>
              </div>
              <ArrowRight size={14} className={clsx('opacity-0', i === selectedIndex && 'opacity-50')} />
            </button>
          ))}
        </div>

        <div className={clsx('flex items-center gap-4 px-5 py-2.5 border-t text-xs', dark ? 'border-[#252837] text-[#5a6180]' : 'border-gray-200 text-gray-400')}>
          <span className="flex items-center gap-1"><kbd className={clsx('px-1.5 py-0.5 rounded border font-mono', dark ? 'border-[#252837] bg-[#161822]' : 'border-gray-200 bg-gray-50')}>↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className={clsx('px-1.5 py-0.5 rounded border font-mono', dark ? 'border-[#252837] bg-[#161822]' : 'border-gray-200 bg-gray-50')}>↵</kbd> select</span>
        </div>
      </div>
    </div>,
    document.body
  )
}
