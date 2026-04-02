import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { AppData, AppSettings, RangeTarget, Toast, View, WorkBlock } from '../types'
import { loadData, sanitizeProjectName, saveData } from '../utils/storage'
import { nowHHMM, parseDurationMinutes, todayStr } from '../utils/time'

// ─── Debounced persist ────────────────────────────────────────────────────────

let _persistTimer: ReturnType<typeof setTimeout> | null = null
function schedulePersist(data: AppData) {
  if (_persistTimer) clearTimeout(_persistTimer)
  _persistTimer = setTimeout(() => saveData(data), 400)
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface AppStore {
  data: AppData
  selectedDate: string
  view: View
  toasts: Toast[]

  // Navigation
  setSelectedDate: (date: string) => void
  setView: (view: View) => void

  // Block mutations
  addBlock: (date: string, project?: string) => string | null   // returns stopped-project name (if any)
  stopRunningBlock: () => string | null        // returns stopped-project name
  updateBlock: (date: string, id: string, changes: Partial<WorkBlock>) => void
  deleteBlock: (date: string, id: string) => void

  // Queries (pure, derived from data)
  getDayBlocks: (date: string) => WorkBlock[]
  getRunningBlock: () => { block: WorkBlock; date: string } | null
  getDayTotalMinutes: (date: string) => number
  getDailySummary: (date: string) => { project: string; minutes: number }[]
  getMonthlySummary: (yearMonth: string) => { project: string; minutes: number }[]
  getMonthDayTotals: (yearMonth: string) => Record<string, number>
  getAllProjectNames: () => string[]
  getOverlappingIds: (date: string) => Set<string>

  // Get project names that have at least one block on a given date
  getDayProjects: (date: string) => string[]

  // Project management
  renameProject: (oldName: string, newName: string) => void
  removeProjectFromSuggestions: (name: string) => void

  // Custom targets
  setDayTarget: (date: string, hours: number | null) => void
  addRangeTarget: (from: string, to: string, hours: number) => void
  removeRangeTarget: (id: string) => void
  getTargetForDay: (date: string) => number

  // Data replacement (used by import)
  replaceAllData: (data: AppData) => void

  // Settings
  updateSettings: (changes: Partial<AppSettings>) => void

  // Toasts
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => ({
  data: loadData(),
  selectedDate: todayStr(),
  view: 'day',
  toasts: [],

  // ── Navigation ──────────────────────────────────────────────────────────────

  setSelectedDate: (date) => set({ selectedDate: date }),
  setView: (view) => set({ view }),

  // ── Block mutations ─────────────────────────────────────────────────────────

  addBlock: (date, project) => {
    const state = get()
    let stoppedProject: string | null = null

    // Stop any currently running block first
    const running = state.getRunningBlock()
    if (running) {
      stoppedProject = running.block.project || null
      state.stopRunningBlock()
    }

    const safeProject = project ? sanitizeProjectName(project) : ''

    const newBlock: WorkBlock = {
      id: uuidv4(),
      project: safeProject,
      startTime: nowHHMM(),
      startTimestamp: Date.now(),
      endTime: null,
    }

    // Also bump this project to top of suggestion list
    if (safeProject) {
      set((prev) => {
        const projectOrder = [safeProject, ...(prev.data.projectOrder ?? []).filter((p) => p !== safeProject)]
        const newData = { ...prev.data, projectOrder }
        return { data: newData }
      })
    }

    set((prev) => {
      const days = { ...prev.data.days }
      days[date] = [...(days[date] ?? []), newBlock]
      const newData = { ...prev.data, days }
      schedulePersist(newData)
      return { data: newData }
    })

    return stoppedProject
  },

  stopRunningBlock: () => {
    const running = get().getRunningBlock()
    if (!running) return null

    const { block, date } = running
    set((prev) => {
      const days = { ...prev.data.days }
      days[date] = days[date].map((b) =>
        b.id === block.id ? { ...b, endTime: nowHHMM() } : b,
      )
      const newData = { ...prev.data, days }
      schedulePersist(newData)
      return { data: newData }
    })

    return block.project || null
  },

  updateBlock: (date, id, changes) => {
    // Sanitize project name if provided
    const safeChanges = changes.project !== undefined
      ? { ...changes, project: sanitizeProjectName(changes.project) }
      : changes

    set((prev) => {
      const days = { ...prev.data.days }
      if (!days[date]) return prev

      days[date] = days[date].map((b) => (b.id === id ? { ...b, ...safeChanges } : b))

      // Bubble project name to top of suggestion list
      let projectOrder = [...(prev.data.projectOrder ?? [])]
      const newProject = safeChanges.project?.trim()
      if (newProject) {
        projectOrder = [newProject, ...projectOrder.filter((p) => p !== newProject)]
      }

      const newData = { ...prev.data, days, projectOrder }
      schedulePersist(newData)
      return { data: newData }
    })
  },

  deleteBlock: (date, id) => {
    set((prev) => {
      const days = { ...prev.data.days }
      if (!days[date]) return prev

      days[date] = days[date].filter((b) => b.id !== id)
      if (days[date].length === 0) delete days[date]

      const newData = { ...prev.data, days }
      schedulePersist(newData)
      return { data: newData }
    })
  },

  // ── Queries ─────────────────────────────────────────────────────────────────

  getDayBlocks: (date) => {
    const blocks = get().data.days[date] ?? []
    return [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime))
  },

  getRunningBlock: () => {
    for (const [date, blocks] of Object.entries(get().data.days)) {
      const running = blocks.find((b) => b.endTime === null)
      if (running) return { block: running, date }
    }
    return null
  },

  getDayTotalMinutes: (date) => {
    const blocks = get().getDayBlocks(date)
    return blocks.reduce((sum, b) => {
      const mins = parseDurationMinutes(b.startTime, b.endTime)
      return sum + Math.max(0, mins)
    }, 0)
  },

  getDailySummary: (date) => {
    const blocks = get().getDayBlocks(date)
    const totals: Record<string, number> = {}
    for (const b of blocks) {
      const mins = parseDurationMinutes(b.startTime, b.endTime)
      if (mins > 0) {
        const key = b.project.trim() || '(no project)'
        totals[key] = (totals[key] ?? 0) + mins
      }
    }
    return Object.entries(totals)
      .map(([project, minutes]) => ({ project, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
  },

  getMonthlySummary: (yearMonth) => {
    const totals: Record<string, number> = {}
    for (const [date, blocks] of Object.entries(get().data.days)) {
      if (!date.startsWith(yearMonth)) continue
      for (const b of blocks) {
        const mins = parseDurationMinutes(b.startTime, b.endTime)
        if (mins > 0) {
          const key = b.project.trim() || '(no project)'
          totals[key] = (totals[key] ?? 0) + mins
        }
      }
    }
    return Object.entries(totals)
      .map(([project, minutes]) => ({ project, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
  },

  getMonthDayTotals: (yearMonth) => {
    const result: Record<string, number> = {}
    for (const [date, blocks] of Object.entries(get().data.days)) {
      if (!date.startsWith(yearMonth)) continue
      result[date] = blocks.reduce((sum, b) => {
        const mins = parseDurationMinutes(b.startTime, b.endTime)
        return sum + Math.max(0, mins)
      }, 0)
    }
    return result
  },

  getAllProjectNames: () => {
    return get().data.projectOrder ?? []
  },

  getDayProjects: (date) => {
    const blocks = get().getDayBlocks(date)
    const seen = new Set<string>()
    const result: string[] = []
    for (const b of blocks) {
      const key = b.project.trim() || '(no project)'
      if (!seen.has(key)) { seen.add(key); result.push(key) }
    }
    return result
  },

  getOverlappingIds: (date) => {
    const blocks = get().getDayBlocks(date)
    const overlapping = new Set<string>()
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const a = blocks[i]
        const b = blocks[j]
        const aEnd = a.endTime ?? nowHHMM()
        const bEnd = b.endTime ?? nowHHMM()
        if (a.startTime < bEnd && aEnd > b.startTime) {
          overlapping.add(a.id)
          overlapping.add(b.id)
        }
      }
    }
    return overlapping
  },

  // ── Project management ──────────────────────────────────────────────────────

  renameProject: (oldName, newName) => {
    const trimmed = sanitizeProjectName(newName)
    if (!trimmed || oldName === trimmed) return

    set((prev) => {
      const days = { ...prev.data.days }
      for (const date of Object.keys(days)) {
        days[date] = days[date].map((b) =>
          b.project === oldName ? { ...b, project: trimmed } : b,
        )
      }
      const projectOrder = (prev.data.projectOrder ?? []).map((p) =>
        p === oldName ? trimmed : p,
      )
      const newData = { ...prev.data, days, projectOrder }
      schedulePersist(newData)
      return { data: newData }
    })
  },

  removeProjectFromSuggestions: (name) => {
    set((prev) => {
      const projectOrder = (prev.data.projectOrder ?? []).filter((p) => p !== name)
      const newData = { ...prev.data, projectOrder }
      schedulePersist(newData)
      return { data: newData }
    })
  },

  // ── Custom targets ──────────────────────────────────────────────────────────

  setDayTarget: (date, hours) => {
    set((prev) => {
      const dayTargets = { ...(prev.data.dayTargets ?? {}) }
      if (hours === null) {
        delete dayTargets[date]
      } else {
        dayTargets[date] = Math.max(0.5, Math.min(24, hours))
      }
      const newData = { ...prev.data, dayTargets }
      schedulePersist(newData)
      return { data: newData }
    })
  },

  addRangeTarget: (from, to, hours) => {
    set((prev) => {
      const newTarget: RangeTarget = {
        id: uuidv4(),
        from,
        to,
        hours: Math.max(0.5, Math.min(24, hours)),
      }
      const rangeTargets = [...(prev.data.rangeTargets ?? []), newTarget]
      const newData = { ...prev.data, rangeTargets }
      schedulePersist(newData)
      return { data: newData }
    })
  },

  removeRangeTarget: (id) => {
    set((prev) => {
      const rangeTargets = (prev.data.rangeTargets ?? []).filter((r) => r.id !== id)
      const newData = { ...prev.data, rangeTargets }
      schedulePersist(newData)
      return { data: newData }
    })
  },

  getTargetForDay: (date) => {
    const { dayTargets, rangeTargets, settings } = get().data
    // 1. Day-specific override (highest priority)
    if (dayTargets?.[date] !== undefined) return dayTargets[date]
    // 2. First matching range target
    for (const r of (rangeTargets ?? [])) {
      if (date >= r.from && date <= r.to) return r.hours
    }
    // 3. Global setting fallback
    return settings.dailyTargetHours
  },

  // ── Data replacement ────────────────────────────────────────────────────────

  replaceAllData: (data) => {
    saveData(data)
    set({ data })
  },

  // ── Settings ────────────────────────────────────────────────────────────────

  updateSettings: (changes) => {
    set((prev) => {
      const settings = { ...prev.data.settings, ...changes }
      const newData = { ...prev.data, settings }
      schedulePersist(newData)
      return { data: newData }
    })
  },

  // ── Toasts (max 5 visible, rate-limited) ─────────────────────────────────────

  addToast: (message, type = 'info') => {
    const current = get().toasts
    // Rate limit: max 5 toasts at once
    if (current.length >= 5) return
    // Deduplicate: don't show the same message twice in a row
    if (current.length > 0 && current[current.length - 1].message === message) return

    const id = uuidv4()
    set((prev) => ({ toasts: [...prev.toasts, { id, message, type }] }))
    setTimeout(() => get().removeToast(id), 3000)
  },

  removeToast: (id) => {
    set((prev) => ({ toasts: prev.toasts.filter((t) => t.id !== id) }))
  },
}))
