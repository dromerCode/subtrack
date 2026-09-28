import { useQuery } from '@tanstack/react-query'
import { type ReactNode, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { formatDate, formatMoney } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import type { Dashboard } from '@/lib/types'

function Section({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId}>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id={headingId} className="text-lg font-semibold">
              {title}
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  )
}

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const dashboard = useQuery({ queryKey: queryKeys.dashboard, queryFn: () => api<Dashboard>('/api/dashboard') })

  const title = <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
  if (!dashboard.data) {
    return (
      <div className="space-y-6">
        {title}
        {dashboard.isPending && <p className="text-muted-foreground">{t('common.loading')}</p>}
      </div>
    )
  }

  const { monthlyTotal, yearlyTotal, upcoming, byCategory } = dashboard.data
  if (byCategory.length === 0) {
    return (
      <div className="space-y-6">
        {title}
        <EmptyState message={t('dashboard.empty')} linkLabel={t('dashboard.addFirst')} to="/subscriptions/new" />
      </div>
    )
  }

  const maxMonthly = Math.max(...byCategory.map((c) => c.monthly))
  return (
    <div className="space-y-6">
      {title}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>{t('dashboard.monthly')}</CardDescription>
            <CardTitle className="text-3xl">{formatMoney(monthlyTotal, language)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('dashboard.yearly')}</CardDescription>
            <CardTitle className="text-3xl">{formatMoney(yearlyTotal, language)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title={t('dashboard.upcoming')}>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.noUpcoming')}</p>
          ) : (
            <ul className="divide-y">
              {upcoming.map((charge) => (
                <li key={`${charge.id}-${charge.date}`} className="flex justify-between gap-4 py-2 text-sm">
                  <span>
                    <span className="text-muted-foreground">{formatDate(charge.date, language)}</span> · {charge.name}
                  </span>
                  <span>{formatMoney(charge.yourShare, language)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t('dashboard.byCategory')}>
          <ul className="space-y-3">
            {byCategory.map((category) => (
              <li key={category.categoryId ?? 'none'}>
                <div className="flex justify-between text-sm">
                  <span>{category.name ?? t('dashboard.uncategorized')}</span>
                  <span>{formatMoney(category.monthly, language)}</span>
                </div>
                <div className="mt-1 h-2 rounded bg-muted">
                  <div
                    data-testid="bar"
                    className="h-2 rounded bg-primary"
                    style={{ width: `${maxMonthly > 0 ? (category.monthly / maxMonthly) * 100 : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  )
}
