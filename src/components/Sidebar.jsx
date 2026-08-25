import { memo, useState } from 'react'
import clsx from 'clsx'
import {
  LayoutDashboard, Server, Link2, Activity, HardDrive,
  Network, Container, Bell, Settings, ChevronLeft, ChevronRight,
  Sun, Moon, Search, Settings2
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'services', label: 'Services', icon: Server },
  { id: 'containers', label: 'Containers', icon: Container },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'links', label: 'Quick Links', icon: Link2 },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
  { id: 'alerts', label: 'Alerts', icon: Bell },
]

function Sidebar({ activeSection, onNavigate, onOpenCommandPalette, onOpenServiceManager, onOpenSystemInfo }) {
  const [collapsed, setCollapsed] = useState(false)
  const { dark, toggleTheme } = useTheme()

  return (
    <aside
      className={clsx(
        'h-screen sticky top-0 flex flex-col border-r transition-all duration-300 z-50 shrink-0',
        dark
          ? 'bg-[#111318] border-[#252837]'
          : 'bg-white border-gray-200',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-3 px-4 h-16 border-b shrink-0',
        dark ? 'border-[#252837]' : 'border-gray-200'
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c8cff] to-[#a78bfa] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-blue-500/20">
          SD
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <span className={clsx(
              'font-semibold text-sm block truncate',
              dark ? 'text-[#e0e6ff]' : 'text-gray-900'
            )}>
              Server Dashboard
            </span>
            <span className={clsx(
              'text-[10px] block truncate',
              dark ? 'text-[#5a6180]' : 'text-gray-400'
            )}>v2.0 — Production</span>
          </div>
        )}
      </div>

      {/* Search trigger */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <button
            onClick={onOpenCommandPalette}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-200',
              dark
                ? 'bg-[#161822] border border-[#252837] text-[#5a6180] hover:border-[#363a4f] hover:text-[#a0a8c8]'
                : 'bg-gray-50 border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
            )}
          >
            <Search size={14} />
            <span>Search...</span>
            <kbd className={clsx(
              'ml-auto text-[10px] px-1.5 py-0.5 rounded border font-mono',
              dark ? 'border-[#252837] text-[#5a6180]' : 'border-gray-200 text-gray-400'
            )}>⌘K</kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
                isActive
                  ? dark
                    ? 'bg-[#6c8cff]/12 text-[#6c8cff]'
                    : 'bg-blue-50 text-blue-600'
                  : dark
                    ? 'text-[#5a6180] hover:text-[#a0a8c8] hover:bg-white/[0.04]'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              )}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#6c8cff]" />
              )}
              <Icon size={18} className="shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={clsx(
        'px-2 py-3 border-t space-y-0.5 shrink-0',
        dark ? 'border-[#252837]' : 'border-gray-200'
      )}>
        <button
          onClick={onOpenServiceManager}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            dark
              ? 'text-[#6c8cff] hover:bg-[#6c8cff]/10'
              : 'text-blue-500 hover:bg-blue-50'
          )}
        >
          <Settings2 size={18} />
          {!collapsed && <span>Manage Services</span>}
        </button>
        <button
          onClick={onOpenSystemInfo}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            dark
              ? 'text-[#22d3ee] hover:bg-[#22d3ee]/10'
              : 'text-cyan-500 hover:bg-cyan-50'
          )}
        >
          <Server size={18} />
          {!collapsed && <span>System Info</span>}
        </button>
        <button
          onClick={toggleTheme}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            dark
              ? 'text-[#5a6180] hover:text-[#a0a8c8] hover:bg-white/[0.04]'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          )}
          aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            dark
              ? 'text-[#5a6180] hover:text-[#a0a8c8] hover:bg-white/[0.04]'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          )}
        >
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button
          onClick={() => setCollapsed(c => !c)}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            dark
              ? 'text-[#5a6180] hover:text-[#a0a8c8] hover:bg-white/[0.04]'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

export default memo(Sidebar)
