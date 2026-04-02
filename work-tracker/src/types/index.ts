export type WorkBlock = {
  id: string
  project: string
  startTime: string        // "HH:MM" 24-hour — used for display and storage
  startTimestamp?: number  // Date.now() ms — used for live timer accuracy
  endTime: string | null   // null = timer is running
}

export type Lang = 'en' | 'he'

export type AppSettings = {
  dailyTargetHours: number
  weekStartDay: 0 | 1   // 0 = Sunday, 1 = Monday
  timeFormat: '24h' | '12h'
  language: Lang
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
}

export type View = 'day' | 'month' | 'settings'

export type Toast = {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}
