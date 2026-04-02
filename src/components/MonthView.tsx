import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { addMonths, currentYearMonth, formatMonthLabel } from '../utils/time'
import { MonthCalendarGrid } from './MonthCalendarGrid'
import { MonthSummaryTable } from './MonthSummaryTable'

export function MonthView() {
  const t = useTranslation()
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const setView = useAppStore((s) => s.setView)
  const [yearMonth, setYearMonth] = useState(currentYearMonth)

  const prev = () => setYearMonth((ym) => addMonths(ym, -1))
  const next = () => setYearMonth((ym) => addMonths(ym, 1))

  const goToDay = (date: string) => {
    setSelectedDate(date)
    setView('day')
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-8 flex flex-col gap-4 sm:gap-6">
      {/* Month selector */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={prev}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-xl transition-colors"
        >
          ‹
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 min-w-[220px] text-center">
          {formatMonthLabel(yearMonth, t.locale)}
        </h2>
        <button
          onClick={next}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-xl transition-colors"
        >
          ›
        </button>
      </div>

      <MonthCalendarGrid yearMonth={yearMonth} onDayClick={goToDay} />
      <MonthSummaryTable yearMonth={yearMonth} />
    </div>
  )
}
