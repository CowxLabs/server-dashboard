import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { Wifi, WifiOff } from 'lucide-react'

export default function ConnectionBanner({ connected }) {
  const { dark } = useTheme()
  if (connected) return null
  return (
    <div className={clsx('px-4 py-2 text-center text-xs font-medium flex items-center justify-center gap-2 animate-fade-in', dark ? 'bg-[#fb923c]/10 text-[#fb923c] border-b border-[#fb923c]/20' : 'bg-orange-50 text-orange-600 border-b border-orange-200')}>
      <WifiOff size={14} />
      Connection lost. Reconnecting...
    </div>
  )
}
