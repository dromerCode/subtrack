import { cn } from '@/lib/utils'

/** The "s" monogram (same drawing as public/favicon.svg) with the lowercase wordmark. */
export function Logo({ large = false, className }: { large?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('shrink-0', large ? 'size-10' : 'size-7')}>
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path
          d="M21 10.8c-1.4-1.2-3.2-1.8-5-1.8-2.9 0-4.8 1.4-4.8 3.4 0 4.8 10.1 2.7 10.1 7.5 0 2.2-2.1 3.7-5.2 3.7-2.1 0-4.1-.7-5.7-2"
          fill="none"
          strokeWidth="2.6"
          strokeLinecap="round"
          className="stroke-primary-foreground"
        />
      </svg>
      <span className={cn('font-semibold tracking-tight', large ? 'text-3xl' : 'text-lg')}>subtrack</span>
    </span>
  )
}
