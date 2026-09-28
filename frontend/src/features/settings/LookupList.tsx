import { type FormEvent, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDelete } from '@/components/ConfirmDelete'
import { FieldError } from '@/components/FieldError'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fieldErrorsOf } from '@/lib/api'
import { categoryColor } from '@/lib/categoryColor'
import type { LookupKind } from '@/lib/queryKeys'
import type { Lookup } from '@/lib/types'
import { useLookupMutations, useLookups } from './lookups'

interface LookupListProps {
  kind: LookupKind
  title: string
  deleteDescription: string
}

export function LookupList({ kind, title, deleteDescription }: LookupListProps) {
  const { t } = useTranslation()
  const headingId = useId()
  const inputId = useId()
  const lookups = useLookups(kind)
  const { create } = useLookupMutations(kind)
  const [name, setName] = useState('')
  const errors = fieldErrorsOf(create.error)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(name, { onSuccess: () => setName('') })
  }

  return (
    <section aria-labelledby={headingId}>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id={headingId} className="text-base font-semibold">
              {title}
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex items-start gap-2" onSubmit={onSubmit}>
            <div className="flex-1 space-y-1">
              <Label htmlFor={inputId} className="sr-only">
                {t('settings.newName')}
              </Label>
              <Input
                id={inputId}
                placeholder={t('settings.newName')}
                required
                maxLength={50}
                value={name}
                aria-invalid={Boolean(errors.name)}
                onChange={(e) => setName(e.target.value)}
              />
              <FieldError code={errors.name} />
            </div>
            <Button type="submit" disabled={create.isPending}>
              {t('settings.add')}
            </Button>
          </form>
          {lookups.data?.length === 0 && <p className="text-sm text-muted-foreground">{t('settings.empty')}</p>}
          <ul className="divide-y">
            {lookups.data?.map((item) => (
              <LookupRow key={item.id} kind={kind} item={item} deleteDescription={deleteDescription} />
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}

function LookupRow({ kind, item, deleteDescription }: { kind: LookupKind; item: Lookup; deleteDescription: string }) {
  const { t } = useTranslation()
  const { rename, remove } = useLookupMutations(kind)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const errors = fieldErrorsOf(rename.error)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    rename.mutate({ id: item.id, name }, { onSuccess: () => setEditing(false) })
  }
  const cancel = () => {
    setName(item.name)
    rename.reset()
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="py-2">
        <form className="flex items-start gap-2" onSubmit={onSubmit}>
          <div className="flex-1 space-y-1">
            <Input
              aria-label={t('settings.rename')}
              required
              maxLength={50}
              autoFocus
              value={name}
              aria-invalid={Boolean(errors.name)}
              onChange={(e) => setName(e.target.value)}
            />
            <FieldError code={errors.name} />
          </div>
          <Button type="submit" size="sm" disabled={rename.isPending}>
            {t('common.save')}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={cancel}>
            {t('common.cancel')}
          </Button>
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-2 py-2">
      {kind === 'categories' && (
        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: categoryColor(item.id) }} />
      )}
      <span className="flex-1">{item.name}</span>
      <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)}>
        {t('settings.rename')}
      </Button>
      <ConfirmDelete
        title={t('settings.deleteTitle', { name: item.name })}
        description={deleteDescription}
        onConfirm={() => remove.mutate(item.id)}
      />
    </li>
  )
}
