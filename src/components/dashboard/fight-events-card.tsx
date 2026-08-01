import { PlusIcon, SwordsIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'

import { SignalCard, SignalRow } from '@/components/dashboard/signal-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SportEvent } from '@/domain/models'
import { useFightEvents } from '@/hooks/use-fight-events'
import { daysBetween, fromDateKey } from '@/lib/dates'

/**
 * Gale z zewnętrznego kalendarza — czysto informacyjnie.
 *
 * Zbudowana na `SignalCard`, żeby wiersz, limit pozycji, „…i jeszcze N"
 * i szkielet ładowania były te same co w pozostałych kartach pulpitu.
 * `hideWhenEmpty` sprawia, że przy awarii cudzego serwera karta po prostu
 * znika — to dodatek, nie funkcja krytyczna.
 *
 * „Dodaj u siebie" nie zapisuje nic po cichu — otwiera formularz eventu
 * z wypełnioną nazwą i datą. Zewnętrzne dane trafiają do naszej domeny
 * WYŁĄCZNIE przez świadomą decyzję właściciela.
 */
export function FightEventsCard({ mine, today }: { mine: SportEvent[]; today: Date }) {
  const events = useFightEvents()
  const navigate = useNavigate()

  /**
   * Klucze gal, które już mamy u siebie — dokładne dopasowanie daty i nazwy.
   * Zbiór budujemy raz, bo karta re-renderuje się przy każdej porcji danych
   * dociąganej przez pulpit.
   */
  const mineKeys = useMemo(
    () => new Set(mine.map((own) => `${own.startsOn}|${own.name.trim().toLowerCase()}`)),
    [mine],
  )

  return (
    <SignalCard
      title="Nadchodzące gale"
      icon={SwordsIcon}
      to="/eventy"
      count={events.length}
      hideWhenEmpty
      headerBadge={
        <Badge variant="outline" className="ml-auto text-[11px] font-normal">
          źródło zewnętrzne
        </Badge>
      }
    >
      {events.map((event) => {
        const days = daysBetween(today, fromDateKey(event.startsOn))
        const owned = mineKeys.has(`${event.startsOn}|${event.name.trim().toLowerCase()}`)

        return (
          <SignalRow
            key={event.id}
            label={event.name}
            detail={`${event.organization}${event.place ? ` · ${event.place}` : ''} · ${
              days === 0 ? 'dziś' : `za ${days} dni`
            }`}
            trailing={
              owned ? (
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
              )
            }
          />
        )
      })}
    </SignalCard>
  )
}
