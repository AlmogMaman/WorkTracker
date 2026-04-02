/** Elapsed seconds since a block started. Uses the exact ms timestamp when available. */
export function liveElapsedSeconds(startTime: string, startTimestamp?: number): number {
  if (startTimestamp) {
    return Math.floor((Date.now() - startTimestamp) / 1000)
  }
  // Fallback: derive from HH:MM (minute-level precision)
  const now = new Date()
  const [sh, sm] = startTime.split(':').map(Number)
  const startSec = sh * 3600 + sm * 60
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  return Math.max(0, nowSec - startSec)
}

/** Format seconds as a ticking "Xh Ym Zs" string for live timers. */
export function formatLiveDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m}m ${String(s).padStart(2, '0')}s`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export function nowHHMM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function todayStr(): string {
  return dateToStr(new Date())
}

export function dateToStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return dateToStr(d)
}

export function formatDateLabel(dateStr: string, locale = 'en-US'): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatMonthLabel(yearMonth: string, locale = 'en-US'): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const d = new Date(year, month - 1, 1)
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

/** Returns duration in minutes. Uses current time if endTime is null. */
export function parseDurationMinutes(startTime: string, endTime: string | null): number {
  const end = endTime ?? nowHHMM()
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

export function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr()
}

export function isPast(dateStr: string): boolean {
  return dateStr < todayStr()
}

export function isFuture(dateStr: string): boolean {
  return dateStr > todayStr()
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Returns 0=Sunday … 6=Saturday for the 1st of the month */
export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDay()
}

export function isWeekend(dateStr: string): boolean {
  const dow = getDayOfWeek(dateStr)
  return dow === 0 || dow === 6
}

/** "2026-03" from a "YYYY-MM-DD" date string */
export function yearMonthOf(dateStr: string): string {
  return dateStr.slice(0, 7)
}

/** "2026-03" -> { year: 2026, month: 2 }  (month is 0-indexed) */
export function parseYearMonth(ym: string): { year: number; month: number } {
  const [y, m] = ym.split('-').map(Number)
  return { year: y, month: m - 1 }
}

export function addMonths(ym: string, n: number): string {
  const { year, month } = parseYearMonth(ym)
  const d = new Date(year, month + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function currentYearMonth(): string {
  return todayStr().slice(0, 7)
}

/** Validate a "HH:MM" string */
export function isValidTime(t: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(t)) return false
  const [h, m] = t.split(':').map(Number)
  return h >= 0 && h <= 23 && m >= 0 && m <= 59
}

/** Check if two blocks overlap */
export function blocksOverlap(
  a: { startTime: string; endTime: string | null },
  b: { startTime: string; endTime: string | null },
): boolean {
  const aEnd = a.endTime ?? nowHHMM()
  const bEnd = b.endTime ?? nowHHMM()
  return a.startTime < bEnd && aEnd > b.startTime
}
