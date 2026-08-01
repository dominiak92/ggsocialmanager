import { useEffect, useState } from 'react'

import { dataProvider } from '@/data/provider'
import type { Channel } from '@/domain/models'
import { silentChannels, type SilentChannel } from '@/domain/reminders'
import { addDays, toDateKey } from '@/lib/dates'

/**
 * Jak daleko wstecz szukamy ostatniej publikacji. Rok wystarczy: kanał
 * milczący dłużej i tak jest raportowany jako „nigdy nic nie poszło",
 * a nie ciągniemy całej historii przy każdym wejściu na pulpit.
 */
const LOOKBACK_DAYS = 365

type State = {
  silent: SilentChannel[]
  error: string | null
  loading: boolean
}

export function useSilentChannels(channels: Channel[]): State {
  const [lastPublished, setLastPublished] = useState<Map<string, string> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const since = toDateKey(addDays(new Date(), -LOOKBACK_DAYS))

    dataProvider.publications
      .lastPublishedPerChannel(since)
      .then((map) => {
        if (!active) return
        setLastPublished(map)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Nieznany błąd')
      })

    return () => {
      active = false
    }
  }, [])

  return {
    silent: lastPublished ? silentChannels(channels, lastPublished, new Date()) : [],
    error,
    loading: lastPublished === null && error === null,
  }
}
