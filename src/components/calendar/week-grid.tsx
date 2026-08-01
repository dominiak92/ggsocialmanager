import { CheckIcon, PlusIcon } from 'lucide-react'
import { Fragment } from 'react'

import { cellKey, groupByCell, sectionsOf } from '@/domain/calendar'
import { CHANNEL_GROUP_LABEL, postTypeColorClass } from '@/domain/enums'
import type { Channel, PostType, Publication } from '@/domain/models'
import { isToday, isWeekend, toDateKey, weekdayShort } from '@/lib/dates'
import { cn } from '@/lib/utils'

type Props = {
  days: Date[]
  channels: Channel[]
  postTypes: PostType[]
  publications: Publication[]
  onAdd: (dateKey: string, channelId: string) => void
  onOpen: (publication: Publication) => void
}

/**
 * Siatka pokrycia: wiersze = kanały (w sekcjach), kolumny = 7 dni.
 *
 * Sens tego widoku to WIDOK DZIUR — pusty wiersz od razu mówi „ten kanał
 * milczy cały tydzień". Dlatego puste komórki nie są dekoracyjne, tylko
 * klikalne (dodaj), a wypełnione pokazują kolor rodzaju postu.
 *
 * Siatka przewija się w poziomie na wąskim ekranie; kolumna z nazwą kanału
 * jest przyklejona (`sticky left-0`), bo bez niej po przewinięciu nie wiadomo,
 * czyj to wiersz.
 */
export function WeekGrid({ days, channels, postTypes, publications, onAdd, onOpen }: Props) {
  const byCell = groupByCell(publications)
  const typeById = new Map(postTypes.map((postType) => [postType.id, postType]))
  const sections = sectionsOf(channels)

  if (sections.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        Wszystkie kanały są wyłączone. Włącz je w Ustawieniach.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="bg-background sticky left-0 z-20 w-44 border-b p-2 text-left text-xs font-medium">
              Kanał
            </th>
            {days.map((day) => (
              <th
                key={toDateKey(day)}
                className={cn(
                  'border-b p-2 text-center text-xs font-medium',
                  isWeekend(day) && 'bg-muted/40',
                  isToday(day) && 'text-primary',
                )}
              >
                <div>{weekdayShort(day)}</div>
                <div
                  className={cn(
                    'mx-auto mt-0.5 flex size-6 items-center justify-center rounded-full text-sm',
                    isToday(day) && 'bg-primary text-primary-foreground',
                  )}
                >
                  {day.getDate()}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sections.map((section) => (
            <Fragment key={section.group}>
              <tr>
                <td
                  colSpan={days.length + 1}
                  className="bg-muted/50 text-muted-foreground border-b px-2 py-1 text-[11px] font-semibold tracking-wide uppercase"
                >
                  {CHANNEL_GROUP_LABEL[section.group]}
                </td>
              </tr>

              {section.channels.map((channel) => (
                <tr key={channel.id} className="group/row">
                  <th
                    scope="row"
                    className="bg-background group-hover/row:bg-muted/40 sticky left-0 z-10 border-b p-2 text-left text-sm font-normal"
                  >
                    {channel.name}
                  </th>

                  {days.map((day) => {
                    const dateKey = toDateKey(day)
                    const entries = byCell.get(cellKey(dateKey, channel.id)) ?? []

                    return (
                      <td
                        key={dateKey}
                        className={cn(
                          'border-b p-1 align-top',
                          isWeekend(day) && 'bg-muted/30',
                          isToday(day) && 'bg-primary/5',
                        )}
                      >
                        <div className="flex min-h-9 flex-col gap-1">
                          {entries.map((entry) => {
                            const postType = entry.postTypeId
                              ? typeById.get(entry.postTypeId)
                              : undefined

                            return (
                              <button
                                key={entry.id}
                                type="button"
                                onClick={() => onOpen(entry)}
                                title={entry.title || postType?.name || 'Wpis'}
                                className={cn(
                                  'flex w-full items-center gap-1 rounded border px-1.5 py-1 text-left text-[11px] leading-tight font-medium',
                                  'focus-visible:ring-ring transition focus-visible:ring-2 focus-visible:outline-none',
                                  postType
                                    ? postTypeColorClass(postType.color)
                                    : 'bg-muted text-foreground border-border',
                                  // Zaplanowane są wyblakłe i przerywane —
                                  // „jeszcze nie poszło" musi być widoczne
                                  // jednym rzutem oka, bez czytania.
                                  entry.status === 'planned' && 'border-dashed opacity-60',
                                )}
                              >
                                {entry.status === 'published' && (
                                  <CheckIcon className="size-3 shrink-0" />
                                )}
                                <span className="truncate">
                                  {entry.title || postType?.name || 'Wpis'}
                                </span>
                              </button>
                            )
                          })}

                          <button
                            type="button"
                            onClick={() => onAdd(dateKey, channel.id)}
                            aria-label={`Dodaj wpis: ${channel.name}, ${dateKey}`}
                            className={cn(
                              'text-muted-foreground/50 hover:bg-accent hover:text-foreground flex h-6 items-center justify-center rounded border border-dashed',
                              'focus-visible:ring-ring transition focus-visible:ring-2 focus-visible:outline-none',
                              // Na myszy pokazuj plus dopiero przy najechaniu —
                              // 112 plusów naraz robi z siatki szum. Na dotyku
                              // nie ma hovera, więc tam jest zawsze widoczny.
                              entries.length > 0 && 'opacity-0 focus-visible:opacity-100',
                              entries.length > 0 &&
                                '[@media(hover:hover)]:group-hover/row:opacity-100',
                              entries.length > 0 && '[@media(pointer:coarse)]:opacity-100',
                            )}
                          >
                            <PlusIcon className="size-3" />
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
