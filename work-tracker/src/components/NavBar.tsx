import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import type { View } from '../types'

export function NavBar() {
  const t = useTranslation()
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const language = useAppStore((s) => s.data.settings.language ?? 'en')
  const hasRunning = useAppStore((s) =>
    Object.values(s.data.days).some((blocks) => blocks.some((b) => b.endTime === null)),
  )

  const goToday = () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    setSelectedDate(`${y}-${m}-${d}`)
    setView('day')
  }

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }

  const toggleLanguage = () => {
    updateSettings({ language: language === 'en' ? 'he' : 'en' })
  }

  return (
    <>
      {/* ── Top bar ── */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm safe-top">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-13 sm:h-14 flex items-center justify-between gap-2">

          {/* Logo */}
          <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 shrink-0">
            <span className="text-xl">⏱</span>
            <span className="hidden sm:inline text-lg">Work Tracker</span>
            {hasRunning && (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" title={t.progress.running} />
            )}
          </div>

          {/* Nav — hidden on mobile (uses bottom nav instead) */}
          <div className="hidden sm:flex items-center gap-1">
            <NavBtn active={view === 'day'} onClick={() => setView('day')}>{t.nav.day}</NavBtn>
            <NavBtn active={view === 'month'} onClick={() => setView('month')}>{t.nav.month}</NavBtn>
            <NavBtn active={view === 'settings'} onClick={() => setView('settings')}>{t.nav.settings}</NavBtn>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={goToday}
              className="hidden sm:block text-xs px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium transition-colors"
            >
              {t.nav.today}
            </button>
            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="text-xs px-2.5 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium transition-colors"
              title={t.settings.language}
            >
              {language === 'en' ? 'עב' : 'EN'}
            </button>
            <button
              onClick={toggleDark}
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors text-lg"
              title="Toggle dark mode"
            >
              <span className="dark:hidden">🌙</span>
              <span className="hidden dark:inline">☀️</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Bottom nav — mobile only ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-bottom">
        <div className="flex items-stretch h-16">
          <BottomNavBtn active={view === 'day'} onClick={() => setView('day')} icon="📅" label={t.nav.day} />
          <BottomNavBtn active={view === 'month'} onClick={() => setView('month')} icon="📆" label={t.nav.month} />
          <BottomNavBtn active={false} onClick={goToday} icon="⬛" label={t.nav.today} />
          <BottomNavBtn active={view === 'settings'} onClick={() => setView('settings')} icon="⚙️" label={t.nav.settings} />
        </div>
      </nav>
    </>
  )
}

function NavBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function BottomNavBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
        active
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span>{label}</span>
      {active && <span className="absolute bottom-0 w-8 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
    </button>
  )
}
