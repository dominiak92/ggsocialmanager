import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { DaySheet } from '@/components/calendar/day-sheet'
import { MonthGrid } from '@/components/calendar/month-grid'
import { PublicationDialog, type PublicationTarget } from '@/components/calendar/publication-dialog'
import { WeekGrid } from '@/components/calendar/week-grid'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { postTypeColorClass } from '@/domain/enums'
import { useChannels } from '@/hooks/use-channels'
import { usePostTypes } from '@/hooks/use-post-types'
import { usePublications } from '@/hooks/use-publications'
import {
  addDays,
  addMonths,
  formatMonthYear,
  formatWeekRange,
  monthGrid,
  startOfWeek,
  toDateKey,
  weekDays,
} from '@/lib/dates'
import { cn } from '@/lib/utils'

type View = 'week' | 'month'

export function CalendarPage() {
  const [view, setView] = useState<View>('week')
  const [anchor, setAnchor] = useState(() => new Date())
  const [target, setTarget] = useState<PublicationTarget | null>(null)
  const [openDay, setOpenDay] = useState<string | null>(null)

  const { channels, loading: channelsLoading } = useChannels()
  const { postTypes } = usePostTypes()

  // Zakres pobierania zależy od widoku. Liczymy go raz — hook publikacji
  // przeładowuje dane, gdy zmienią się granice, więc niestabilne referencje
  // wywołałyby pętlę zapytań.
  const days = useMemo(
    () => (view === 'week' ? weekDays(anchor) : monthGrid(anchor)),
    [view, anchor],
  )
  const from = toDateKey(days[0]!)
  const to = toDateKey(days[days.length - 1]!)

  const { publications, error, loading, create, update, remove } = usePublications(from, to)

  const activeChannels = useMemo(() => channels.filter((channel) => channel.isActive), [channels])

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

        <div className="ml-auto flex flex-wrap items-center gap-2">
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
          channels={activeChannels}
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
          channels={activeChannels}
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
        onClose={() => setTarget(null)}
        onCreate={create}
        onUpdate={update}
        onDelete={remove}
      />
    </div>
  )
}
