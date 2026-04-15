import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { addMonths, currentYearMonth, dateToStr, formatDateLabel, formatDurationMinutes, formatMonthLabel, getDaysInMonth, parseYearMonth, todayStr } from '../utils/time'
import { MonthCalendarGrid } from './MonthCalendarGrid'
import { MonthSummaryTable } from './MonthSummaryTable'

export function MonthView() {
  const t = useTranslation()
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const setView = useAppStore((s) => s.setView)
  const getDailySummary = useAppStore((s) => s.getDailySummary)
  const getDayTotalMinutes = useAppStore((s) => s.getDayTotalMinutes)
  const getTargetForDay = useAppStore((s) => s.getTargetForDay)
  const toggleDaySync = useAppStore((s) => s.toggleDaySync)
  // Reactive sync selectors — read data directly so Zustand re-renders on change
  const syncedDays = useAppStore((s) => s.data.syncedDays)
  const daysData = useAppStore((s) => s.data.days)
  const [yearMonth, setYearMonth] = useState(currentYearMonth)
  const [popup, setPopup] = useState<string | null>(null) // date string
  const monthSynced = (() => {
    const daysWithData = Object.keys(daysData).filter(
      (d) => d.startsWith(yearMonth) && daysData[d].length > 0
    )
    if (daysWithData.length === 0) return false
    return daysWithData.every((d) => !!(syncedDays?.[d]))
  })()

  // ── Month balance (overtime / deficit) ──────────────────────────────────────
  // Sum (actual - target) for every past/today day in the viewed month.
  // Days off (target = 0) still count if you worked on them (positive delta).
  const monthBalanceMinutes = (() => {
    const today = todayStr()
    const { year, month } = parseYearMonth(yearMonth)
    const daysInMonth = getDaysInMonth(year, month)
    let delta = 0
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = dateToStr(new Date(year, month, day))
      if (dateStr > today) break
      const targetMins = getTargetForDay(dateStr) * 60
      const actualMins = getDayTotalMinutes(dateStr)
      delta += actualMins - targetMins
    }
    return delta
  })()

  const prev = () => setYearMonth((ym) => addMonths(ym, -1))
  const next = () => setYearMonth((ym) => addMonths(ym, 1))

  const goToDay = (date: string) => {
    setSelectedDate(date)
    setView('day')
  }

  const handleDayClick = (date: string) => {
    setPopup(date)
  }

  const closePopup = () => setPopup(null)

  // Popup data
  const popupSummary = popup ? getDailySummary(popup) : []
  const popupTotal = popup ? getDayTotalMinutes(popup) : 0
  const popupTarget = popup ? getTargetForDay(popup) : 0
  const popupMet = popupTotal >= popupTarget * 60
  const popupDaySynced = popup ? !!(syncedDays?.[popup]) : false

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
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 min-w-[220px] text-center">
            {formatMonthLabel(yearMonth, t.locale)}
          </h2>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Month overtime / deficit badge */}
            {monthBalanceMinutes !== 0 && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  monthBalanceMinutes > 0
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }`}
              >
                {monthBalanceMinutes > 0
                  ? t.balance.overtime(formatDurationMinutes(monthBalanceMinutes))
                  : t.balance.deficit(formatDurationMinutes(Math.abs(monthBalanceMinutes)))}
              </span>
            )}
            {monthBalanceMinutes === 0 && (
              <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/60 text-gray-400 dark:text-gray-500">
                {t.balance.onTrack}
              </span>
            )}
            {/* Month sync badge */}
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                monthSynced
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700/60 text-gray-400 dark:text-gray-500'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${monthSynced ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-500'}`} />
              {monthSynced ? t.sync.monthSynced : t.sync.monthPartial}
            </span>
          </div>
        </div>
        <button
          onClick={next}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-xl transition-colors"
        >
          ›
        </button>
      </div>

      <MonthCalendarGrid yearMonth={yearMonth} onDayClick={handleDayClick} />
      <MonthSummaryTable yearMonth={yearMonth} />

      {/* Day summary popup */}
      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={closePopup}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {formatDateLabel(popup, t.locale)}
              </h3>
              <button
                onClick={closePopup}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Summary content */}
            <div className="px-4 py-3">
              {popupSummary.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                  {t.summary.noCompleted}
                </p>
              ) : (
                <table className="w-full text-sm mb-3">
                  <tbody>
                    {popupSummary.map((row) => (
                      <tr key={row.project} className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="py-2 text-gray-800 dark:text-gray-200 font-medium">{row.project}</td>
                        <td className="py-2 text-right rtl:text-left font-mono text-gray-500 dark:text-gray-400">
                          {formatDurationMinutes(row.minutes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="pt-2 font-bold text-gray-800 dark:text-gray-200">{t.summary.total}</td>
                      <td className="pt-2 text-right rtl:text-left font-bold font-mono text-gray-800 dark:text-gray-200">
                        {formatDurationMinutes(popupTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* Target status */}
              {popupSummary.length > 0 && (
                <div className={`text-xs font-medium mb-3 ${popupMet ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {popupMet
                    ? t.summary.targetMet(popupTarget)
                    : t.summary.targetMissing(formatDurationMinutes(popupTarget * 60 - popupTotal), popupTarget)}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-4 pb-4 flex flex-col gap-2">
              {/* Day sync toggle */}
              {popupSummary.length > 0 && (
                <button
                  onClick={() => popup && toggleDaySync(popup)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                    popupDaySynced
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${popupDaySynced ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-500'}`} />
                  {popupDaySynced ? t.sync.daySynced : t.sync.dayNotSynced}
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { closePopup(); goToDay(popup) }}
                  className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  {t.nav.day} →
                </button>
                <button
                  onClick={closePopup}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {t.progress.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
