import type { ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/** Etykieta + kontrolka + opcjonalna podpowiedź — jeden rytm w całej aplikacji. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  type?: 'text' | 'date' | 'url'
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  hint,
  min = 0,
  max = 365,
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  hint?: string
  min?: number
  max?: number
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Math.max(min, Number(event.target.value) || 0))}
      />
    </Field>
  )
}

export function NoteField({
  id,
  label = 'Notatka',
  value,
  onChange,
  rows = 2,
}: {
  id: string
  label?: string
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <Field label={label} htmlFor={id}>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}
