import { useEffect, useCallback } from 'react'

export function useKeyboard(shortcuts) {
  const handleKeyDown = useCallback((e) => {
    const key = []
    if (e.metaKey || e.ctrlKey) key.push('mod')
    if (e.shiftKey) key.push('shift')
    if (e.altKey) key.push('alt')
    key.push(e.key.toLowerCase())
    const combo = key.join('+')

    if (shortcuts[combo]) {
      e.preventDefault()
      shortcuts[combo]()
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
