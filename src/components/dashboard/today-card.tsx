import { CalendarDaysIcon, CheckIcon, PlusIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { postTypeColorClass } from '@/domain/enums'
import type { Channel, PostType } from '@/domain/models'
import { usePublications } from '@/hooks/use-publications'
import { formatDayLong, fromDateKey, toDateKey } from '@/lib/dates'
import { cn } from '@/lib/utils'

/**
 * Panel „Dziś" — pierwsza rzecz na pulpicie.
 *
 * Pulpit odpowiadał wyłącznie na pytanie „co mi umknęło", a codzienna praca
 * social managera zaczyna się od „co mam dziś i co już poszło". Bez tego
 * trzeba było wchodzić w kalendarz i szukać dzisiejszej kolumny.
 *
 * Odhaczenie jest tu JEDNOKLIKNIĘCIOWE — bez otwierania dialogu. To czynność
 * powtarzana kilka razy dziennie i najczęstsza w całej aplikacji.
 */
export function TodayCard({ channels, postTypes }: { channels: Channel[]; postTypes: PostType[] }) {
  const today = useMemo(() => toDateKey(new Date()), [])
  const { publications, loading, update } = usePublications(today, today)

  const channelById = useMemo(
    () => new Map(channels.map((channel) => [channel.id, channel])),
    [channels],
  )
  const typeById = useMemo(
    () => new Map(postTypes.map((postType) => [postType.id, postType])),
    [postTypes],
  )

  const done = publications.filter((entry) => entry.status === 'published').length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <CalendarDaysIcon className="size-4" />
          <span className="capitalize">Dziś — {formatDayLong(fromDateKey(today))}</span>
          {publications.length > 0 && (
            <Badge variant={done === publications.length ? 'default' : 'secondary'}>
              {done} z {publications.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {publications.length === 0
            ? 'Nic nie zapisane na dziś.'
            : done === publications.length
              ? 'Wszystko z dzisiaj odhaczone.'
              : 'Odhacz jednym kliknięciem, gdy coś pójdzie.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : publications.length > 0 ? (
          <ul className="divide-y">
            {publications.map((entry) => {
              const postType = entry.postTypeId ? typeById.get(entry.postTypeId) : undefined
              const isDone = entry.status === 'published'

              return (
                <li key={entry.id} className="flex flex-wrap items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                      <span className="truncate">
                        {channelById.get(entry.channelId)?.name ?? 'Nieznany kanał'}
                      </span>
                      {postType && (
                        <span
                          className={cn(
                            'rounded border px-1.5 py-0.5 text-[11px] font-medium',
                            postTypeColorClass(postType.color),
                          )}
                        >
                          {postType.name}
                        </span>
                      )}
                    </p>
                    {entry.title && (
                      <p className="text-muted-foreground truncate text-xs">{entry.title}</p>
                    )}
                  </div>

                  {isDone ? (
                    <Badge className="shrink-0 gap-1">
                      <CheckIcon className="size-3" />
                      poszło
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => void update(entry.id, { status: 'published' }).catch(() => {})}
                    >
                      <CheckIcon />
                      Poszło
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        ) : null}

        <Button asChild variant={publications.length === 0 ? 'default' : 'outline'} size="sm">
          {/* Deep-link otwiera panel dnia od razu na dzisiaj — bez szukania
              właściwej kolumny w siatce tygodnia. */}
          <Link to={`/kalendarz?dzien=${today}`}>
            <PlusIcon />
            {publications.length === 0 ? 'Zapisz, co dziś poszło' : 'Dodaj kolejny wpis'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
