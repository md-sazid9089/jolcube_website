/** Small date helpers — everything in the prototype is anchored to "today". */

export function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function today(): string {
  return iso(new Date())
}

/** ISO date `n` days from today (negative = past). */
export function dayOffset(n: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return iso(d)
}

/** ISO datetime `n` days back, at a given hour/minute. */
export function stamp(daysBack: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysBack)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function daysBetween(a: string, b: string): number {
  const ms = new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()
  return Math.round(ms / 86400000)
}

/** Days until `date` from today. Negative means overdue. */
export function daysUntil(date: string): number {
  return daysBetween(today(), date)
}

export function monthStart(): string {
  const d = new Date()
  return iso(new Date(d.getFullYear(), d.getMonth(), 1))
}
