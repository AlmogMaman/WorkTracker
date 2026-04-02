import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import { NavBar } from './components/NavBar'
import { Toast } from './components/Toast'
import { DayView } from './components/DayView'
import { MonthView } from './components/MonthView'
import { SettingsView } from './components/SettingsView'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export function App() {
  const view = useAppStore((s) => s.view)
  const language = useAppStore((s) => s.data.settings.language ?? 'en')
  useKeyboardShortcuts()

  useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      <main className="pb-16">
        {view === 'day' && <DayView />}
        {view === 'month' && <MonthView />}
        {view === 'settings' && <SettingsView />}
      </main>
      <Toast />
    </div>
  )
}
