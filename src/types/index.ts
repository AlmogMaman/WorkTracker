export type WorkBlock = {
  id: string
  project: string
  startTime: string        // "HH:MM" 24-hour — used for display and storage
  startTimestamp?: number  // Date.now() ms — used for second-level accuracy
  endTime: string | null   // null = timer is running
  endTimestamp?: number    // Date.now() ms — set when timer is stopped; cleared if block is manually edited
}

export type Lang = 'en' | 'he'

export type AppSettings = {
  dailyTargetHours: number
  weekStartDay: 0 | 1   // 0 = Sunday, 1 = Monday
  timeFormat: '24h' | '12h'
  language: Lang
  // Per-day-of-week targets: index 0=Sun … 6=Sat. Value 0 means "day off / no target".
  dayOfWeekTargets: number[]
}

export type RangeTarget = {
  id: string
  from: string   // "YYYY-MM-DD"
  to: string     // "YYYY-MM-DD" (inclusive)
  hours: number
}

export type AppData = {
  version: number
  days: Record<string, WorkBlock[]>      // "YYYY-MM-DD" -> WorkBlock[]
  settings: AppSettings
  projectOrder: string[]                 // most-recently-used first, for autocomplete
  dayTargets: Record<string, number>     // "YYYY-MM-DD" -> hours override
  rangeTargets: RangeTarget[]            // date range overrides
  syncedProjects: Record<string, string[]>  // "YYYY-MM-DD" -> synced project names
  syncedDays: Record<string, boolean>       // "YYYY-MM-DD" -> day-level synced flag
}

export type View = 'day' | 'month' | 'settings'

export type Toast = {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}
