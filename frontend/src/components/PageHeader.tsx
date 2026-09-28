import type { ReactNode } from 'react'

/** Page title in the display serif, with an optional action on the right. */
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">{title}</h1>
      {action}
    </div>
  )
}
