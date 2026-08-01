import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { DaySheet } from '@/components/calendar/day-sheet'
import { MonthGrid } from '@/components/calendar/month-grid'
import { PublicationDialog, type PublicationTarget } from '@/components/calendar/publication-dialog'
import { WeekGrid } from '@/components/calendar/week-grid'
import { FilterChips } from '@/components/shared/filter-chips'
import { filterChannels } from '@/domain/calendar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CHANNEL_GROUP_LABEL,
  CHANNEL_GROUPS,
  LOCALES,
  channelGroupOf,
  postTypeColorClass,
  type ChannelGroup,
  type Locale,
} from '@/domain/enums'
import { useChannels } from '@/hooks/use-channels'
import { useContests, useEvents } from '@/hooks/use-domain'
import { usePostTypes } from '@/hooks/use-post-types'
import { usePublications } from '@/hooks/use-publications'
import {
  addDays,
  addMonths,
  formatMonthYear,
  formatWeekRange,
  fromDateKey,
  monthGrid,
  startOfWeek,
  toDateKey,
  weekDays,
} from '@/lib/dates'
import { cn } from '@/lib/utils'

type View = 'week' | 'month'

/** `Select` i chipy nie umieją wartości pustej — „bez zawężenia" ma swój token. */
const ALL = '__all__'

type GroupFilter = ChannelGroup | typeof ALL
type LocaleFilter = Locale | typeof ALL

export function CalendarPage() {
  /**
   * Na telefonie startujemy od MIESIĄCA, nie od tygodnia.
   *
   * Siatka tygodnia potrzebuje ~700 px (16 kanałów w wierszach), więc na
   * ekranie 360 px oznacza ciągłe przewijanie w bok. Miesiąc ma 7 równych
   * kolumn, mieści się bez przewijania, a szczegóły i dodawanie i tak dzieją
   * się w panelu dnia. To wybór POCZĄTKOWY — przełącznik zostaje, bo tydzień
   * bywa potrzebny także na telefonie.
   *
   * Świadomie `matchMedia` wprost, a nie `useIsMobile()`: pytamy RAZ, przy
   * pierwszym renderze. Subskrypcja przestawiałaby widok pod palcami przy
   * obrocie telefonu, kasując świadomy wybór użytkownika.
   */
  const [view, setView] = useState<View>(() =>
    window.matchMedia('(max-width: 639px)').matches ? 'month' : 'week',
  )
  const [anchor, setAnchor] = useState(() => new Date())
  const [target, setTarget] = useState<PublicationTarget | null>(null)
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [params, setParams] = useSearchParams()
  const [group, setGroup] = useState<GroupFilter>(ALL)
  const [locale, setLocale] = useState<LocaleFilter>(ALL)

  const { channels, loading: channelsLoading } = useChannels()
  const { postTypes } = usePostTypes()
  // Potrzebne tylko po to, by wpis dało się powiązać z eventem/konkursem —
  // z tego powiązania liczy się potem wskaźnik nagłośnienia.
  const { items: events } = useEvents()
  const { items: contests } = useContests()

  // Zakres pobierania zależy od widoku. Liczymy go raz — hook publikacji
  // przeładowuje dane, gdy zmienią się granice, więc niestabilne referencje
  // wywołałyby pętlę zapytań.
  const days = useMemo(
    () => (view === 'week' ? weekDays(anchor) : monthGrid(anchor)),
    [view, anchor],
  )
  const from = toDateKey(days[0]!)
  const to = toDateKey(days[days.length - 1]!)

  const { publications, error, loading, createMany, update, remove } = usePublications(from, to)

  const activeChannels = useMemo(() => channels.filter((channel) => channel.isActive), [channels])

  /**
   * Kanały po zawężeniu. Przy 16 wierszach siatka tygodnia nie mieści się na
   * ekranie bez przewijania w poziomie — filtr po platformie albo rynku
   * sprowadza ją do rozmiaru, który da się ogarnąć wzrokiem. Sama reguła
   * (i jej wyjątek dla kanałów bez rynku) siedzi w `domain/calendar.ts`.
   */
  const shownChannels = useMemo(
    () =>
      filterChannels(activeChannels, {
        group: group === ALL ? null : group,
        locale: locale === ALL ? null : locale,
      }),
    [activeChannels, group, locale],
  )

  const localesInUse = useMemo(
    () => LOCALES.filter((code) => activeChannels.some((channel) => channel.locale === code)),
    [activeChannels],
  )

  /**
   * Wejście z pulpitu (`/kalendarz?dzien=YYYY-MM-DD`) otwiera od razu panel
   * tego dnia. Parametr czyścimy, żeby odświeżenie strony nie otwierało go
   * po raz drugi.
   */
  useEffect(() => {
    const day = params.get('dzien')
    if (!day) return

    setAnchor(fromDateKey(day))
    setOpenDay(day)
    setParams({}, { replace: true })
  }, [params, setParams])

  const shift = (direction: -1 | 1) => {
    setAnchor((prev) =>
      view === 'week' ? addDays(prev, 7 * direction) : addMonths(prev, direction),
    )
  }

  const title = view === 'week' ? formatWeekRange(startOfWeek(anchor)) : formatMonthYear(anchor)

  const firstChannelId = activeChannels[0]?.id

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Kalendarz</h1>
          <p className="text-muted-foreground text-sm capitalize">{title}</p>
        </div>

        <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Tabs value={view} onValueChange={(value) => setView(value as View)}>
            <TabsList>
              <TabsTrigger value="week">Tydzień</TabsTrigger>
              <TabsTrigger value="month">Miesiąc</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Poprzedni">
              <ChevronLeftIcon />
            </Button>
            <Button variant="outline" onClick={() => setAnchor(new Date())}>
              Dziś
            </Button>
            <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Następny">
              <ChevronRightIcon />
            </Button>
          </div>

          {firstChannelId && (
            <Button
              onClick={() =>
                setTarget({
                  mode: 'create',
                  publishOn: toDateKey(new Date()),
                  channelId: firstChannelId,
                })
              }
            >
              <PlusIcon />
              Dodaj
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <FilterChips
          ariaLabel="Filtr platform"
          value={group}
          onChange={setGroup}
          options={[
            { value: ALL, label: 'Wszystkie kanały', count: activeChannels.length },
            ...CHANNEL_GROUPS.map((item) => ({
              value: item,
              label: CHANNEL_GROUP_LABEL[item],
              count: activeChannels.filter((channel) => channelGroupOf(channel.platform) === item)
                .length,
            })).filter((option) => option.count > 0),
          ]}
        />

        <FilterChips
          ariaLabel="Filtr rynków"
          value={locale}
          onChange={setLocale}
          options={[
            { value: ALL, label: 'Wszystkie rynki' },
            ...localesInUse.map((code) => ({ value: code, label: code })),
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {postTypes.map((postType) => (
          <span
            key={postType.id}
            className="text-muted-foreground flex items-center gap-1.5 text-xs"
          >
            <span
              className={cn('size-2.5 rounded-full border', postTypeColorClass(postType.color))}
            />
            {postType.name}
          </span>
        ))}
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <span className="border-muted-foreground/60 size-2.5 rounded-full border border-dashed" />
          zaplanowane
        </span>
      </div>

      {channelsLoading || loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : view === 'week' ? (
        <WeekGrid
          days={days}
          channels={shownChannels}
          postTypes={postTypes}
          publications={publications}
          onAdd={(dateKey, channelId) =>
            setTarget({ mode: 'create', publishOn: dateKey, channelId })
          }
          onOpen={(publication) => setTarget({ mode: 'edit', publication })}
          onOpenDay={setOpenDay}
        />
      ) : (
        <MonthGrid
          month={anchor}
          days={days}
          channels={shownChannels}
          postTypes={postTypes}
          publications={publications}
          onOpenDay={setOpenDay}
        />
      )}

      <DaySheet
        dateKey={openDay}
        channels={activeChannels}
        postTypes={postTypes}
        publications={publications}
        onClose={() => setOpenDay(null)}
        onAdd={(dateKey) => {
          if (!firstChannelId) return
          setOpenDay(null)
          setTarget({ mode: 'create', publishOn: dateKey, channelId: firstChannelId })
        }}
        onOpen={(publication) => {
          setOpenDay(null)
          setTarget({ mode: 'edit', publication })
        }}
      />

      <PublicationDialog
        target={target}
        channels={activeChannels}
        postTypes={postTypes}
        events={events}
        contests={contests}
        onClose={() => setTarget(null)}
        onCreate={createMany}
        onUpdate={update}
        onDelete={remove}
      />
    </div>
  )
}
