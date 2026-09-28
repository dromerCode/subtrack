import { ChevronDownIcon } from 'lucide-react'
import { type ComponentProps, type FormEvent, type ReactNode, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { ConfirmDelete } from '@/components/ConfirmDelete'
import { FieldError } from '@/components/FieldError'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useLookups } from '@/features/settings/lookups'
import { ApiError, fieldErrorsOf } from '@/lib/api'
import { todayIso } from '@/lib/format'
import { cn } from '@/lib/utils'
import { INTERVAL_UNITS, type IntervalUnit, type Subscription, type SubscriptionInput } from '@/lib/types'
import { useDeleteSubscription, useSaveSubscription, useSubscription } from './hooks'

/** Form fields as the inputs hold them (strings), converted to the API shape on submit. */
interface FormState {
  name: string
  price: string
  intervalCount: string
  intervalUnit: IntervalUnit
  anchorDate: string
  sharedWith: string
  categoryId: string
  paymentMethodId: string
  notes: string
  active: boolean
}

function emptyForm(): FormState {
  return {
    name: '',
    price: '',
    intervalCount: '1',
    intervalUnit: 'MONTH',
    anchorDate: todayIso(),
    sharedWith: '1',
    categoryId: '',
    paymentMethodId: '',
    notes: '',
    active: true,
  }
}

function toFormState(s: Subscription): FormState {
  return {
    name: s.name,
    price: String(s.price),
    intervalCount: String(s.intervalCount),
    intervalUnit: s.intervalUnit,
    anchorDate: s.anchorDate,
    sharedWith: String(s.sharedWith),
    categoryId: s.category ? String(s.category.id) : '',
    paymentMethodId: s.paymentMethod ? String(s.paymentMethod.id) : '',
    notes: s.notes ?? '',
    active: s.active,
  }
}

function toInput(form: FormState): SubscriptionInput {
  const optionalId = (value: string) => (value === '' ? null : Number(value))
  return {
    name: form.name,
    price: form.price === '' ? null : Number(form.price),
    intervalCount: Number(form.intervalCount),
    intervalUnit: form.intervalUnit,
    anchorDate: form.anchorDate,
    sharedWith: Number(form.sharedWith),
    categoryId: optionalId(form.categoryId),
    paymentMethodId: optionalId(form.paymentMethodId),
    notes: form.notes.trim() === '' ? null : form.notes,
    active: form.active,
  }
}

/** Native select dressed like the shadcn Input next to it (same height, border, focus ring), with our own chevron. */
function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-8 w-full appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 [&>option]:bg-popover',
          className,
        )}
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}

export function SubscriptionFormPage() {
  const { id: idParam } = useParams()
  if (idParam === undefined) return <SubscriptionForm id={null} initial={emptyForm()} />
  const id = Number(idParam)
  if (!Number.isSafeInteger(id)) return <NotFound />
  return <EditSubscription key={id} id={id} />
}

function EditSubscription({ id }: { id: number }) {
  const { t } = useTranslation()
  const subscription = useSubscription(id)
  const { error } = subscription
  // 400: the id is not a valid one (e.g. too large); for the user that is the same as "does not exist"
  if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return <NotFound />
  if (subscription.isError) return <BackToList message={t('errors.generic')} />
  if (!subscription.data) return <p className="text-muted-foreground">{t('common.loading')}</p>
  return <SubscriptionForm id={id} initial={toFormState(subscription.data)} />
}

function NotFound() {
  const { t } = useTranslation()
  return <BackToList message={t('subscriptions.notFound')} />
}

function BackToList({ message }: { message: string }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      <p>{message}</p>
      <Link to="/subscriptions" className="font-medium underline underline-offset-4">
        {t('subscriptions.backToList')}
      </Link>
    </div>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <FieldError code={error} />
    </div>
  )
}

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  const headingId = useId()
  return (
    <div role="group" aria-labelledby={headingId} className="space-y-4 border-t pt-7">
      <h2 id={headingId} className="text-base font-semibold">
        {legend}
      </h2>
      {children}
    </div>
  )
}

function SubscriptionForm({ id, initial }: { id: number | null; initial: FormState }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const save = useSaveSubscription(id)
  const remove = useDeleteSubscription()
  const categories = useLookups('categories')
  const paymentMethods = useLookups('payment-methods')
  const errors = fieldErrorsOf(save.error)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))
  const backToList = () => navigate('/subscriptions')
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(toInput(form), { onSuccess: backToList })
  }

  return (
    <form className="max-w-2xl space-y-8" onSubmit={onSubmit}>
      <PageHeader title={id === null ? t('subscriptions.new') : t('subscriptions.edit')} />

      <div className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
        <Field id="name" label={t('form.name')} error={errors.name}>
          <Input id="name" required maxLength={100} value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>

        <Group legend={t('form.groupCost')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="price" label={t('form.price')} error={errors.price}>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                required
                className="tabular-nums"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
              />
            </Field>
            <Field id="sharedWith" label={t('form.sharedWith')} error={errors.sharedWith}>
              <Input
                id="sharedWith"
                type="number"
                min="1"
                step="1"
                required
                className="tabular-nums"
                value={form.sharedWith}
                onChange={(e) => set('sharedWith', e.target.value)}
              />
            </Field>
          </div>
        </Group>

        <Group legend={t('form.groupBilling')}>
          <div className="grid gap-4 sm:grid-cols-[6rem_1fr_1fr]">
            <Field id="intervalCount" label={t('form.intervalCount')} error={errors.intervalCount}>
              <Input
                id="intervalCount"
                type="number"
                min="1"
                max="1000"
                step="1"
                required
                className="tabular-nums"
                value={form.intervalCount}
                onChange={(e) => set('intervalCount', e.target.value)}
              />
            </Field>
            <Field id="intervalUnit" label={t('form.intervalUnit')} error={errors.intervalUnit}>
              <Select
                id="intervalUnit"
                value={form.intervalUnit}
                onChange={(e) => set('intervalUnit', e.target.value as IntervalUnit)}
              >
                {INTERVAL_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {t(`units.${unit}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="anchorDate" label={t('form.anchorDate')} error={errors.anchorDate}>
              <Input
                id="anchorDate"
                type="date"
                required
                value={form.anchorDate}
                onChange={(e) => set('anchorDate', e.target.value)}
              />
            </Field>
          </div>
        </Group>

        <Group legend={t('form.groupDetails')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="categoryId" label={t('form.category')} error={errors.categoryId}>
              <Select
                id="categoryId"
                value={form.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
              >
                <option value="">{t('form.none')}</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="paymentMethodId" label={t('form.paymentMethod')} error={errors.paymentMethodId}>
              <Select
                id="paymentMethodId"
                value={form.paymentMethodId}
                onChange={(e) => set('paymentMethodId', e.target.value)}
              >
                <option value="">{t('form.none')}</option>
                {paymentMethods.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field id="notes" label={t('form.notes')} error={errors.notes}>
            <Textarea id="notes" maxLength={1000} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
          {id !== null && (
            <div className="flex items-center gap-2 pt-1">
              <Switch id="active" checked={form.active} onCheckedChange={(checked) => set('active', checked)} />
              <Label htmlFor="active">{t('form.active')}</Label>
            </div>
          )}
        </Group>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={save.isPending}>
          {t('common.save')}
        </Button>
        <Button type="button" variant="ghost" onClick={backToList}>
          {t('common.cancel')}
        </Button>
        {id !== null && (
          <div className="ml-auto">
            <ConfirmDelete
              title={t('form.deleteTitle')}
              description={t('form.deleteBody')}
              triggerVariant="destructive"
              onConfirm={() => remove.mutate(id, { onSuccess: backToList })}
            />
          </div>
        )}
      </div>
    </form>
  )
}
