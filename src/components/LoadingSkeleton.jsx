import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'

export function Skeleton({ className, ...props }) {
  const { dark } = useTheme()
  return (
    <div
      className={clsx(
        'rounded-lg animate-pulse',
        dark ? 'bg-white/5' : 'bg-gray-200',
        className
      )}
      {...props}
    />
  )
}

export function StatCardSkeleton() {
  const { dark } = useTheme()
  return (
    <div className={clsx(
      'rounded-2xl border p-5',
      dark ? 'bg-[#1e2030]/80 border-[#2f3347]' : 'bg-white border-gray-200'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-xl" />
          <div>
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function ServiceCardSkeleton() {
  const { dark } = useTheme()
  return (
    <div className={clsx(
      'rounded-2xl border p-4',
      dark ? 'bg-[#1e2030]/80 border-[#2f3347]' : 'bg-white border-gray-200'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-3.5 w-20 mb-1.5" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        </div>
        <Skeleton className="w-2.5 h-2.5 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full rounded-full mb-3" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export function TableRowSkeleton() {
  const { dark } = useTheme()
  return (
    <tr className={dark ? 'border-[#2f3347]/50' : 'border-gray-200/50'}>
      <td className="px-5 py-3"><Skeleton className="h-4 w-28" /></td>
      <td className="px-5 py-3"><Skeleton className="h-4 w-32" /></td>
      <td className="px-5 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-5 py-3 text-right"><Skeleton className="h-4 w-10 ml-auto" /></td>
      <td className="px-5 py-3 text-right"><Skeleton className="h-4 w-14 ml-auto" /></td>
    </tr>
  )
}
