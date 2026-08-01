import { useCallback, useEffect, useState } from 'react'

import { dataProvider } from '@/data/provider'
import type { Channel, ChannelDraft, ChannelPatch } from '@/domain/models'

type State = {
  channels: Channel[]
  error: string | null
  loading: boolean
  create: (draft: ChannelDraft) => Promise<Channel>
  update: (id: string, patch: ChannelPatch) => Promise<Channel>
  remove: (id: string) => Promise<void>
  /** Skrót na przełącznik w Ustawieniach — zmiana jest optymistyczna. */
  setActive: (id: string, isActive: boolean) => Promise<void>
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Nieznany błąd'
}

/** Ta sama kolejność co z bazy — żeby dodany kanał wskoczył na swoje miejsce. */
function sorted(items: Channel[]): Channel[] {
  return items.toSorted((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'pl'))
}

/** Kanały z pełnym CRUD-em. Lista trzymana w kolejności wyświetlania. */
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

  const create = useCallback(async (draft: ChannelDraft) => {
    try {
      const created = await dataProvider.channels.create(draft)
      setChannels((prev) => sorted([...prev, created]))
      setError(null)
      return created
    } catch (cause: unknown) {
      setError(message(cause))
      throw cause
    }
  }, [])

  const update = useCallback(async (id: string, patch: ChannelPatch) => {
    try {
      const saved = await dataProvider.channels.update(id, patch)
      setChannels((prev) => sorted(prev.map((channel) => (channel.id === id ? saved : channel))))
      setError(null)
      return saved
    } catch (cause: unknown) {
      setError(message(cause))
      throw cause
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    try {
      await dataProvider.channels.remove(id)
      setChannels((prev) => prev.filter((channel) => channel.id !== id))
      setError(null)
    } catch (cause: unknown) {
      setError(message(cause))
      throw cause
    }
  }, [])

  /**
   * Optymistycznie — przełącznik ma reagować natychmiast. Gdy zapis padnie,
   * wracamy do poprzedniego stanu i pokazujemy błąd.
   */
  const setActive = useCallback(async (id: string, isActive: boolean) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, isActive } : c)))

    try {
      await dataProvider.channels.update(id, { isActive })
      setError(null)
    } catch (cause: unknown) {
      setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !isActive } : c)))
      setError(message(cause))
    }
  }, [])

  return { channels, error, loading, create, update, remove, setActive }
}
