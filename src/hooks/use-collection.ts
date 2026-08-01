import { useCallback, useEffect, useState } from 'react'

/**
 * Wspólny hook dla list CRUD-owych (eventy, konkursy, zawodnicy, pomysły).
 *
 * Wszystkie cztery robiły dokładnie to samo — pobierz, dodaj, zmień, usuń,
 * trzymaj ostatni błąd. Zamiast czterech bliźniaczych plików jest jeden,
 * sparametryzowany repozytorium z `data/interfaces`. Hook NIE zna Supabase:
 * dostaje kontrakt, nie implementację.
 */
export type CrudRepo<T, D, P> = {
  list(): Promise<T[]>
  create(draft: D): Promise<T>
  update(id: string, patch: P): Promise<T>
  remove(id: string): Promise<void>
}

export type CollectionState<T, D, P> = {
  items: T[]
  error: string | null
  loading: boolean
  create: (draft: D) => Promise<T>
  update: (id: string, patch: P) => Promise<T>
  remove: (id: string) => Promise<void>
  /** Ponowne pobranie — po operacjach, które zmieniają kolejność. */
  reload: () => void
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Nieznany błąd'
}

export function useCollection<T extends { id: string }, D, P>(
  repo: CrudRepo<T, D, P>,
  /**
   * Porządkowanie listy po zmianie. Bez tego nowy wpis lądowałby na końcu,
   * zamiast tam, gdzie zwróciłaby go baza.
   */
  sortBy?: (a: T, b: T) => number,
): CollectionState<T, D, P> {
  const [items, setItems] = useState<T[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)

    repo
      .list()
      .then((next) => {
        if (!active) return
        setItems(next)
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
  }, [repo, nonce])

  const order = useCallback(
    (next: T[]) => (sortBy ? next.toSorted(sortBy) : next),
    // `sortBy` bywa literałem inline — celowo nie trzymamy go w zależnościach,
    // bo nowa referencja przy każdym renderze przeliczałaby listę bez potrzeby.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const create = useCallback(
    async (draft: D) => {
      try {
        const created = await repo.create(draft)
        setItems((prev) => order([...prev, created]))
        setError(null)
        return created
      } catch (cause: unknown) {
        setError(message(cause))
        throw cause
      }
    },
    [repo, order],
  )

  const update = useCallback(
    async (id: string, patch: P) => {
      try {
        const saved = await repo.update(id, patch)
        setItems((prev) => order(prev.map((item) => (item.id === id ? saved : item))))
        setError(null)
        return saved
      } catch (cause: unknown) {
        setError(message(cause))
        throw cause
      }
    },
    [repo, order],
  )

  const remove = useCallback(
    async (id: string) => {
      try {
        await repo.remove(id)
        setItems((prev) => prev.filter((item) => item.id !== id))
        setError(null)
      } catch (cause: unknown) {
        setError(message(cause))
        throw cause
      }
    },
    [repo],
  )

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  return { items, error, loading, create, update, remove, reload }
}
