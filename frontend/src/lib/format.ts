export function formatMoney(amount: number, language: string): string {
  return new Intl.NumberFormat(language, { style: 'currency', currency: 'EUR' }).format(amount)
}

/** Formats a `YYYY-MM-DD` date as a local date (never through UTC, which could shift the day). */
export function formatDate(isoDate: string, language: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(year, month - 1, day),
  )
}

/** Today's local date as `YYYY-MM-DD`. */
export function todayIso(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** "today", "tomorrow", "in 3 days"… for a `YYYY-MM-DD` date, counted in whole local days. */
export function formatRelativeDays(isoDate: string, language: string, today: Date = new Date()): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const days = Math.round(
    (Date.UTC(year, month - 1, day) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86_400_000,
  )
  return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(days, 'day')
}
