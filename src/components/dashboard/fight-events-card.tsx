import { SwordsIcon } from 'lucide-react'
import { useMemo } from 'react'

import { SignalCard, SignalRow } from '@/components/dashboard/signal-card'
import { Badge } from '@/components/ui/badge'
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
 * Karta jest CZYSTO INFORMACYJNA — nie ma tu żadnej akcji zapisu. Gale
 * ze źródła zewnętrznego bywają niepełne, więc do naszej domeny trafiają
 * wyłącznie przez świadome dodanie eventu ręcznie.
 */
export function FightEventsCard({ mine, today }: { mine: SportEvent[]; today: Date }) {
  const events = useFightEvents()

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
            detail={`${event.organization}${event.place ? ` · ${event.place}` : ''}`}
            badge={days === 0 ? 'dziś' : `za ${days} dni`}
            trailing={
              owned ? (
                <Badge variant="secondary" className="shrink-0">
                  masz to
                </Badge>
              ) : undefined
            }
          />
        )
      })}
    </SignalCard>
  )
}
