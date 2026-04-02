import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { formatDuration, formatMonthLabel } from '../utils/time'

interface Props {
  yearMonth: string
}

export function MonthSummaryTable({ yearMonth }: Props) {
  const t = useTranslation()
  const getMonthlySummary = useAppStore((s) => s.getMonthlySummary)
  const addToast = useAppStore((s) => s.addToast)

  const summary = getMonthlySummary(yearMonth)
  const totalMinutes = summary.reduce((s, r) => s + r.minutes, 0)

  const exportTxt = () => {
    const pad = (s: string, n: number) => s.padEnd(n)
    const lines: string[] = [
      t.month.monthlySummary(formatMonthLabel(yearMonth, t.locale)),
      '─'.repeat(44),
      ...summary.map((r) => `${pad(r.project, 32)} ${formatDuration(r.minutes)}`),
      '─'.repeat(44),
      `${pad(t.month.total, 32)} ${formatDuration(totalMinutes)}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `worktracker-${yearMonth}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addToast(t.month.exported, 'success')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t.month.breakdown(formatMonthLabel(yearMonth, t.locale))}
        </h3>
        {summary.length > 0 && (
          <button
            onClick={exportTxt}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          >
            {t.month.exportTxt}
          </button>
        )}
      </div>

      {summary.length === 0 ? (
        <p className="px-4 py-8 text-sm text-center text-gray-400 dark:text-gray-500">
          {t.month.noData}
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              <th className="text-left rtl:text-right px-4 py-2 font-medium">{t.month.project}</th>
              <th className="text-right rtl:text-left px-4 py-2 font-medium">{t.month.total}</th>
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
                  {formatDuration(row.minutes)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <td className="px-4 py-2.5 font-bold text-gray-800 dark:text-gray-200">{t.month.total}</td>
              <td className="px-4 py-2.5 text-right rtl:text-left font-bold font-mono text-gray-800 dark:text-gray-200">
                {formatDuration(totalMinutes)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  )
}
