import { PlusIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  id: string
  label: string
  value: string[]
  onChange: (value: string[]) => void
  /** Tagi już używane gdzie indziej — jednym kliknięciem, bez przepisywania. */
  suggestions?: string[]
  placeholder?: string
  hint?: string
}

/** Stała referencja — literał w domyślnym propie psułby równość referencyjną. */
const NO_SUGGESTIONS: string[] = []

/**
 * Edytor listy tagów (u nas: sportów zawodnika).
 *
 * Podpowiedzi z istniejących wartości są tu najważniejsze — bez nich lista
 * rozjeżdża się na „BJJ", „bjj" i „B.J.J." i filtrowanie przestaje działać.
 * Porównanie przy dodawaniu jest bez uwzględnienia wielkości liter właśnie
 * z tego powodu.
 */
export function TagInput({
  id,
  label,
  value,
  onChange,
  suggestions = NO_SUGGESTIONS,
  placeholder = 'Dopisz i naciśnij Enter',
  hint,
}: Props) {
  const [draft, setDraft] = useState('')

  const add = (raw: string) => {
    const tag = raw.trim()
    if (!tag) return
    const exists = value.some((current) => current.toLowerCase() === tag.toLowerCase())
    if (!exists) onChange([...value, tag])
    setDraft('')
  }

  const remove = (tag: string) => onChange(value.filter((current) => current !== tag))

  const unused = suggestions.filter(
    (tag) => !value.some((current) => current.toLowerCase() === tag.toLowerCase()),
  )

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                aria-label={`Usuń ${tag}`}
                className="hover:text-destructive focus-visible:ring-ring rounded transition focus-visible:ring-2 focus-visible:outline-none"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Input
        id={id}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            // Bez tego Enter zapisałby cały dialog zamiast dodać tag.
            event.preventDefault()
            add(draft)
          }
          if (event.key === 'Backspace' && !draft && value.length > 0) {
            remove(value[value.length - 1]!)
          }
        }}
        onBlur={() => add(draft)}
      />

      {unused.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {unused.slice(0, 12).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => add(tag)}
              className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-0.5 rounded border border-dashed px-1.5 py-0.5 text-xs transition focus-visible:ring-2 focus-visible:outline-none"
            >
              <PlusIcon className="size-2.5" />
              {tag}
            </button>
          ))}
        </div>
      )}

      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}
