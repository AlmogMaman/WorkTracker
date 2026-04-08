import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useInterval } from '../hooks/useInterval'
import type { WorkBlock } from '../types'
import {
  formatDuration,
  formatLiveDuration,
  isValidTime,
  liveElapsedSeconds,
  parseDurationSeconds,
} from '../utils/time'
import { ProjectAutocomplete } from './ProjectAutocomplete'

interface Props {
  block: WorkBlock
  date: string
  isOverlapping: boolean
  autoFocus: boolean
}

export function WorkBlockRow({ block, date, isOverlapping, autoFocus }: Props) {
  const updateBlock = useAppStore((s) => s.updateBlock)
  const deleteBlock = useAppStore((s) => s.deleteBlock)
  const stopRunningBlock = useAppStore((s) => s.stopRunningBlock)
  const addToast = useAppStore((s) => s.addToast)

  const isRunning = block.endTime === null
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [startErr, setStartErr] = useState(false)
  const [endErr, setEndErr] = useState(false)

  // Tick every second while running
  const [, setTick] = useState(0)
  useInterval(() => setTick((t) => t + 1), isRunning ? 1_000 : null)

  const duration = isRunning
    ? formatLiveDuration(liveElapsedSeconds(block.startTime, block.startTimestamp))
    : formatDuration(parseDurationSeconds(block.startTime, block.endTime))

  const handleProjectChange = (project: string) => {
    updateBlock(date, block.id, { project })
  }

  const handleStartBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!isValidTime(val)) { setStartErr(true); return }
    if (block.endTime && val >= block.endTime) { setStartErr(true); return }
    setStartErr(false)
    updateBlock(date, block.id, { startTime: val })
  }

  const handleEndBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!val) return
    if (!isValidTime(val)) { setEndErr(true); return }
    if (val <= block.startTime) { setEndErr(true); return }
    setEndErr(false)
    updateBlock(date, block.id, { endTime: val })
  }

  const handleStop = () => {
    const stopped = stopRunningBlock()
    addToast(`Stopped: "${stopped || 'block'}"`, 'info')
  }

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteBlock(date, block.id)
    } else {
      setShowDeleteConfirm(true)
      setTimeout(() => setShowDeleteConfirm(false), 3000)
    }
  }

  const borderClass = isOverlapping
    ? 'border-yellow-400 dark:border-yellow-600'
    : isRunning
      ? 'border-blue-300 dark:border-blue-700'
      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'

  const bgClass = isRunning
    ? 'bg-blue-50/50 dark:bg-blue-900/20'
    : 'bg-white dark:bg-gray-800'

  return (
    <div className={`rounded-xl border transition-colors group ${borderClass} ${bgClass}`}>

      {/* ── Row 1: project + actions ── */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
        {isRunning && (
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
        )}

        <ProjectAutocomplete
          value={block.project}
          onChange={handleProjectChange}
          onBlur={() => {}}
          autoFocus={autoFocus}
        />

        {/* Overlap warning */}
        {isOverlapping && (
          <span title="Overlaps another block" className="text-yellow-500 shrink-0 text-sm">⚠</span>
        )}

        {/* Delete / confirm */}
        {showDeleteConfirm ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleDelete}
              className="px-2 py-1 text-xs rounded bg-red-500 hover:bg-red-600 text-white font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
            title="Delete block"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Row 2: times + duration + stop ── */}
      <div className="flex items-center gap-2 px-3 pb-2.5">
        {/* Start time */}
        <input
          type="time"
          defaultValue={block.startTime}
          key={block.startTime}
          onBlur={handleStartBlur}
          onChange={() => setStartErr(false)}
          className={`
            w-[86px] px-1.5 py-1 text-sm rounded-md border text-center
            bg-transparent text-gray-700 dark:text-gray-300
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700
            transition-colors
            ${startErr
              ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-200 dark:border-gray-600'}
          `}
        />

        <span className="text-gray-300 dark:text-gray-600 text-xs shrink-0">→</span>

        {/* End time */}
        {isRunning ? (
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md">
            Now
          </span>
        ) : (
          <input
            type="time"
            defaultValue={block.endTime ?? ''}
            key={block.endTime}
            onBlur={handleEndBlur}
            onChange={() => setEndErr(false)}
            className={`
              w-[86px] px-1.5 py-1 text-sm rounded-md border text-center
              bg-transparent text-gray-700 dark:text-gray-300
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700
              transition-colors
              ${endErr
                ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-600'}
            `}
          />
        )}

        {/* Duration */}
        <span
          className={`text-sm font-mono shrink-0 flex-1 text-right ${
            isRunning
              ? 'text-blue-600 dark:text-blue-400 font-semibold tabular-nums'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {duration || '—'}
        </span>

        {/* Stop button */}
        {isRunning && (
          <button
            onClick={handleStop}
            className="px-3 py-1 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors shrink-0"
          >
            Stop
          </button>
        )}

        {/* Validation errors */}
        {(startErr || endErr) && (
          <span className="text-xs text-red-500 shrink-0">
            {startErr ? 'Bad start' : 'Bad end'}
          </span>
        )}
      </div>
    </div>
  )
}
