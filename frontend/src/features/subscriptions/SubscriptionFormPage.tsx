import { type FormEvent, type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { ConfirmDelete } from '@/components/ConfirmDelete'
import { FieldError } from '@/components/FieldError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useLookups } from '@/features/settings/lookups'
import { ApiError, fieldErrorsOf } from '@/lib/api'
import { todayIso } from '@/lib/format'
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

const selectClass = 'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm'

export function SubscriptionFormPage() {
  const { id: idParam } = useParams()
  if (idParam === undefined) return <SubscriptionForm id={null} initial={emptyForm()} />
  const id = Number(idParam)
  if (!Number.isInteger(id)) return <NotFound />
  return <EditSubscription key={id} id={id} />
}

function EditSubscription({ id }: { id: number }) {
  const { t } = useTranslation()
  const subscription = useSubscription(id)
  if (subscription.error instanceof ApiError && subscription.error.status === 404) return <NotFound />
  if (!subscription.data) return <p className="text-muted-foreground">{t('common.loading')}</p>
  return <SubscriptionForm id={id} initial={toFormState(subscription.data)} />
}

function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      <p>{t('subscriptions.notFound')}</p>
      <Link to="/subscriptions" className="font-medium underline underline-offset-4">
        {t('subscriptions.backToList')}
      </Link>
    </div>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <FieldError code={error} />
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
    <form className="max-w-xl space-y-4" onSubmit={onSubmit}>
      <h1 className="text-2xl font-semibold">{id === null ? t('subscriptions.new') : t('subscriptions.edit')}</h1>

      <Field id="name" label={t('form.name')} error={errors.name}>
        <Input id="name" required maxLength={100} value={form.name} onChange={(e) => set('name', e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="price" label={t('form.price')} error={errors.price}>
          <Input
            id="price"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
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
            value={form.sharedWith}
            onChange={(e) => set('sharedWith', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="intervalCount" label={t('form.intervalCount')} error={errors.intervalCount}>
          <Input
            id="intervalCount"
            type="number"
            min="1"
            max="1000"
            step="1"
            required
            value={form.intervalCount}
            onChange={(e) => set('intervalCount', e.target.value)}
          />
        </Field>
        <Field id="intervalUnit" label={t('form.intervalUnit')} error={errors.intervalUnit}>
          <select
            id="intervalUnit"
            className={selectClass}
            value={form.intervalUnit}
            onChange={(e) => set('intervalUnit', e.target.value as IntervalUnit)}
          >
            {INTERVAL_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {t(`units.${unit}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="anchorDate" label={t('form.anchorDate')} error={errors.anchorDate}>
        <Input
          id="anchorDate"
          type="date"
          required
          value={form.anchorDate}
          onChange={(e) => set('anchorDate', e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="categoryId" label={t('form.category')} error={errors.categoryId}>
          <select
            id="categoryId"
            className={selectClass}
            value={form.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
          >
            <option value="">{t('form.none')}</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="paymentMethodId" label={t('form.paymentMethod')} error={errors.paymentMethodId}>
          <select
            id="paymentMethodId"
            className={selectClass}
            value={form.paymentMethodId}
            onChange={(e) => set('paymentMethodId', e.target.value)}
          >
            <option value="">{t('form.none')}</option>
            {paymentMethods.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="notes" label={t('form.notes')} error={errors.notes}>
        <Textarea id="notes" maxLength={1000} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>

      {id !== null && (
        <div className="flex items-center gap-2">
          <Switch id="active" checked={form.active} onCheckedChange={(checked) => set('active', checked)} />
          <Label htmlFor="active">{t('form.active')}</Label>
        </div>
      )}

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
