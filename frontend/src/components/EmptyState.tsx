import { Link } from 'react-router'

export function EmptyState({ message, linkLabel, to }: { message: string; linkLabel: string; to: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="text-muted-foreground">{message}</p>
      <Link to={to} className="mt-2 inline-block font-medium underline underline-offset-4">
        {linkLabel}
      </Link>
    </div>
  )
}
