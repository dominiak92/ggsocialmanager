import { useCallback, useEffect, useState } from 'react'

import { dataProvider } from '@/data/provider'
import type { Publication, PublicationDraft, PublicationPatch } from '@/domain/models'

type State = {
  publications: Publication[]
  error: string | null
  loading: boolean
  create: (draft: PublicationDraft) => Promise<Publication>
  createMany: (drafts: PublicationDraft[]) => Promise<Publication[]>
  update: (id: string, patch: PublicationPatch) => Promise<Publication>
  remove: (id: string) => Promise<void>
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Nieznany błąd'
}

/**
 * Wpisy kalendarza z jednego zakresu dat.
 *
 * Po zapisie aktualizujemy stan lokalnie zamiast przeładowywać cały zakres —
 * przy odhaczaniu kratka po kratce przeładowanie dawałoby widoczne mignięcie
 * całej siatki.
 */
export function usePublications(from: string, to: string): State {
  const [publications, setPublications] = useState<Publication[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    dataProvider.publications
      .listRange({ from, to })
      .then((items) => {
        if (!active) return
        setPublications(items)
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
  }, [from, to])

  const create = useCallback(async (draft: PublicationDraft) => {
    try {
      const created = await dataProvider.publications.create(draft)
      setPublications((prev) => [...prev, created])
      setError(null)
      return created
    } catch (cause: unknown) {
      setError(message(cause))
      throw cause
    }
  }, [])

  const createMany = useCallback(async (drafts: PublicationDraft[]) => {
    try {
      const created = await dataProvider.publications.createMany(drafts)
      setPublications((prev) => [...prev, ...created])
      setError(null)
      return created
    } catch (cause: unknown) {
      setError(message(cause))
      throw cause
    }
  }, [])

  const update = useCallback(async (id: string, patch: PublicationPatch) => {
    try {
      const saved = await dataProvider.publications.update(id, patch)
      setPublications((prev) => prev.map((p) => (p.id === id ? saved : p)))
      setError(null)
      return saved
    } catch (cause: unknown) {
      setError(message(cause))
      throw cause
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    try {
      await dataProvider.publications.remove(id)
      setPublications((prev) => prev.filter((p) => p.id !== id))
      setError(null)
    } catch (cause: unknown) {
      setError(message(cause))
      throw cause
    }
  }, [])

  return { publications, error, loading, create, createMany, update, remove }
}
