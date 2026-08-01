import { CheckIcon, PlusIcon } from 'lucide-react'
import { Fragment, useMemo } from 'react'

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
  onOpenDay: (dateKey: string) => void
}

/**
 * Ile wpisów mieści się w komórce, zanim reszta schowa się pod „+N".
 *
 * Limit istnieje po to, żeby WIERSZE NIE ZMIENIAŁY WYSOKOŚCI. Bez niego jeden
 * dzień z pięcioma wpisami rozpychał cały rząd i siatka „skakała" przy każdym
 * dodaniu — a to widok, w którym liczy się stabilny układ, nie komplet detali.
 * Komplet jest w panelu dnia.
 */
const MAX_VISIBLE = 2

/**
 * Siatka pokrycia: wiersze = kanały (w sekcjach), kolumny = 7 dni.
 *
 * Sens tego widoku to WIDOK DZIUR — pusty wiersz od razu mówi „ten kanał
 * milczy cały tydzień". Dlatego puste komórki nie są dekoracyjne, tylko
 * klikalne, a wypełnione pokazują kolor rodzaju postu.
 *
 * Siatka przewija się w poziomie na wąskim ekranie; kolumna z nazwą kanału
 * jest przyklejona (`sticky left-0`), bo bez niej po przewinięciu nie wiadomo,
 * czyj to wiersz.
 */
export function WeekGrid({
  days,
  channels,
  postTypes,
  publications,
  onAdd,
  onOpen,
  onOpenDay,
}: Props) {
  // Indeksy budowane raz na zmianę danych, a nie na każdy render: siatka
  // re-renderuje się przy otwarciu dialogu, panelu dnia i każdej zmianie filtra.
  const byCell = useMemo(() => groupByCell(publications), [publications])
  const typeById = useMemo(
    () => new Map(postTypes.map((postType) => [postType.id, postType])),
    [postTypes],
  )
  const sections = useMemo(() => sectionsOf(channels), [channels])

  if (sections.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        Wszystkie kanały są wyłączone. Włącz je w Ustawieniach.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      {/* `table-fixed` + jawne szerokości kolumn — bez tego przeglądarka
          rozciąga kolumny pod najdłuższy tytuł i szerokość dnia zmienia się
          przy każdym dodaniu wpisu. */}
      <table className="w-full min-w-[44rem] table-fixed border-separate border-spacing-0 sm:min-w-[56rem]">
        {/* Kolumna kanałów jest wąska na telefonie: przy 176 px na ekranie
            360 px zostawałoby ~26 px na dzień, czyli kratki nie do trafienia.
            Nazwy i tak są ucinane, a pełną widać w panelu dnia. */}
        <colgroup>
          <col className="w-24 sm:w-44" />
          {days.map((day) => (
            <col key={toDateKey(day)} />
          ))}
        </colgroup>

        <thead>
          <tr>
            <th className="bg-background sticky left-0 z-20 border-b p-2 text-left text-xs font-medium">
              Kanał
            </th>
            {days.map((day) => (
              <th
                key={toDateKey(day)}
                className={cn(
                  'border-b p-2 text-center text-xs font-medium',
                  isWeekend(day) && 'bg-muted/40',
                )}
              >
                <div className="text-muted-foreground">{weekdayShort(day)}</div>
                <div
                  className={cn(
                    'mx-auto mt-0.5 flex size-6 items-center justify-center rounded-full text-sm',
                    isToday(day) && 'bg-primary text-primary-foreground font-medium',
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
                    className="bg-background group-hover/row:bg-muted/40 sticky left-0 z-10 truncate border-b p-2 text-left text-sm font-normal"
                  >
                    {channel.name}
                  </th>

                  {days.map((day) => {
                    const dateKey = toDateKey(day)
                    const entries = byCell.get(cellKey(dateKey, channel.id)) ?? []
                    const visible = entries.slice(0, MAX_VISIBLE)
                    const hidden = entries.length - visible.length

                    return (
                      <td
                        key={dateKey}
                        className={cn(
                          'border-b p-1 align-top',
                          isWeekend(day) && 'bg-muted/30',
                          isToday(day) && 'bg-primary/5',
                        )}
                      >
                        {/* Stała wysokość = stabilny układ. Zawartość nigdy
                            nie rozpycha komórki, bo nadmiar idzie pod „+N". */}
                        <div className="flex h-[3.25rem] flex-col gap-0.5">
                          {visible.map((entry) => {
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
                                  'flex h-6 w-full shrink-0 items-center gap-1 rounded border px-1.5 text-left text-[11px] leading-none font-medium',
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

                          {hidden > 0 ? (
                            <button
                              type="button"
                              onClick={() => onOpenDay(dateKey)}
                              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring h-5 shrink-0 rounded text-left text-[10px] leading-none transition focus-visible:ring-2 focus-visible:outline-none"
                            >
                              +{hidden} więcej
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onAdd(dateKey, channel.id)}
                              aria-label={`Dodaj wpis: ${channel.name}, ${dateKey}`}
                              className={cn(
                                'text-muted-foreground/50 hover:bg-accent hover:text-foreground flex shrink-0 items-center justify-center rounded border border-dashed transition',
                                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                                // Pierwszy wpis wypełnia wolne miejsce (~52 px,
                                // czyli i tak wygodny cel dotykowy), kolejne
                                // dodawanie to już tylko wąski pasek — dzięki
                                // temu wysokość komórki jest zawsze ta sama.
                                // Dlatego NIE dajemy tu `data-touch`: wymuszone
                                // 40 px rozepchnęłoby komórkę.
                                visible.length === 0 ? 'flex-1' : 'h-5',
                                // Na myszy plus pojawia się przy najechaniu —
                                // 112 plusów naraz robi z siatki szum. Na dotyku
                                // nie ma hovera, więc tam jest zawsze widoczny.
                                visible.length > 0 &&
                                  'opacity-0 focus-visible:opacity-100 [@media(hover:hover)]:group-hover/row:opacity-100 [@media(pointer:coarse)]:opacity-100',
                              )}
                            >
                              <PlusIcon className="size-3" />
                            </button>
                          )}
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
