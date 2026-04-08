import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { useInterval } from '../hooks/useInterval'
import {
  formatDuration,
  formatLiveDuration,
  isValidTime,
  liveElapsedSeconds,
  parseDurationSeconds,
} from '../utils/time'

interface Props {
  project: string
  date: string
}

export function ProjectCard({ project, date }: Props) {
  const t = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(project)

  // ── Reactive selectors (stable references) ──────────────────────────────────
  const rawDayBlocks = useAppStore((s) => s.data.days[date])
  const blocks = (rawDayBlocks ?? []).filter(
    (b) => (b.project.trim() || '(no project)') === project,
  )
  const addBlock = useAppStore((s) => s.addBlock)
  const stopRunningBlock = useAppStore((s) => s.stopRunningBlock)
  const updateBlock = useAppStore((s) => s.updateBlock)
  const deleteBlock = useAppStore((s) => s.deleteBlock)
  const renameProject = useAppStore((s) => s.renameProject)
  const addToast = useAppStore((s) => s.addToast)

  const commitRename = () => {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== project) {
      renameProject(project, trimmed)
      addToast(t.settings.renamed(project, trimmed), 'success')
    }
    setEditingName(false)
  }

  // Is this project's timer running right now?
  const runningBlock = blocks.find((b) => b.endTime === null) ?? null
  const isRunning = runningBlock !== null

  // Is a DIFFERENT project running? (to show as disabled)
  const anyRunningProject = useAppStore((s) => {
    for (const dayBlocks of Object.values(s.data.days)) {
      const r = dayBlocks.find((b) => b.endTime === null)
      if (r) return (r.project.trim() || '(no project)')
    }
    return null
  })
  const otherRunning = anyRunningProject !== null && anyRunningProject !== project

  // Live tick for running block
  const [, setTick] = useState(0)
  useInterval(() => setTick((t) => t + 1), isRunning ? 1_000 : null)

  // ── Totals ───────────────────────────────────────────────────────────────────
  const completedSeconds = blocks
    .filter((b) => b.endTime !== null)
    .reduce((sum, b) => sum + Math.max(0, parseDurationSeconds(b.startTime, b.endTime)), 0)

  const liveSeconds = isRunning
    ? liveElapsedSeconds(runningBlock!.startTime, runningBlock!.startTimestamp)
    : 0

  const totalDisplay = isRunning
    ? formatLiveDuration(completedSeconds + liveSeconds)
    : formatDuration(completedSeconds)

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleStart = () => {
    addBlock(date, project)
    addToast(t.project.started(project), 'success')
  }

  const handleStop = () => {
    stopRunningBlock()
    addToast(t.project.stopped(project), 'info')
  }

  const handleDeleteAll = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    if (isRunning) stopRunningBlock()
    blocks.forEach((b) => deleteBlock(date, b.id))
    addToast(t.project.deleted(project), 'info')
  }

  // ── Manual block editing (expanded view) ────────────────────────────────────
  const handleUpdateStart = (id: string, val: string) => {
    if (!isValidTime(val)) return
    const block = blocks.find((b) => b.id === id)
    if (!block) return
    if (block.endTime && val >= block.endTime) return
    updateBlock(date, id, { startTime: val })
  }

  const handleUpdateEnd = (id: string, val: string) => {
    if (!val) return
    if (!isValidTime(val)) return
    const block = blocks.find((b) => b.id === id)
    if (!block) return
    if (val <= block.startTime) return
    updateBlock(date, id, { endTime: val })
  }

  const handleAddManual = () => {
    if (anyRunningProject) {
      addToast(t.project.stopRunningFirst, 'error')
      return
    }
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const timeStr = `${hh}:${mm}`
    addBlock(date, project)
    const currentBlocks = useAppStore.getState().data.days[date] ?? []
    const newBlock = currentBlocks[currentBlocks.length - 1]
    if (newBlock) {
      updateBlock(date, newBlock.id, { endTime: timeStr })
    }
    setExpanded(true)
    addToast(t.project.manualAdded, 'info')
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime))

  const isActive = isRunning

  return (
    <div
      className={`
        rounded-2xl border-2 transition-all duration-200
        ${isActive
          ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/30 shadow-md shadow-blue-100 dark:shadow-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }
      `}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Running indicator */}
        <div className={`w-3 h-3 rounded-full shrink-0 transition-all ${isActive ? 'bg-blue-500 animate-pulse' : 'bg-gray-200 dark:bg-gray-600'}`} />

        {/* Project name + total */}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') { setNameValue(project); setEditingName(false) }
              }}
              className="w-full px-2 py-0.5 text-base font-semibold rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          ) : (
            <div
              className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 group/name"
              onClick={() => { setNameValue(project); setEditingName(true) }}
              title={t.settings.rename}
            >
              {project}
              <span className="ml-1 text-xs text-gray-300 dark:text-gray-600 group-hover/name:text-blue-400 dark:group-hover/name:text-blue-500">✎</span>
            </div>
          )}
          <div className={`text-sm font-mono font-bold tabular-nums ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {totalDisplay || '0m'}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 rounded transition-colors"
          title={expanded ? '' : `${blocks.length}`}
        >
          {blocks.length} {expanded ? '▲' : '▼'}
        </button>

        {/* Delete entire project */}
        {confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleDeleteAll}
              className="px-2 py-1 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              {t.project.delete}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-semibold"
            >
              {t.project.no}
            </button>
          </div>
        ) : (
          <button
            onClick={handleDeleteAll}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm shrink-0"
            title={t.project.delete}
          >
            🗑
          </button>
        )}

        {/* Start / Stop button */}
        {isActive ? (
          <button
            onClick={handleStop}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors shrink-0 min-w-[72px]"
          >
            ■ {t.project.stop}
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={!!otherRunning}
            className={`
              px-4 py-2 rounded-xl font-semibold text-sm transition-colors shrink-0 min-w-[72px]
              ${otherRunning
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
              }
            `}
            title={otherRunning ? t.project.stopFirst(anyRunningProject!) : t.project.startOn(project)}
          >
            ▶ {t.project.start}
          </button>
        )}
      </div>

      {/* ── Expanded blocks ── */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-3 pt-2 flex flex-col gap-2">
          {sortedBlocks.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-1">{t.project.noBlocks}</p>
          ) : (
            sortedBlocks.map((block) => {
              const blockSecs = parseDurationSeconds(block.startTime, block.endTime)
              const blockIsRunning = block.endTime === null
              return (
                <div
                  key={block.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                    blockIsRunning
                      ? 'bg-blue-100/60 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700'
                  }`}
                >
                  {blockIsRunning && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />}

                  {/* Start time */}
                  <input
                    type="time"
                    defaultValue={block.startTime}
                    key={`s-${block.id}-${block.startTime}`}
                    onBlur={(e) => handleUpdateStart(block.id, e.target.value)}
                    className="w-[82px] px-1.5 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <span className="text-gray-300 dark:text-gray-600 text-xs">→</span>

                  {/* End time */}
                  {blockIsRunning ? (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-lg">
                      {t.project.now}
                    </span>
                  ) : (
                    <input
                      type="time"
                      defaultValue={block.endTime ?? ''}
                      key={`e-${block.id}-${block.endTime}`}
                      onBlur={(e) => handleUpdateEnd(block.id, e.target.value)}
                      className="w-[82px] px-1.5 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}

                  {/* Block duration */}
                  <span className={`text-xs font-mono flex-1 text-right rtl:text-left ${blockIsRunning ? 'text-blue-600 dark:text-blue-400 font-semibold tabular-nums' : 'text-gray-500 dark:text-gray-400'}`}>
                    {blockIsRunning
                      ? formatLiveDuration(liveElapsedSeconds(block.startTime, block.startTimestamp))
                      : blockSecs > 0 ? formatDuration(blockSecs) : '—'}
                  </span>

                  {/* Delete block */}
                  <button
                    onClick={() => deleteBlock(date, block.id)}
                    className="w-6 h-6 flex items-center justify-center rounded text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs"
                    title={t.project.delete}
                  >
                    ✕
                  </button>
                </div>
              )
            })
          )}

          {/* Add manual block */}
          <button
            onClick={handleAddManual}
            className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
          >
            <span className="text-base leading-none">+</span>
            {t.project.addManual}
          </button>
        </div>
      )}
    </div>
  )
}
