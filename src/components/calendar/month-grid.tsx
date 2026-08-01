import { useMemo } from 'react'
import { groupByDay } from '@/domain/calendar'
import { postTypeColorClass } from '@/domain/enums'
import type { Channel, PostType, Publication } from '@/domain/models'
import { isSameMonth, isToday, isWeekend, toDateKey } from '@/lib/dates'
import { cn } from '@/lib/utils'

type Props = {
  month: Date
  days: Date[]
  channels: Channel[]
  postTypes: PostType[]
  publications: Publication[]
  onOpenDay: (dateKey: string) => void
}

const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']

/**
 * Przegląd miesiąca: gęstość zamiast szczegółów.
 *
 * Nie próbujemy zmieścić 16 kanałów w komórce dnia — pokazujemy kropki
 * rodzajów postów i skróty kanałów. Szczegóły są w panelu dnia.
 */
export function MonthGrid({ month, days, channels, postTypes, publications, onOpenDay }: Props) {
  const byDay = useMemo(() => groupByDay(publications), [publications])
  const typeById = useMemo(
    () => new Map(postTypes.map((postType) => [postType.id, postType])),
    [postTypes],
  )
  const channelById = useMemo(
    () => new Map(channels.map((channel) => [channel.id, channel])),
    [channels],
  )

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="text-muted-foreground border-b px-2 py-1.5 text-center text-xs font-medium"
          >
            {label}
          </div>
        ))}

        {days.map((day) => {
          const dateKey = toDateKey(day)
          const entries = byDay.get(dateKey) ?? []
          const outside = !isSameMonth(day, month)
          const published = entries.filter((entry) => entry.status === 'published').length

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onOpenDay(dateKey)}
              className={cn(
                'focus-visible:ring-ring hover:bg-accent/60 flex min-h-24 flex-col gap-1 border-r border-b p-1.5 text-left transition focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                isWeekend(day) && 'bg-muted/30',
                outside && 'opacity-40',
                isToday(day) && 'bg-primary/5',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-sm',
                    isToday(day) && 'bg-primary text-primary-foreground font-medium',
                  )}
                >
                  {day.getDate()}
                </span>
                {entries.length > 0 && (
                  <span className="text-muted-foreground text-[11px] tabular-nums">
                    {published}/{entries.length}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-0.5">
                {entries.slice(0, 8).map((entry) => {
                  const postType = entry.postTypeId ? typeById.get(entry.postTypeId) : undefined
                  const channel = channelById.get(entry.channelId)

                  return (
                    <span
                      key={entry.id}
                      title={`${channel?.name ?? 'Kanał'}${postType ? ` — ${postType.name}` : ''}`}
                      className={cn(
                        'size-2.5 rounded-full border',
                        postType
                          ? postTypeColorClass(postType.color)
                          : 'bg-muted-foreground/40 border-border',
                        entry.status === 'planned' && 'border-dashed opacity-50',
                      )}
                    />
                  )
                })}
                {entries.length > 8 && (
                  <span className="text-muted-foreground text-[10px] leading-3">
                    +{entries.length - 8}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
