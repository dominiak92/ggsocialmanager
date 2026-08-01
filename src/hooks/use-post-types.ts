import { useEffect, useState } from 'react'

import { dataProvider } from '@/data/provider'
import type { PostType } from '@/domain/models'

type State = {
  postTypes: PostType[]
  error: string | null
  loading: boolean
}

/** Słownik rodzajów postów — zmienia się rzadko, więc bez odświeżania. */
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
        setPostTypes(items)
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
