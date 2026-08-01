import type { LucideIcon } from 'lucide-react'
import { CheckCircle2Icon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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
 * żeby dało się je czytać rzutem oka: tytuł, licznik, lista, link do widoku,
 * w którym da się z tym coś zrobić.
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
          <ul className="divide-y">{children}</ul>
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
}: {
  label: string
  detail: string
  badge: string
  urgent?: boolean
}) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{detail}</p>
      </div>
      <Badge variant={urgent ? 'destructive' : 'secondary'} className="shrink-0">
        {badge}
      </Badge>
    </li>
  )
}
