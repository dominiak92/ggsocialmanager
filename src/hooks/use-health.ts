import { useEffect, useState } from 'react'

import { dataProvider } from '@/data/provider'
import type { HealthCheck } from '@/domain/models'

type State = {
  data: HealthCheck | null
  error: string | null
  loading: boolean
}

/**
 * Hook zna WYŁĄCZNIE `dataProvider` i model domenowy — nie wie, że pod spodem
 * jest Supabase. To ta sama granica co w `data/interfaces`.
 */
export function useHealth(): State {
  const [state, setState] = useState<State>({ data: null, error: null, loading: true })

  useEffect(() => {
    let active = true

    dataProvider.health
      .get()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false })
      })
      .catch((error: unknown) => {
        if (!active) return
        setState({
          data: null,
          error: error instanceof Error ? error.message : 'Nieznany błąd',
          loading: false,
        })
      })

    return () => {
      active = false
    }
  }, [])

  return state
}
