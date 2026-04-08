import { useEffect, useRef } from 'react'
import { useAppStore } from './store/useAppStore'
import { NavBar } from './components/NavBar'
import { Toast } from './components/Toast'
import { DayView } from './components/DayView'
import { MonthView } from './components/MonthView'
import { SettingsView } from './components/SettingsView'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useSwipeGesture } from './hooks/useSwipeGesture'

const VIEWS = ['day', 'month', 'settings'] as const
type View = typeof VIEWS[number]

export function App() {
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const language = useAppStore((s) => s.data.settings.language ?? 'en')
  useKeyboardShortcuts()

  useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  const mainRef = useRef<HTMLElement>(null)
  const isRtl = language === 'he'

  const goNext = () => {
    const idx = VIEWS.indexOf(view as View)
    if (idx < VIEWS.length - 1) setView(VIEWS[idx + 1])
  }
  const goPrev = () => {
    const idx = VIEWS.indexOf(view as View)
    if (idx > 0) setView(VIEWS[idx - 1])
  }

  useSwipeGesture(mainRef, {
    onSwipeLeft: isRtl ? goPrev : goNext,
    onSwipeRight: isRtl ? goNext : goPrev,
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      <main ref={mainRef} className="pb-16">
        {view === 'day' && <DayView />}
        {view === 'month' && <MonthView />}
        {view === 'settings' && <SettingsView />}
      </main>
      <Toast />
    </div>
  )
}
