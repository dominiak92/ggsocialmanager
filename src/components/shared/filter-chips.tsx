import { cn } from '@/lib/utils'

export type FilterOption<T extends string> = {
  value: T
  label: string
  /** Licznik w nawiasie — od razu widać, czy filtr ma sens. */
  count?: number
}

type Props<T extends string> = {
  options: FilterOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

/**
 * Poziomy pasek filtrów.
 *
 * **Nie zawija się** — przewija w poziomie (`w-max` + `overflow-x-auto` +
 * `.no-scrollbar`, na wąskim ekranie `-mx-4 px-4`). Zawijanie przy kilkunastu
 * tagach potrafi zjeść pół ekranu na samych filtrach. Patrz AGENTS.md →
 * zasady mobile.
 */
export function FilterChips<T extends string>({ options, value, onChange, ariaLabel }: Props<T>) {
  if (options.length <= 1) return null

  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
      <div role="group" aria-label={ariaLabel} className="flex w-max items-center gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={cn(
              'focus-visible:ring-ring rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition focus-visible:ring-2 focus-visible:outline-none',
              value === option.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {option.label}
            {option.count === undefined ? '' : ` (${option.count})`}
          </button>
        ))}
      </div>
    </div>
  )
}
