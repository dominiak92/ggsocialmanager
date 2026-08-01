import { PlusIcon, SwordsIcon } from 'lucide-react'
import { useNavigate } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExternalFightEvent, SportEvent } from '@/domain/models'
import { useFightEvents } from '@/hooks/use-fight-events'
import { daysBetween, fromDateKey } from '@/lib/dates'

const VISIBLE = 5

/**
 * Gale z zewnętrznego kalendarza — czysto informacyjnie.
 *
 * Karta **znika**, gdy źródło nic nie zwróci albo padnie: to dodatek, nie
 * funkcja krytyczna, a pusty kafelek z komunikatem o cudzej awarii tylko
 * zaśmiecałby pulpit.
 *
 * „Dodaj u siebie" nie zapisuje nic po cichu — otwiera formularz eventu
 * z wypełnioną nazwą i datą. Zewnętrzne dane trafiają do naszej domeny
 * WYŁĄCZNIE przez świadomą decyzję właściciela.
 */
export function FightEventsCard({ mine }: { mine: SportEvent[] }) {
  const { events, loading } = useFightEvents()
  const navigate = useNavigate()

  if (loading || events.length === 0) return null

  /** Czy taka gala jest już u nas — po nazwie i dacie, bo id źródła nam nic nie mówi. */
  const alreadyMine = (event: ExternalFightEvent) =>
    mine.some(
      (own) =>
        own.startsOn === event.startsOn &&
        own.name.toLowerCase().includes(event.name.toLowerCase().slice(0, 8)),
    )

  const today = new Date()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SwordsIcon className="size-4" />
          Nadchodzące gale
          <Badge variant="outline" className="ml-auto text-[11px] font-normal">
            źródło zewnętrzne
          </Badge>
        </CardTitle>
        <CardDescription>
          Podgląd z TheSportsDB (KSW, UFC, Oktagon, TKO). Dane bywają niepełne — traktuj jako
          podpowiedź, nie jako pewnik.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ul className="divide-y">
          {events.slice(0, VISIBLE).map((event) => {
            const days = daysBetween(today, fromDateKey(event.startsOn))
            const owned = alreadyMine(event)

            return (
              <li key={event.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{event.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {event.organization}
                    {event.place ? ` · ${event.place}` : ''}
                    {` · ${days === 0 ? 'dziś' : `za ${days} dni`}`}
                  </p>
                </div>

                {owned ? (
                  <Badge variant="secondary" className="shrink-0">
                    masz to
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      navigate(
                        `/eventy?dodaj=${encodeURIComponent(event.name)}&data=${event.startsOn}`,
                      )
                    }
                  >
                    <PlusIcon />
                    Dodaj u siebie
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
