import { expect, it } from 'vitest'
import { CATEGORY_COLORS, categoryColor } from './categoryColor'

it('gives each category a fixed colour from the palette', () => {
  expect(categoryColor(1)).toBe(categoryColor(1))
  expect(categoryColor(1)).not.toBe(categoryColor(2))
  expect(categoryColor(1 + CATEGORY_COLORS)).toBe(categoryColor(1))
})

it('uses a neutral colour for subscriptions without a category', () => {
  expect(categoryColor(null)).toBe('var(--category-none)')
})
