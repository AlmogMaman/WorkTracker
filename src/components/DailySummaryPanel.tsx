import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { formatDateLabel, formatDurationMinutes } from '../utils/time'

interface Props {
  date: string
}

export function DailySummaryPanel({ date }: Props) {
  const t = useTranslation()
  const [open, setOpen] = useState(false)
  const getDailySummary = useAppStore((s) => s.getDailySummary)
  const getDayTotalMinutes = useAppStore((s) => s.getDayTotalMinutes)
  const getTargetForDay = useAppStore((s) => s.getTargetForDay)
  const toggleDaySync = useAppStore((s) => s.toggleDaySync)
  const addToast = useAppStore((s) => s.addToast)
  const daySynced = useAppStore((s) => !!(s.data.syncedDays?.[date]))

  const targetHours = getTargetForDay(date)

  const summary = getDailySummary(date)
  const totalMinutes = getDayTotalMinutes(date)
  const targetMinutes = targetHours * 60
  const met = totalMinutes >= targetMinutes
  const remaining = targetMinutes - totalMinutes

  const copyToClipboard = () => {
    const lines: string[] = []
    lines.push(`Date: ${formatDateLabel(date)}`)
    lines.push('─'.repeat(42))

    const pad = (s: string, n: number) => s.padEnd(n)
    for (const row of summary) {
      lines.push(`${pad(row.project, 30)} ${formatDurationMinutes(row.minutes)}`)
    }

    lines.push('─'.repeat(42))
    const footer = met
      ? `${pad(t.summary.total, 30)} ${formatDurationMinutes(totalMinutes)}  ✓`
      : `${pad(t.summary.total, 30)} ${formatDurationMinutes(totalMinutes)}  ⚠ ${formatDurationMinutes(remaining)}`
    lines.push(footer)

    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => addToast(t.summary.copied, 'success'))
      .catch(() => addToast(t.summary.copyFailed, 'error'))
  }

  if (summary.length === 0 && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 text-sm text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
      >
        {t.summary.show}
      </button>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.summary.daily}</span>
        <span className="text-gray-400 dark:text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {summary.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-gray-400 dark:text-gray-500">
              {t.summary.noCompleted}
            </p>
          ) : (
            <>
              {/* Table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    <th className="text-left rtl:text-right px-4 py-2 font-medium">{t.summary.project}</th>
                    <th className="text-right rtl:text-left px-4 py-2 font-medium">{t.summary.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row) => (
                    <tr
                      key={row.project}
                      className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-4 py-2.5 text-gray-800 dark:text-gray-200 font-medium">
                        {row.project}
                      </td>
                      <td className="px-4 py-2.5 text-right rtl:text-left font-mono text-gray-600 dark:text-gray-400">
                        {formatDurationMinutes(row.minutes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <td className="px-4 py-2.5 font-bold text-gray-800 dark:text-gray-200">{t.summary.total}</td>
                    <td className="px-4 py-2.5 text-right rtl:text-left font-bold font-mono text-gray-800 dark:text-gray-200">
                      {formatDurationMinutes(totalMinutes)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Status + actions */}
              <div className="px-4 py-3 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-700">
                <span
                  className={`text-sm font-medium ${
                    met ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {met
                    ? t.summary.targetMet(targetHours)
                    : t.summary.targetMissing(formatDurationMinutes(remaining), targetHours)}
                </span>
                <div className="flex items-center gap-2">
                  {/* Day sync toggle */}
                  <button
                    onClick={() => toggleDaySync(date)}
                    title={daySynced ? t.sync.dayNotSynced : t.sync.daySynced}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      daySynced
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${daySynced ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-500'}`} />
                    {daySynced ? t.sync.daySynced : t.sync.dayNotSynced}
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {t.summary.copy}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
