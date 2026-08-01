import { useCallback, useEffect, useState } from 'react'

import { dataProvider } from '@/data/provider'
import type { Channel } from '@/domain/models'

type State = {
  channels: Channel[]
  error: string | null
  loading: boolean
  setActive: (id: string, isActive: boolean) => Promise<void>
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Nieznany błąd'
}

/**
 * Kanały wraz z przełączaniem aktywności.
 *
 * Zmiana jest optymistyczna — przełącznik ma reagować natychmiast. Gdy zapis
 * padnie, wracamy do poprzedniego stanu i pokazujemy błąd.
 */
export function useChannels(): State {
  const [channels, setChannels] = useState<Channel[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    dataProvider.channels
      .list()
      .then((items) => {
        if (!active) return
        setChannels(items)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (active) setError(message(cause))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const setActive = useCallback(async (id: string, isActive: boolean) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, isActive } : c)))

    try {
      await dataProvider.channels.setActive(id, isActive)
      setError(null)
    } catch (cause: unknown) {
      setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !isActive } : c)))
      setError(message(cause))
      throw cause
    }
  }, [])

  return { channels, error, loading, setActive }
}
