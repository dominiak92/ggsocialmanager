import { useEffect, useState } from 'react'

import { fetchUpcomingFightEvents } from '@/data/external/fight-events'
import type { ExternalFightEvent } from '@/domain/models'
import { toDateKey } from '@/lib/dates'

type State = {
  events: ExternalFightEvent[]
  loading: boolean
}

/**
 * Nadchodzące gale ze źródła zewnętrznego.
 *
 * Celowo NIE wystawia błędu: to dodatek, nie funkcja krytyczna. Gdy cudzy
 * serwer padnie, karta ma po prostu zniknąć z pulpitu, a nie straszyć
 * właściciela komunikatem o awarii, na którą nie ma wpływu.
 */
export function useFightEvents(): State {
  const [events, setEvents] = useState<ExternalFightEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const today = toDateKey(new Date())

    fetchUpcomingFightEvents()
      .then((all) => {
        if (!active) return
        // Źródło potrafi zwrócić galę z dzisiejszą albo wczorajszą datą —
        // „nadchodzące" ma znaczyć nadchodzące.
        setEvents(all.filter((event) => event.startsOn >= today))
      })
      .catch(() => {
        if (active) setEvents([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { events, loading }
}
