import { useQuery } from '@tanstack/react-query'
import { type ReactNode, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { useSubscriptions } from '@/features/subscriptions/hooks'
import { api } from '@/lib/api'
import { categoryColor } from '@/lib/categoryColor'
import { formatDate, formatMoney, formatRelativeDays } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import type { Dashboard } from '@/lib/types'

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className="mb-3 text-sm font-semibold">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Dot({ color }: { color: string }) {
  return <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
}

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const dashboard = useQuery({ queryKey: queryKeys.dashboard, queryFn: () => api<Dashboard>('/api/dashboard') })
  // The dashboard API has no categories per charge; the subscription list (usually cached) supplies them.
  const subscriptions = useSubscriptions()
  const categoryOf = new Map(subscriptions.data?.map((s) => [s.id, s.category?.id ?? null]))
  const activeCount = subscriptions.data?.filter((s) => s.active).length

  const header = <PageHeader title={t('dashboard.title')} />
  if (!dashboard.data) {
    return (
      <div className="space-y-8">
        {header}
        {dashboard.isPending && <p className="text-muted-foreground">{t('common.loading')}</p>}
      </div>
    )
  }

  const { monthlyTotal, yearlyTotal, upcoming, byCategory } = dashboard.data
  if (byCategory.length === 0) {
    return (
      <div className="space-y-8">
        {header}
        <EmptyState message={t('dashboard.empty')} linkLabel={t('dashboard.addFirst')} to="/subscriptions/new" />
      </div>
    )
  }

  const next = upcoming[0]
  const totalMonthly = byCategory.reduce((sum, c) => sum + c.monthly, 0)
  const percent = new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 0 })

  return (
    <div className="space-y-10">
      {header}

      <div className="grid gap-6 md:grid-cols-[1fr_minmax(16rem,20rem)] md:items-end">
        <div>
          <p className="font-display text-6xl leading-none font-semibold tracking-tight tabular-nums sm:text-7xl">
            {formatMoney(monthlyTotal, language)}
          </p>
          <p className="mt-2 text-lg text-muted-foreground">{t('dashboard.perMonth')}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">{formatMoney(yearlyTotal, language)}</span>{' '}
            {t('dashboard.perYear')}
            {activeCount !== undefined && (
              <>
                <span aria-hidden="true"> · </span>
                <span>{t('dashboard.activeCount', { count: activeCount })}</span>
              </>
            )}
          </p>
        </div>

        {next && (
          <Section title={t('dashboard.nextCharge')} className="rounded-xl bg-accent p-5 text-accent-foreground">
            <p className="truncate text-xl font-semibold">{next.name}</p>
            <p className="mt-1 flex items-baseline justify-between gap-3 text-sm">
              <span>
                {formatRelativeDays(next.date, language)} · {formatDate(next.date, language)}
              </span>
              <span className="text-base font-semibold tabular-nums">{formatMoney(next.yourShare, language)}</span>
            </p>
          </Section>
        )}
      </div>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <Section title={t('dashboard.upcoming')} className="rounded-xl border bg-card p-5">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.noUpcoming')}</p>
          ) : (
            <ul className="-my-2 divide-y">
              {upcoming.map((charge) => (
                <li key={`${charge.id}-${charge.date}`} className="flex items-center gap-3 py-2.5">
                  <Dot color={categoryColor(categoryOf.get(charge.id) ?? null)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{charge.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(charge.date, language)} · {formatRelativeDays(charge.date, language)}
                    </p>
                  </div>
                  <span className="font-medium tabular-nums">{formatMoney(charge.yourShare, language)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t('dashboard.byCategory')} className="rounded-xl border bg-card p-5">
          <div aria-hidden="true" className="mb-5 flex h-3 gap-0.5 overflow-hidden rounded-full">
            {byCategory.map((category) => (
              <div
                key={category.categoryId ?? 'none'}
                className="h-full min-w-1"
                style={{
                  width: `${totalMonthly > 0 ? (category.monthly / totalMonthly) * 100 : 0}%`,
                  background: categoryColor(category.categoryId),
                }}
              />
            ))}
          </div>
          <ul className="space-y-2.5">
            {byCategory.map((category) => (
              <li key={category.categoryId ?? 'none'} className="flex items-center gap-3 text-sm">
                <Dot color={categoryColor(category.categoryId)} />
                <span className="min-w-0 flex-1 truncate">{category.name ?? t('dashboard.uncategorized')}</span>
                <span className="w-10 text-right text-muted-foreground tabular-nums">
                  {percent.format(totalMonthly > 0 ? category.monthly / totalMonthly : 0)}
                </span>
                <span className="w-20 text-right font-medium tabular-nums">
                  {formatMoney(category.monthly, language)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  )
}
