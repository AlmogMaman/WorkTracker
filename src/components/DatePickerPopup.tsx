import { useRef, useState } from 'react'
import { useClickOutside } from '../hooks/useClickOutside'
import { addDays, dateToStr, getDaysInMonth, getFirstDayOfWeek, isToday } from '../utils/time'

interface Props {
  selectedDate: string
  onSelect: (date: string) => void
  onClose: () => void
}

export function DatePickerPopup({ selectedDate, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, onClose)

  const [year, setYear] = useState(() => parseInt(selectedDate.slice(0, 4)))
  const [month, setMonth] = useState(() => parseInt(selectedDate.slice(5, 7)) - 1)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDow = getFirstDayOfWeek(year, month)  // 0=Sun
  const blanks = Array(firstDow).fill(null)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const select = (day: number) => {
    const d = new Date(year, month, day)
    onSelect(dateToStr(d))
    onClose()
  }

  // Build the selected date string for this month to compare
  const selYear = parseInt(selectedDate.slice(0, 4))
  const selMonth = parseInt(selectedDate.slice(5, 7)) - 1
  const selDay = parseInt(selectedDate.slice(8, 10))
  const isSelected = (day: number) => year === selYear && month === selMonth && day === selDay

  return (
    <div
      ref={ref}
      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 w-72"
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const dStr = dateToStr(new Date(year, month, day))
          const today = isToday(dStr)
          const selected = isSelected(day)
          return (
            <button
              key={day}
              onClick={() => select(day)}
              className={`
                text-xs rounded-md py-1.5 font-medium transition-colors
                ${selected ? 'bg-blue-600 text-white' : ''}
                ${today && !selected ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : ''}
                ${!selected && !today ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300' : ''}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Quick nav */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
        <button
          onClick={() => { onSelect(dateToStr(new Date())); onClose() }}
          className="flex-1 text-xs py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium"
        >
          Today
        </button>
        <button
          onClick={() => { onSelect(addDays(selectedDate, -1)); onClose() }}
          className="flex-1 text-xs py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium"
        >
          Yesterday
        </button>
      </div>
    </div>
  )
}
