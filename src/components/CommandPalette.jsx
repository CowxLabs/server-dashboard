import { useState, useEffect, useCallback, useRef } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { Search, Server, Link2, Activity, HardDrive, Network, Container, Bell, Settings, Terminal, LayoutDashboard, Settings2 } from 'lucide-react'
import { createPortal } from 'react-dom'

const sections = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'services', label: 'Services', icon: Server },
  { id: 'containers', label: 'Containers', icon: Container },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'links', label: 'Quick Links', icon: Link2 },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: '_manageServices', label: 'Manage Services', icon: Settings2 },
]

export default function CommandPalette({ onNavigate, onClose, onOpenServiceManager }) {
  const { dark } = useTheme()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const filtered = sections.filter(s =>
    s.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex]
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      onNavigate(filtered[selectedIndex].id)
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [filtered, selectedIndex, onNavigate, onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={clsx(
          'relative w-full max-w-lg mx-4 rounded-2xl border shadow-2xl overflow-hidden',
          dark ? 'bg-[#1a1b26]/95 border-[#2f3347]/80 backdrop-blur-xl' : 'bg-white/95 border-gray-200/80 backdrop-blur-xl'
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className={clsx(
          'flex items-center gap-3 px-5 border-b',
          dark ? 'border-[#2f3347]' : 'border-gray-200'
        )}>
          <Search size={18} className={dark ? 'text-gray-500' : 'text-gray-400'} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className={clsx(
              'flex-1 py-4 bg-transparent outline-none text-base',
              dark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            )}
          />
          <kbd className={clsx(
            'text-xs px-2 py-1 rounded-lg border font-mono',
            dark ? 'border-[#2f3347] text-gray-500 bg-[#1e2030]' : 'border-gray-200 text-gray-400 bg-gray-50'
          )}>
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto py-2" role="listbox">
          {filtered.length === 0 && (
            <div className={clsx(
              'px-5 py-8 text-center text-sm',
              dark ? 'text-gray-500' : 'text-gray-400'
            )}>
              No results found
            </div>
          )}
          {filtered.map((section, i) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                role="option"
                aria-selected={i === selectedIndex}
                className={clsx(
                  'w-full flex items-center gap-3 px-5 py-3 text-left transition-colors duration-100',
                  i === selectedIndex
                    ? dark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'
                    : dark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'
                )}
                onClick={() => {
                  if (section.id === '_manageServices') { onOpenServiceManager?.() }
                  else { onNavigate(section.id) }
                  onClose()
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            )
          })}
        </div>

        <div className={clsx(
          'flex items-center gap-4 px-5 py-2.5 border-t text-xs',
          dark ? 'border-[#2f3347] text-gray-600' : 'border-gray-200 text-gray-400'
        )}>
          <span className="flex items-center gap-1">
            <kbd className={clsx(
              'px-1.5 py-0.5 rounded border font-mono',
              dark ? 'border-[#2f3347] bg-[#1e2030]' : 'border-gray-200 bg-gray-50'
            )}>↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className={clsx(
              'px-1.5 py-0.5 rounded border font-mono',
              dark ? 'border-[#2f3347] bg-[#1e2030]' : 'border-gray-200 bg-gray-50'
            )}>↵</kbd> select
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}
