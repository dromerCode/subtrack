import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSubscriptions } from './hooks'

export function SubscriptionsPage() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const subscriptions = useSubscriptions()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('subscriptions.title')}</h1>
        <Button asChild>
          <Link to="/subscriptions/new">{t('subscriptions.new')}</Link>
        </Button>
      </div>

      {subscriptions.isPending && <p className="text-muted-foreground">{t('common.loading')}</p>}

      {subscriptions.data?.length === 0 && (
        <EmptyState message={t('subscriptions.empty')} linkLabel={t('subscriptions.addFirst')} to="/subscriptions/new" />
      )}

      {subscriptions.data && subscriptions.data.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('subscriptions.name')}</TableHead>
              <TableHead>{t('subscriptions.category')}</TableHead>
              <TableHead>{t('subscriptions.yourShare')}</TableHead>
              <TableHead>{t('subscriptions.period')}</TableHead>
              <TableHead>{t('subscriptions.nextCharge')}</TableHead>
              <TableHead>{t('subscriptions.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.data.map((s) => (
              <TableRow key={s.id} className={cn(!s.active && 'text-muted-foreground')}>
                <TableCell>
                  <Link to={`/subscriptions/${s.id}`} className="font-medium hover:underline">
                    {s.name}
                  </Link>
                </TableCell>
                <TableCell>{s.category?.name ?? '—'}</TableCell>
                <TableCell>
                  {formatMoney(s.yourShare, language)}
                  {s.sharedWith > 1 && (
                    <span className="block text-xs text-muted-foreground">
                      {t('subscriptions.sharedTotal', { total: formatMoney(s.price, language), count: s.sharedWith })}
                    </span>
                  )}
                </TableCell>
                <TableCell>{t(`period.${s.intervalUnit}`, { count: s.intervalCount })}</TableCell>
                <TableCell>{s.nextChargeDate ? formatDate(s.nextChargeDate, language) : '—'}</TableCell>
                <TableCell>{s.active ? t('subscriptions.active') : t('subscriptions.cancelled')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
