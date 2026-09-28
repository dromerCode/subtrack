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
