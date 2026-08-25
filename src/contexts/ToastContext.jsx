import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import clsx from 'clsx'
import { useTheme } from './ThemeContext'
import { useEffect } from 'react'

const ToastContext = createContext()

let toastId = 0

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'text-emerald-400' },
  error: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-400' },
  warning: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' },
  info: { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-400' },
}

function ToastItem({ toast, onRemove }) {
  const { dark } = useTheme()
  const Icon = icons[toast.type]
  const color = colors[toast.type]
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onRemove(toast.id), 300)
    }, toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      className={clsx(
        'flex items-start gap-3 w-80 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300',
        dark ? 'bg-[#1e2030]/90 border-[#2f3347]/80' : 'bg-white/90 border-gray-200/80',
        exiting ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className={clsx('shrink-0 mt-0.5', color.icon)}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={clsx('text-sm font-semibold mb-0.5', dark ? 'text-white' : 'text-gray-900')}>
            {toast.title}
          </p>
        )}
        <p className={clsx('text-sm', dark ? 'text-gray-300' : 'text-gray-600')}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onRemove(toast.id), 300) }}
        className={clsx(
          'shrink-0 p-1 rounded-lg transition-colors',
          dark ? 'hover:bg-white/10 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
        )}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = ++toastId
    setToasts(prev => [...prev, { ...toast, id }])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message, opts = {}) => {
    return addToast({ message, type: 'info', ...opts })
  }, [addToast])

  const success = useCallback((message, opts = {}) => {
    return addToast({ message, type: 'success', ...opts })
  }, [addToast])

  const error = useCallback((message, opts = {}) => {
    return addToast({ message, type: 'error', ...opts })
  }, [addToast])

  const warning = useCallback((message, opts = {}) => {
    return addToast({ message, type: 'warning', ...opts })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, removeToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-2" aria-label="Notifications">
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
