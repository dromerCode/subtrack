import { PlusIcon } from 'lucide-react'
import { Link } from 'react-router'

export function EmptyState({ message, linkLabel, to }: { message: string; linkLabel: string; to: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-card/60 px-6 py-12 text-center">
      <p className="text-muted-foreground">{message}</p>
      <Link
        to={to}
        className="mt-3 inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
      >
        <PlusIcon className="size-4" aria-hidden="true" />
        {linkLabel}
      </Link>
    </div>
  )
}
