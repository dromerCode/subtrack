import { expect, it } from 'vitest'
import { formatDate, formatMoney, formatRelativeDays, todayIso } from './format'

it('formats euros per language', () => {
  expect(formatMoney(9.99, 'en')).toBe('€9.99')
  expect(formatMoney(9.99, 'es')).toMatch(/^9,99\s€$/)
})

it('formats ISO dates without shifting the day', () => {
  expect(formatDate('2026-01-20', 'en')).toBe('Jan 20, 2026')
  expect(formatDate('2026-12-31', 'en')).toBe('Dec 31, 2026')
})

it('gives today as YYYY-MM-DD', () => {
  expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
})

it('says how far away a charge is, in words', () => {
  const today = new Date(2026, 8, 28)
  expect(formatRelativeDays('2026-09-28', 'en', today)).toBe('today')
  expect(formatRelativeDays('2026-09-29', 'en', today)).toBe('tomorrow')
  expect(formatRelativeDays('2026-10-01', 'en', today)).toBe('in 3 days')
  expect(formatRelativeDays('2026-09-29', 'es', today)).toBe('mañana')
})
