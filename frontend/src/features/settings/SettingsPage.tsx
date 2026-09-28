import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { LookupList } from './LookupList'

export function SettingsPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-8">
      <PageHeader title={t('settings.title')} />
      <div className="grid items-start gap-6 md:grid-cols-2">
        <LookupList
          kind="categories"
          title={t('settings.categories')}
          deleteDescription={t('settings.deleteCategoryBody')}
        />
        <LookupList
          kind="payment-methods"
          title={t('settings.paymentMethods')}
          deleteDescription={t('settings.deletePaymentMethodBody')}
        />
      </div>
    </div>
  )
}
