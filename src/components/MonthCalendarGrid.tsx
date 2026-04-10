import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import {
  dateToStr,
  formatDurationMinutes,
  getDaysInMonth,
  getFirstDayOfWeek,
  isFuture,
  isPast,
  isToday,
  isWeekend,
  parseYearMonth,
} from '../utils/time'

interface Props {
  yearMonth: string
  onDayClick: (date: string) => void
}

export function MonthCalendarGrid({ yearMonth, onDayClick }: Props) {
  const t = useTranslation()
  const getMonthDayTotals = useAppStore((s) => s.getMonthDayTotals)
  const getTargetForDay = useAppStore((s) => s.getTargetForDay)
  const weekStart = useAppStore((s) => s.data.settings.weekStartDay)

  const { year, month } = parseYearMonth(yearMonth)
  const dayTotals = getMonthDayTotals(yearMonth)
  const targetMinutes = targetHours * 60

  const daysInMonth = getDaysInMonth(year, month)
  const firstDow = getFirstDayOfWeek(year, month) // 0=Sun


  // Shift headers if week starts Monday
  const headers = weekStart === 1
    ? [...t.calendar.dayHeaders.slice(1), t.calendar.dayHeaders[0]]
    : t.calendar.dayHeaders

  // Calculate blank cells before day 1
  let blanks = firstDow - weekStart
  if (blanks < 0) blanks += 7

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
        {headers.map((h, i) => (
          <div
            key={i}
            className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 py-2 uppercase tracking-wide"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {Array(blanks)
          .fill(null)
          .map((_, i) => (
            <div key={`blank-${i}`} className="h-20 border-r border-b border-gray-50 dark:border-gray-700/50" />
          ))}

        {days.map((day) => {
          const dateStr = dateToStr(new Date(year, month, day))
          const totalMins = dayTotals[dateStr] ?? 0
          const hasData = totalMins > 0
          const weekend = isWeekend(dateStr)
          const today = isToday(dateStr)
          const past = isPast(dateStr) && !today
          const future = isFuture(dateStr)
          const targetMinutes = getTargetForDay(dateStr) * 60

          let dotColor = ''
          if (hasData && totalMins >= targetMinutes) dotColor = 'bg-green-500'
          else if (hasData && past) dotColor = 'bg-red-400'
          else if (hasData && today) dotColor = 'bg-orange-400'
          else if (hasData) dotColor = 'bg-gray-300 dark:bg-gray-600'

          return (
            <button
              key={day}
              onClick={() => onDayClick(dateStr)}
              className={`
                h-16 sm:h-20 p-1 sm:p-2 border-r border-b border-gray-50 dark:border-gray-700/50
                flex flex-col items-start gap-0.5 sm:gap-1 text-left rtl:text-right transition-colors
                hover:bg-blue-50 dark:hover:bg-blue-900/20
                ${today ? 'bg-blue-50/80 dark:bg-blue-900/20' : ''}
                ${weekend && !today ? 'bg-gray-50/60 dark:bg-gray-800/60' : ''}
              `}
            >
              {/* Day number */}
              <span
                className={`
                  text-sm font-semibold leading-none
                  ${today ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs' : ''}
                  ${!today && !future && !weekend ? 'text-gray-800 dark:text-gray-200' : ''}
                  ${weekend && !today ? 'text-gray-400 dark:text-gray-500' : ''}
                  ${future && !today ? 'text-gray-400 dark:text-gray-500' : ''}
                `}
              >
                {day}
              </span>

              {/* Hours logged */}
              {hasData && (
                <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 font-mono leading-none">
                  {formatDurationMinutes(totalMins)}
                </span>
              )}

              {/* Status dot */}
              {dotColor && (
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-auto`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
