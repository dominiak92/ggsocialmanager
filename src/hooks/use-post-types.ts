import { useEffect, useState } from 'react'

import { dataProvider } from '@/data/provider'
import { useCollection } from '@/hooks/use-collection'
import type { PostType } from '@/domain/models'

type State = {
  postTypes: PostType[]
  error: string | null
  loading: boolean
}

/**
 * Słownik rodzajów postów.
 *
 * `usePostTypes()` daje tylko AKTYWNE — kalendarz nie ma proponować rodzaju
 * wycofanego z użycia. Pełną listę (do Ustawień) daje `usePostTypeAdmin`.
 */
export function usePostTypes(): State {
  const [postTypes, setPostTypes] = useState<PostType[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    dataProvider.postTypes
      .list()
      .then((items) => {
        if (!active) return
        setPostTypes(items.filter((postType) => postType.isActive))
        setError(null)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Nieznany błąd')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { postTypes, error, loading }
}

/** Pełna lista z CRUD-em — wyłącznie dla Ustawień. */
export function usePostTypeAdmin() {
  return useCollection(dataProvider.postTypes, (a, b) => a.sortOrder - b.sortOrder)
}
