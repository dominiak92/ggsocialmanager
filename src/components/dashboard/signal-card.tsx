import type { LucideIcon } from 'lucide-react'
import { CheckCircle2Icon, StarIcon } from 'lucide-react'
import { Children, type ReactNode } from 'react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Ile wierszy pokazujemy w karcie sygnału, zanim reszta schowa się pod linkiem.
 *
 * Limit jest tu kluczowy: przy 38 zawodnikach bez ani jednego przeglądu karta
 * renderowała 38 wierszy i pulpit zamieniał się w ścianę tekstu. Pulpit ma
 * mówić „ile i co najpilniejsze", a nie zastępować widok docelowy — pełna
 * lista jest jedno kliknięcie dalej.
 */
const VISIBLE_ROWS = 5

type Props = {
  title: string
  description: string
  icon: LucideIcon
  to: string
  count: number
  loading?: boolean
  emptyText: string
  children: ReactNode
}

/**
 * Jedna karta sygnału na pulpicie. Wszystkie sygnały wyglądają tak samo,
 * żeby dało się je czytać rzutem oka: tytuł, licznik, kilka najpilniejszych
 * pozycji, link do widoku, w którym da się z tym coś zrobić.
 */
export function SignalCard({
  title,
  description,
  icon: Icon,
  to,
  count,
  loading = false,
  emptyText,
  children,
}: Props) {
  const rows = Children.toArray(children)
  const hidden = rows.length - VISIBLE_ROWS

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4" />
          <Link to={to} className="hover:underline">
            {title}
          </Link>
          {count > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {count}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : count === 0 ? (
          <p className="text-muted-foreground flex items-center gap-2 py-1 text-sm">
            <CheckCircle2Icon className="text-primary size-4" />
            {emptyText}
          </p>
        ) : (
          <>
            <ul className="divide-y">{rows.slice(0, VISIBLE_ROWS)}</ul>
            {hidden > 0 && (
              <Link
                to={to}
                className="text-muted-foreground hover:text-foreground mt-2 inline-block text-xs underline-offset-2 hover:underline"
              >
                …i jeszcze {hidden} — zobacz wszystkie
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

/** Wiersz sygnału: co, dlaczego pilne, jak bardzo. */
export function SignalRow({
  label,
  detail,
  badge,
  urgent = false,
  starred = false,
}: {
  label: string
  detail: string
  badge: string
  urgent?: boolean
  /** Oznaczenie ważności — ten sam symbol co na liście zawodników. */
  starred?: boolean
}) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
          {starred && <StarIcon className="size-3.5 shrink-0 fill-amber-400 text-amber-500" />}
          {label}
        </p>
        <p className="text-muted-foreground text-xs">{detail}</p>
      </div>
      <Badge variant={urgent ? 'destructive' : 'secondary'} className="shrink-0">
        {badge}
      </Badge>
    </li>
  )
}
