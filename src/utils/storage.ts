import type { AppData, AppSettings, Lang, RangeTarget, WorkBlock } from '../types'

const STORAGE_KEY = 'worktracker_v1'
const CURRENT_VERSION = 1
const MAX_IMPORT_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_PROJECT_NAME_LENGTH = 200

const defaultSettings: AppSettings = {
  dailyTargetHours: 9,
  weekStartDay: 0,
  timeFormat: '24h',
  language: 'en',
}

function createDefault(): AppData {
  return {
    version: CURRENT_VERSION,
    days: {},
    settings: { ...defaultSettings },
    projectOrder: [],
    dayTargets: {},
    rangeTargets: [],
    syncedProjects: {},
    syncedDays: {},
  }
}

/** Sanitize a project name: strip dangerous chars, cap length. */
export function sanitizeProjectName(name: string): string {
  return name.replace(/[<>"'&]/g, '').trim().slice(0, MAX_PROJECT_NAME_LENGTH)
}

/** Validate that a block has a sensible shape. */
function isValidBlock(b: unknown): b is WorkBlock {
  if (typeof b !== 'object' || b === null) return false
  const obj = b as Record<string, unknown>
  return (
    typeof obj.id === 'string' &&
    typeof obj.project === 'string' &&
    typeof obj.startTime === 'string' &&
    (obj.endTime === null || typeof obj.endTime === 'string')
  )
}

/** Validate and sanitize the days record. */
function validateDays(raw: unknown): Record<string, WorkBlock[]> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const result: Record<string, WorkBlock[]> = {}
  for (const [date, blocks] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    if (!Array.isArray(blocks)) continue
    const valid = blocks.filter(isValidBlock).map((b) => ({
      ...b,
      project: sanitizeProjectName(b.project),
    }))
    if (valid.length > 0) result[date] = valid
  }
  return result
}

/** Validate and sanitize settings. */
function validateSettings(raw: unknown): AppSettings {
  const base = { ...defaultSettings }
  if (typeof raw !== 'object' || raw === null) return base
  const obj = raw as Record<string, unknown>
  if (typeof obj.dailyTargetHours === 'number') {
    base.dailyTargetHours = Math.max(1, Math.min(24, obj.dailyTargetHours))
  }
  if (obj.weekStartDay === 0 || obj.weekStartDay === 1) {
    base.weekStartDay = obj.weekStartDay
  }
  if (obj.timeFormat === '24h' || obj.timeFormat === '12h') {
    base.timeFormat = obj.timeFormat
  }
  if (obj.language === 'en' || obj.language === 'he') {
    base.language = obj.language as Lang
  }
  return base
}

/** Validate and sanitize dayTargets. */
function validateDayTargets(raw: unknown): Record<string, number> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const result: Record<string, number> = {}
  for (const [date, hours] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    if (typeof hours !== 'number' || hours < 0.5 || hours > 24) continue
    result[date] = hours
  }
  return result
}

/** Validate and sanitize rangeTargets. */
function validateRangeTargets(raw: unknown): RangeTarget[] {
  if (!Array.isArray(raw)) return []
  const result: RangeTarget[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const obj = item as Record<string, unknown>
    if (
      typeof obj.id === 'string' &&
      typeof obj.from === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.from) &&
      typeof obj.to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.to) &&
      typeof obj.hours === 'number' && obj.hours >= 0.5 && obj.hours <= 24 &&
      obj.from <= obj.to
    ) {
      result.push({ id: obj.id, from: obj.from, to: obj.to, hours: obj.hours })
    }
  }
  return result
}

/** Validate and sanitize projectOrder. */
function validateProjectOrder(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .map((p) => sanitizeProjectName(p))
}

/** Validate and sanitize syncedProjects. */
function validateSyncedProjects(raw: unknown): Record<string, string[]> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const result: Record<string, string[]> = {}
  for (const [date, projects] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    if (!Array.isArray(projects)) continue
    result[date] = projects.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
  }
  return result
}

/** Validate and sanitize syncedDays. */
function validateSyncedDays(raw: unknown): Record<string, boolean> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const result: Record<string, boolean> = {}
  for (const [date, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    if (typeof val === 'boolean') result[date] = val
  }
  return result
}

function migrate(raw: unknown): AppData {
  const base = createDefault()
  if (typeof raw !== 'object' || raw === null) return base
  const obj = raw as Record<string, unknown>
  return {
    version: CURRENT_VERSION,
    days: validateDays(obj.days),
    settings: validateSettings(obj.settings),
    projectOrder: validateProjectOrder(obj.projectOrder),
    dayTargets: validateDayTargets(obj.dayTargets),
    rangeTargets: validateRangeTargets(obj.rangeTargets),
    syncedProjects: validateSyncedProjects(obj.syncedProjects),
    syncedDays: validateSyncedDays(obj.syncedDays),
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefault()
    return migrate(JSON.parse(raw))
  } catch {
    return createDefault()
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function exportDataJson(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'worktracker-backup.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importDataJson(file: File): Promise<AppData> {
  if (file.size > MAX_IMPORT_SIZE) {
    return Promise.reject(new Error('File too large (max 5 MB)'))
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string)
        resolve(migrate(parsed))
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
