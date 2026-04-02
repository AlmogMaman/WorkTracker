import { useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { exportDataJson, importDataJson } from '../utils/storage'
import { todayStr } from '../utils/time'

export function SettingsView() {
  const t = useTranslation()
  const settings = useAppStore((s) => s.data.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const renameProject = useAppStore((s) => s.renameProject)
  const removeProjectFromSuggestions = useAppStore((s) => s.removeProjectFromSuggestions)
  const data = useAppStore((s) => s.data)
  const addToast = useAppStore((s) => s.addToast)
  const replaceAllData = useAppStore((s) => s.replaceAllData)
  const addRangeTarget = useAppStore((s) => s.addRangeTarget)
  const removeRangeTarget = useAppStore((s) => s.removeRangeTarget)
  const setDayTarget = useAppStore((s) => s.setDayTarget)
  const rangeTargets = useAppStore((s) => s.data.rangeTargets ?? [])
  const dayTargets = useAppStore((s) => s.data.dayTargets ?? {})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const projects = useAppStore((s) => s.data.projectOrder ?? [])

  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const today = todayStr()
  const [rangeFrom, setRangeFrom] = useState(today)
  const [rangeTo, setRangeTo] = useState(today)
  const [rangeHours, setRangeHours] = useState('8')

  const startEdit = (name: string) => {
    setEditingProject(name)
    setEditValue(name)
  }

  const commitEdit = () => {
    if (editingProject && editValue.trim() && editValue !== editingProject) {
      renameProject(editingProject, editValue.trim())
      addToast(t.settings.renamed(editingProject, editValue.trim()), 'success')
    }
    setEditingProject(null)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importDataJson(file)
      replaceAllData(imported)
      addToast(t.settings.importSuccess, 'success')
    } catch {
      addToast(t.settings.importFailed, 'error')
    }
    e.target.value = ''
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-8 flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.settings.title}</h1>

      {/* General */}
      <Section title={t.settings.general}>
        <Row label={t.settings.dailyTarget} hint={t.settings.dailyTargetHint}>
          <input
            type="number"
            min={1}
            max={24}
            value={settings.dailyTargetHours}
            onChange={(e) => updateSettings({ dailyTargetHours: Math.max(1, Math.min(24, Number(e.target.value))) })}
            className="w-20 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">{t.settings.hours}</span>
        </Row>

        <Row label={t.settings.weekStart}>
          <ToggleGroup
            options={[
              { label: t.settings.sunday, value: 0 },
              { label: t.settings.monday, value: 1 },
            ]}
            value={settings.weekStartDay}
            onChange={(v) => updateSettings({ weekStartDay: v as 0 | 1 })}
          />
        </Row>

        <Row label={t.settings.timeFormat}>
          <ToggleGroup
            options={[
              { label: '24h', value: '24h' },
              { label: '12h AM/PM', value: '12h' },
            ]}
            value={settings.timeFormat}
            onChange={(v) => updateSettings({ timeFormat: v as '24h' | '12h' })}
          />
        </Row>

        <Row label={t.settings.language}>
          <ToggleGroup
            options={[
              { label: t.settings.english, value: 'en' },
              { label: t.settings.hebrew, value: 'he' },
            ]}
            value={settings.language ?? 'en'}
            onChange={(v) => updateSettings({ language: v as 'en' | 'he' })}
          />
        </Row>
      </Section>

      {/* Project name manager */}
      <Section title={t.settings.projectNames}>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {t.settings.projectNamesHint}
        </p>
        {projects.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            {t.settings.noProjects}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {projects.map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 group"
              >
                {editingProject === name ? (
                  <>
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') setEditingProject(null)
                      }}
                      className="flex-1 px-2 py-1 text-sm rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <button
                      onClick={commitEdit}
                      className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      {t.settings.save}
                    </button>
                    <button
                      onClick={() => setEditingProject(null)}
                      className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300"
                    >
                      {t.settings.cancel}
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-medium">{name}</span>
                    <button
                      onClick={() => startEdit(name)}
                      className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {t.settings.rename}
                    </button>
                    <button
                      onClick={() => {
                        removeProjectFromSuggestions(name)
                        addToast(t.settings.removedProject(name), 'info')
                      }}
                      className="text-xs px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {t.settings.remove}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Custom Targets */}
      <Section title={t.settings.customTargets}>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          {t.settings.customTargetsHint}
        </p>

        {/* Day overrides */}
        {Object.keys(dayTargets).length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {t.settings.dayOverrides}
            </div>
            <div className="flex flex-col gap-1">
              {Object.entries(dayTargets)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, hours]) => (
                  <div
                    key={date}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 group"
                  >
                    <span className="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300">{date}</span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{hours}{t.progress.hoursUnit}</span>
                    <button
                      onClick={() => {
                        setDayTarget(date, null)
                        addToast(t.settings.clearTarget(date), 'info')
                      }}
                      className="text-xs px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {t.settings.remove}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Range overrides */}
        {rangeTargets.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {t.settings.rangeOverrides}
            </div>
            <div className="flex flex-col gap-1">
              {rangeTargets.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 group"
                >
                  <span className="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300">
                    {r.from} → {r.to}
                  </span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{r.hours}{t.progress.hoursUnit}</span>
                  <button
                    onClick={() => {
                      removeRangeTarget(r.id)
                      addToast(t.settings.rangeRemoved, 'info')
                    }}
                    className="text-xs px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {t.settings.remove}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add range target form */}
        <div className="p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {t.settings.addRange}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">{t.settings.from}</label>
              <input
                type="date"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                className="px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">{t.settings.to}</label>
              <input
                type="date"
                value={rangeTo}
                min={rangeFrom}
                onChange={(e) => setRangeTo(e.target.value)}
                className="px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">{t.settings.hoursPerDay}</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0.5}
                  max={24}
                  step={0.5}
                  value={rangeHours}
                  onChange={(e) => setRangeHours(e.target.value)}
                  className="w-16 px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">{t.progress.hoursUnit}</span>
              </div>
            </div>
            <button
              onClick={() => {
                const h = parseFloat(rangeHours)
                if (!rangeFrom || !rangeTo || isNaN(h) || h < 0.5 || h > 24 || rangeFrom > rangeTo) {
                  addToast(t.settings.invalidRange, 'error')
                  return
                }
                addRangeTarget(rangeFrom, rangeTo, h)
                addToast(t.settings.rangeAdded(rangeFrom, rangeTo, h), 'success')
              }}
              className="px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {t.settings.add}
            </button>
          </div>
        </div>
      </Section>

      {/* Data */}
      <Section title={t.settings.data}>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              exportDataJson(data)
              addToast(t.settings.exportSuccess, 'success')
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          >
            {t.settings.exportBtn}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          >
            {t.settings.importBtn}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {t.settings.dataHint}
        </p>
      </Section>

      {/* Keyboard shortcuts */}
      <Section title={t.settings.shortcuts}>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {t.shortcuts.map(([key, desc]) => (
            <div key={key} className="flex items-center gap-3">
              <kbd className="px-2 py-1 text-xs font-mono rounded bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 shrink-0">
                {key}
              </kbd>
              <span className="text-gray-600 dark:text-gray-400">{desc}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

function Row({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
        {hint && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{hint}</div>}
      </div>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  )
}

function ToggleGroup<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={`
            px-3 py-1.5 text-sm font-medium transition-colors
            ${
              value === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
