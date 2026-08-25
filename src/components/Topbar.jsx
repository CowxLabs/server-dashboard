import { memo, useState, useEffect } from 'react'
import clsx from 'clsx'
import { Search, Bell, Clock, Menu, AlertTriangle, XCircle, Info } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const severityMeta = {
  critical: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/15' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/15' },
}

function Topbar({ onOpenCommandPalette, onToggleMobile, onLogout, alerts = [] }) {
  const { dark } = useTheme()
  const [time, setTime] = useState(new Date())
  const [showNotifications, setShowNotifications] = useState(false)
  const [dismissed, setDismissed] = useState(new Set())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id))
  const unreadCount = visibleAlerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length

  const dismissAlert = (id) => {
    setDismissed(prev => new Set([...prev, id]))
  }

  return (
    <header className={clsx(
      'h-16 border-b flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-40',
      dark
        ? 'bg-[#111318]/80 backdrop-blur-xl border-[#252837]'
        : 'bg-white/80 backdrop-blur-xl border-gray-200'
    )}>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className={clsx(
            'lg:hidden p-2 rounded-xl transition-colors',
            dark ? 'text-[#5a6180] hover:bg-white/[0.05]' : 'text-gray-400 hover:bg-gray-100'
          )}
          aria-label="Toggle mobile menu"
        >
          <Menu size={20} />
        </button>

        <button
          onClick={onOpenCommandPalette}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200',
            dark
              ? 'bg-[#161822] border border-[#252837] text-[#5a6180] hover:border-[#363a4f] hover:text-[#a0a8c8]'
              : 'bg-gray-50 border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
          )}
        >
          <Search size={15} />
          <span className="hidden sm:inline">Search services, links...</span>
          <kbd className={clsx(
            'hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border font-mono ml-4',
            dark ? 'border-[#252837] text-[#5a6180]' : 'border-gray-200 text-gray-400'
          )}>⌘K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Live status indicator */}
        <div className={clsx(
          'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        )}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
          All Systems Operational
        </div>

        {/* Time */}
        <div className={clsx(
          'hidden sm:flex items-center gap-2 text-sm',
          dark ? 'text-[#5a6180]' : 'text-gray-400'
        )}>
          <Clock size={14} />
          <span className="font-mono text-xs">{time.toLocaleTimeString()}</span>
          <span className={clsx('hidden md:inline', dark ? 'text-[#5a6180]/40' : 'text-gray-300')}>|</span>
          <span className="hidden md:inline text-xs">{time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={clsx(
              'relative p-2 rounded-xl transition-all duration-200',
              dark
                ? 'text-[#5a6180] hover:text-[#a0a8c8] hover:bg-white/[0.05]'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            )}
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-expanded={showNotifications}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#111318]">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className={clsx(
                'absolute right-0 top-full mt-2 w-[380px] rounded-2xl border shadow-2xl z-50 overflow-hidden animate-scale-in',
                dark
                  ? 'bg-[#161822]/95 backdrop-blur-xl border-[#252837]'
                  : 'bg-white/95 backdrop-blur-xl border-gray-200'
              )}>
                <div className={clsx(
                  'px-5 py-3.5 border-b flex items-center justify-between',
                  dark ? 'border-[#252837]' : 'border-gray-200'
                )}>
                  <span className={clsx('font-semibold text-sm', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>
                    Notifications
                  </span>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    dark ? 'bg-[#252837] text-[#5a6180]' : 'bg-gray-100 text-gray-400'
                  )}>
                    {visibleAlerts.length}
                  </span>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {visibleAlerts.length === 0 && (
                    <div className={clsx('px-5 py-10 text-center text-sm', dark ? 'text-[#5a6180]' : 'text-gray-400')}>
                      No notifications
                    </div>
                  )}
                  {visibleAlerts.map(alert => {
                    const meta = severityMeta[alert.severity]
                    const Icon = meta.icon
                    return (
                      <div
                        key={alert.id}
                        className={clsx(
                          'px-5 py-3.5 border-b last:border-0 transition-colors',
                          dark ? 'border-[#252837]/50 hover:bg-white/[0.02]' : 'border-gray-100 hover:bg-gray-50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={clsx('shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center', meta.bg)}>
                            <Icon size={14} className={meta.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={clsx('text-sm leading-snug', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>
                              {alert.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={clsx('text-[11px]', dark ? 'text-[#5a6180]' : 'text-gray-400')}>
                                {alert.time}
                              </span>
                              <span className={clsx('w-1 h-1 rounded-full', dark ? 'bg-[#5a6180]/30' : 'bg-gray-300')} />
                              <span className={clsx('text-[11px] font-medium', meta.color)}>
                                {alert.service}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className={clsx(
                              'shrink-0 p-1 rounded-lg transition-colors text-[10px]',
                              dark ? 'text-[#5a6180] hover:text-[#a0a8c8] hover:bg-white/[0.05]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            )}
                            aria-label="Dismiss notification"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Avatar + Logout */}
        <button
          onClick={onLogout}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200',
            dark
              ? 'text-[#5a6180] hover:text-[#f87171] hover:bg-[#f87171]/10'
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          )}
          aria-label="Log out"
        >
          <div className={clsx(
            'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white',
            'bg-gradient-to-br from-[#6c8cff] to-[#a78bfa]'
          )}>A</div>
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}

export default memo(Topbar)
