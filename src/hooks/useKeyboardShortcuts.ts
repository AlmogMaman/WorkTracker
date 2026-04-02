import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { addDays, todayStr } from '../utils/time'

function isInputFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (el as HTMLElement).isContentEditable
  )
}

export function useKeyboardShortcuts() {
  const selectedDate = useAppStore((s) => s.selectedDate)
  const view = useAppStore((s) => s.view)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const setView = useAppStore((s) => s.setView)
  const stopRunningBlock = useAppStore((s) => s.stopRunningBlock)
  const getRunningBlock = useAppStore((s) => s.getRunningBlock)
  const addToast = useAppStore((s) => s.addToast)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+, → Settings (fires even in inputs)
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault()
        setView('settings')
        return
      }

      if (isInputFocused()) return

      switch (e.key) {
        case 'n':
        case 'N': {
          // N key: focus the "New Project" button — we simulate a click via DOM
          e.preventDefault()
          if (view !== 'day') setView('day')
          const btn = document.querySelector<HTMLButtonElement>('[data-new-project]')
          if (btn) btn.click()
          break
        }
        case 's':
        case 'S': {
          e.preventDefault()
          const running = getRunningBlock()
          if (running) {
            const name = stopRunningBlock()
            addToast(`Stopped: "${name || 'unnamed block'}"`, 'info')
          }
          break
        }
        case 'ArrowLeft': {
          e.preventDefault()
          setSelectedDate(addDays(selectedDate, -1))
          if (view !== 'day') setView('day')
          break
        }
        case 'ArrowRight': {
          e.preventDefault()
          setSelectedDate(addDays(selectedDate, 1))
          if (view !== 'day') setView('day')
          break
        }
        case 't':
        case 'T': {
          e.preventDefault()
          setSelectedDate(todayStr())
          if (view !== 'day') setView('day')
          break
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    selectedDate,
    view,
    setSelectedDate,
    setView,
    stopRunningBlock,
    getRunningBlock,
    addToast,
  ])
}
