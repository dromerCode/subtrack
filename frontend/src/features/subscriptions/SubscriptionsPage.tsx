import { PlusIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { categoryColor } from '@/lib/categoryColor'
import { formatDate, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSubscriptions } from './hooks'

/*
 * One table for every width. Below md each row becomes a two-line card:
 *   name ........ your share
 *   ● category .. next charge
 * Billing and status columns hide there; a cancelled row still reads as such by its struck-through name.
 */
const card = {
  row: 'max-md:grid max-md:grid-cols-[1fr_auto] max-md:gap-x-4 max-md:gap-y-1 max-md:px-4 max-md:py-3',
  cell: 'max-md:p-0',
}

export function SubscriptionsPage() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const subscriptions = useSubscriptions()

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('subscriptions.title')}
        action={
          <Button asChild>
            <Link to="/subscriptions/new">
              <PlusIcon aria-hidden="true" />
              {t('subscriptions.new')}
            </Link>
          </Button>
        }
      />

      {subscriptions.isPending && <p className="text-muted-foreground">{t('common.loading')}</p>}

      {subscriptions.data?.length === 0 && (
        <EmptyState message={t('subscriptions.empty')} linkLabel={t('subscriptions.addFirst')} to="/subscriptions/new" />
      )}

      {subscriptions.data && subscriptions.data.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader className="max-md:hidden">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">{t('subscriptions.name')}</TableHead>
                <TableHead>{t('subscriptions.category')}</TableHead>
                <TableHead className="text-right">{t('subscriptions.yourShare')}</TableHead>
                <TableHead>{t('subscriptions.period')}</TableHead>
                <TableHead>{t('subscriptions.nextCharge')}</TableHead>
                <TableHead className="pr-5">{t('subscriptions.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.data.map((s) => (
                <TableRow key={s.id} className={cn(card.row, !s.active && 'text-muted-foreground')}>
                  <TableCell className={cn(card.cell, 'py-3 pl-5 max-md:whitespace-normal')}>
                    <Link
                      to={`/subscriptions/${s.id}`}
                      className={cn(
                        'font-medium hover:underline',
                        !s.active && 'line-through decoration-muted-foreground/50',
                      )}
                    >
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell className={cn(card.cell, 'max-md:col-start-1 max-md:row-start-2')}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2 rounded-full"
                        style={{ background: categoryColor(s.category?.id ?? null) }}
                      />
                      {s.category?.name ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className={cn(card.cell, 'text-right tabular-nums max-md:col-start-2 max-md:row-start-1')}>
                    <span className="font-medium">{formatMoney(s.yourShare, language)}</span>
                    {s.sharedWith > 1 && (
                      <span className="block text-xs text-muted-foreground">
                        {t('subscriptions.sharedTotal', { total: formatMoney(s.price, language), count: s.sharedWith })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className={cn(card.cell, 'max-md:hidden')}>
                    {t(`period.${s.intervalUnit}`, { count: s.intervalCount })}
                  </TableCell>
                  <TableCell
                    className={cn(
                      card.cell,
                      'tabular-nums max-md:col-start-2 max-md:row-start-2 max-md:text-right max-md:text-muted-foreground',
                    )}
                  >
                    {s.nextChargeDate ? formatDate(s.nextChargeDate, language) : '—'}
                  </TableCell>
                  <TableCell className={cn(card.cell, 'pr-5 max-md:hidden')}>
                    {s.active ? t('subscriptions.active') : t('subscriptions.cancelled')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
