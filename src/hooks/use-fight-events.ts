import { useEffect, useState } from 'react'

import { fetchUpcomingFightEvents } from '@/data/external/fight-events'
import type { ExternalFightEvent } from '@/domain/models'
import { toDateKey } from '@/lib/dates'

/**
 * Nadchodzące gale ze źródła zewnętrznego.
 *
 * Zwraca samą listę — bez `loading` i bez błędu. To dodatek, nie funkcja
 * krytyczna: dopóki nic nie przyszło, lista jest pusta, a karta i tak się
 * nie renderuje (`hideWhenEmpty`). Osobny stan ładowania niczego by tu nie
 * zmienił, a awaria cudzego serwera nie ma straszyć właściciela komunikatem,
 * na który nie ma wpływu.
 */
export function useFightEvents(): ExternalFightEvent[] {
  const [events, setEvents] = useState<ExternalFightEvent[]>([])

  useEffect(() => {
    let active = true
    const today = toDateKey(new Date())

    fetchUpcomingFightEvents()
      .then((all) => {
        // Źródło przerzuca galę do „minionych" już w dniu jej rozgrywania,
        // więc pytamy oba endpointy i odsiewamy datą tutaj.
        if (active) setEvents(all.filter((event) => event.startsOn >= today))
      })
      .catch(() => {
        // Brak danych = brak karty. Nic do zrobienia.
      })

    return () => {
      active = false
    }
  }, [])

  return events
}
