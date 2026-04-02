import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { addDays, formatDateLabel, isToday } from '../utils/time'
import { DatePickerPopup } from './DatePickerPopup'

export function DateNavigator() {
  const t = useTranslation()
  const selectedDate = useAppStore((s) => s.selectedDate)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const [showPicker, setShowPicker] = useState(false)

  const prev = () => setSelectedDate(addDays(selectedDate, -1))
  const next = () => setSelectedDate(addDays(selectedDate, 1))

  return (
    <div className="relative flex items-center justify-center gap-3 py-4">
      <button
        onClick={prev}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-xl transition-colors"
        title="Previous day (←)"
      >
        ‹
      </button>

      <button
        onClick={() => setShowPicker((v) => !v)}
        className="flex flex-col items-center group"
      >
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {formatDateLabel(selectedDate, t.locale)}
        </span>
        {isToday(selectedDate) && (
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t.day.today}</span>
        )}
      </button>

      <button
        onClick={next}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-xl transition-colors"
        title="Next day (→)"
      >
        ›
      </button>

      {showPicker && (
        <DatePickerPopup
          selectedDate={selectedDate}
          onSelect={(d) => { setSelectedDate(d); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
