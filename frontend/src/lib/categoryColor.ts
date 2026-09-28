/** Size of the category palette: `--category-1` … `--category-8` in index.css. */
export const CATEGORY_COLORS = 8

/** A category keeps the same colour for as long as it exists; no category gets a neutral one. */
export function categoryColor(categoryId: number | null): string {
  if (categoryId === null) return 'var(--category-none)'
  const slot = (((categoryId - 1) % CATEGORY_COLORS) + CATEGORY_COLORS) % CATEGORY_COLORS
  return `var(--category-${slot + 1})`
}
