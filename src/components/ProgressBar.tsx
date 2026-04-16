import { useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { useInterval } from '../hooks/useInterval'
import { formatDuration, formatDurationMinutes } from '../utils/time'

interface Props {
  date: string
}

export function ProgressBar({ date }: Props) {
  const t = useTranslation()
  const getDayTotalMinutes = useAppStore((s) => s.getDayTotalMinutes)
  const getDayTotalSeconds = useAppStore((s) => s.getDayTotalSeconds)
  const getTargetForDay = useAppStore((s) => s.getTargetForDay)
  const setDayTarget = useAppStore((s) => s.setDayTarget)
  const dayTargets = useAppStore((s) => s.data.dayTargets)
  const hasRunning = useAppStore((s) =>
    Object.values(s.data.days).some((blocks) => blocks.some((b) => b.endTime === null)),
  )

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Tick every 30s to keep live timer reflected in the progress bar
  const [, setTick] = useState(0)
  useInterval(() => setTick((t) => t + 1), hasRunning ? 30_000 : null)

  const targetHours = getTargetForDay(date)
  const hasCustom = dayTargets?.[date] !== undefined
  const totalMinutes = getDayTotalMinutes(date)
  const targetMinutes = targetHours * 60
  const isDayOff = targetMinutes === 0
  const pct = isDayOff ? 0 : Math.min(100, Math.round((totalMinutes / targetMinutes) * 100))
  const met = isDayOff ? true : totalMinutes >= targetMinutes
  const remaining = isDayOff ? 0 : targetMinutes - totalMinutes

  const openEdit = () => {
    setEditValue(String(targetHours))
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const commitEdit = () => {
    const v = parseFloat(editValue)
    if (!isNaN(v) && v >= 0 && v <= 24) {
      setDayTarget(date, v)
    }
    setEditing(false)
  }

  const clearOverride = () => {
    setDayTarget(date, null)
    setEditing(false)
  }

  return (
    <div className="px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-2 gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {formatDuration(getDayTotalSeconds(date))}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {t.progress.targetLabel(targetHours)}
            </span>
            {hasCustom && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium">
                {t.progress.custom}
              </span>
            )}
            <button
              onClick={openEdit}
              title={t.progress.setTarget}
              className="ml-0.5 p-0.5 rounded text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
              </svg>
            </button>
          </div>
          {hasRunning && (
            <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
              {t.progress.running}
            </span>
          )}
        </div>

        {isDayOff ? (
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
            {totalMinutes > 0 ? `+${formatDurationMinutes(totalMinutes)}` : '—'}
          </span>
        ) : met ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
            <span className="text-base">✓</span>
            {t.progress.done}
          </span>
        ) : (
          <span className="text-sm font-semibold text-red-500 dark:text-red-400">
            -{formatDurationMinutes(remaining)}
          </span>
        )}
      </div>

      {/* Inline day-target editor */}
      {editing && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 flex-wrap">
          <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {t.progress.targetFor(date)}
          </span>
          <input
            ref={inputRef}
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="w-16 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-500">{t.progress.hoursUnit}</span>
          <button
            onClick={commitEdit}
            className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {t.progress.set}
          </button>
          {hasCustom && (
            <button
              onClick={clearOverride}
              className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium"
            >
              {t.progress.clear}
            </button>
          )}
          <button
            onClick={() => setEditing(false)}
            className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300"
          >
            {t.progress.cancel}
          </button>
        </div>
      )}

      {/* Progress bar — hidden when target is 0 (day off) */}
      {!isDayOff && (
        <>
          <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                met ? 'bg-green-500' : pct > 75 ? 'bg-yellow-400' : 'bg-blue-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 text-right rtl:text-left text-xs text-gray-400 dark:text-gray-500">{pct}%</div>
        </>
      )}
    </div>
  )
}
